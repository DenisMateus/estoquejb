import { useEffect, useState, useMemo } from 'react';
import { getProducts, getMovements, Product, Movement, CategoryType, CATEGORY_LABELS, SectorType } from '@/lib/inventory';
import AppLayout from '@/components/AppLayout';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import logoHeader from '@/assets/logo_header.png';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
];

const SECTOR_LABELS: Record<SectorType, string> = {
  usinagem: 'Usinagem',
  guilhotina: 'Guilhotina',
};

function buildSectorChartData(products: Product[], movements: Movement[], sector: SectorType) {
  const sectorProductIds = new Set(products.filter(p => p.sector === sector).map(p => p.id));
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthExits = movements.filter(
    m => m.type === 'saida' && m.date.startsWith(currentMonth) && sectorProductIds.has(m.productId)
  );

  const grouped: Record<string, number> = {};
  monthExits.forEach(m => {
    const key = m.productDescription || m.productCode;
    grouped[key] = (grouped[key] || 0) + m.quantity;
  });

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

const SectorChart = ({ data, title }: { data: { name: string; value: number }[]; title: string }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    data.forEach((item, i) => {
      config[item.name] = { label: item.name, color: COLORS[i % COLORS.length] };
    });
    return config;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-5">
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma saída neste mês</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-5">
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">Saídas agrupadas por produto no mês atual</p>
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <ChartContainer config={chartConfig} className="h-[220px] w-[220px]">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={90} paddingAngle={2} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="flex flex-col gap-1.5 text-sm">
          {data.map((item, i) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-foreground text-xs">{item.name}</span>
                <span className="text-muted-foreground ml-auto font-mono text-xs">{item.value} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Reports = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filterCategory, setFilterCategory] = useState<'todos' | CategoryType>('todos');

  useEffect(() => {
    Promise.all([getProducts(), getMovements()]).then(([p, m]) => {
      setProducts(p);
      setMovements(m);
    });
  }, []);

  const usinagemProducts = products.filter(p => p.sector === 'usinagem');
  const guilhotinaProducts = products.filter(p => p.sector === 'guilhotina');

  const filterProducts = (list: Product[]) =>
    filterCategory === 'todos' ? list : list.filter(p => p.category === filterCategory);

  const filteredUsinagem = filterProducts(usinagemProducts);
  const filteredGuilhotina = filterProducts(guilhotinaProducts);

  const usinagemChartData = useMemo(() => buildSectorChartData(products, movements, 'usinagem'), [products, movements]);
  const guilhotinaChartData = useMemo(() => buildSectorChartData(products, movements, 'guilhotina'), [products, movements]);

  const currentMonthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const exportToExcel = () => {
    const makeSectorSheet = (items: Product[], sectorLabel: string) => {
      const data = items.map(p => {
        const row: Record<string, any> = {
          'Código': p.code,
          'Descrição': p.description,
          'Categoria': CATEGORY_LABELS[p.category as CategoryType] || p.category,
          'Unidade': p.unit,
          'Estoque Sistema': p.quantity,
        };
        daysOfWeek.forEach(day => { row[day] = ''; });
        return row;
      });
      if (data.length === 0) return null;
      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, ...data.map(r => String(r[key]).length)) + 2
      }));
      ws['!cols'] = colWidths;
      return { ws, label: sectorLabel };
    };

    const wb = XLSX.utils.book_new();
    const sheets = [
      makeSectorSheet(filteredUsinagem, 'Usinagem'),
      makeSectorSheet(filteredGuilhotina, 'Guilhotina'),
    ].filter(Boolean) as { ws: XLSX.WorkSheet; label: string }[];

    if (sheets.length === 0) return;
    sheets.forEach(s => XLSX.utils.book_append_sheet(wb, s.ws, s.label));

    const categoryLabel = filterCategory === 'todos' ? 'Todos' :
      (CATEGORY_LABELS[filterCategory as CategoryType] || filterCategory).replace(/\s/g, '');
    XLSX.writeFile(wb, `Contagem_Estoque_${categoryLabel}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => { window.print(); };

  const SectorTable = ({ items, sectorLabel }: { items: Product[]; sectorLabel: string }) => (
    <div className="bg-card rounded-lg border overflow-x-auto print:shadow-none print:break-before-page">
      <div className="hidden print:flex px-5 py-4 items-center gap-3 border-b">
        <img src={logoHeader} alt="Jhonrob" className="h-10" />
        <div>
          <h1 className="text-lg font-bold">Relatório de Contagem — {sectorLabel}</h1>
          <p className="text-sm">Data: {new Date().toLocaleDateString('pt-BR')} | Categoria: {
            filterCategory === 'todos' ? 'Todos' :
            CATEGORY_LABELS[filterCategory as CategoryType] || filterCategory
          }</p>
        </div>
      </div>
      <div className="px-5 py-3 border-b print:hidden">
        <p className="text-sm font-semibold text-foreground">{sectorLabel}</p>
        <p className="text-xs text-muted-foreground">{items.length} produtos</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Estoque Sistema</th>
            {daysOfWeek.map(day => (
              <th key={day} className="text-center px-3 py-3 font-medium text-muted-foreground text-xs">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3 + daysOfWeek.length} className="px-5 py-8 text-center text-muted-foreground">
                Nenhum produto encontrado
              </td>
            </tr>
          ) : (
            items.map(p => (
              <tr key={p.id} className="border-b last:border-0 table-row-alt">
                <td className="px-4 py-2.5 font-mono font-semibold text-primary">{p.code}</td>
                <td className="px-4 py-2.5">{p.description}</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold">{p.quantity} {p.unit}</td>
                {daysOfWeek.map(day => (
                  <td key={day} className="px-3 py-2.5 text-center">
                    <div className="w-12 h-6 border border-border rounded mx-auto" />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <h2 className="text-xl font-bold text-foreground">Relatórios de Estoque</h2>
          <div className="flex gap-2">
            <button onClick={exportToExcel} disabled={filteredUsinagem.length === 0 && filteredGuilhotina.length === 0}
              className="inline-flex items-center gap-2 bg-success text-success-foreground font-semibold px-4 py-2 rounded-md hover:bg-success/90 transition-colors text-sm disabled:opacity-50">
              <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
            </button>
            <button onClick={handlePrint}
              className="inline-flex items-center gap-2 border font-semibold px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
          <SectorChart data={usinagemChartData} title={`Usinagem — ${currentMonthLabel}`} />
          <SectorChart data={guilhotinaChartData} title={`Guilhotina — ${currentMonthLabel}`} />
        </div>

        <div className="flex flex-wrap gap-1 print:hidden">
          {([['todos', 'Todos'], ...Object.entries(CATEGORY_LABELS)] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilterCategory(val as 'todos' | CategoryType)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${filterCategory === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tables per sector */}
        <SectorTable items={filteredUsinagem} sectorLabel="Usinagem" />
        <SectorTable items={filteredGuilhotina} sectorLabel="Guilhotina" />
      </div>
    </AppLayout>
  );
};

export default Reports;
