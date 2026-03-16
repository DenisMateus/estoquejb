import { useEffect, useState } from 'react';
import { getProducts, Product, CategoryType, CATEGORY_LABELS } from '@/lib/inventory';
import AppLayout from '@/components/AppLayout';
import { FileSpreadsheet, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filterCategory, setFilterCategory] = useState<'todos' | CategoryType>('todos');

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const filtered = filterCategory === 'todos'
    ? products
    : products.filter(p => p.category === filterCategory);

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const exportToExcel = () => {
    const data = filtered.map(p => {
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

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contagem Estoque');

    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(r => String(r[key]).length)) + 2
    }));
    ws['!cols'] = colWidths;

    const categoryLabel = filterCategory === 'todos' ? 'Todos' :
      (CATEGORY_LABELS[filterCategory as CategoryType] || filterCategory).replace(/\s/g, '');
    XLSX.writeFile(wb, `Contagem_Estoque_${categoryLabel}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => { window.print(); };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">Relatórios de Estoque</h2>
          <div className="flex gap-2">
            <button onClick={exportToExcel} disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 bg-success text-success-foreground font-semibold px-4 py-2 rounded-md hover:bg-success/90 transition-colors text-sm disabled:opacity-50">
              <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
            </button>
            <button onClick={handlePrint}
              className="inline-flex items-center gap-2 border font-semibold px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        <div className="flex gap-1">
          {([['todos', 'Todos'], ['ferro_redondo', 'Ferro Redondo'], ['tubo_aco', 'Tubo de Aço']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilterCategory(val)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                ${filterCategory === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-lg border overflow-x-auto print:shadow-none" id="report-table">
          <div className="px-5 py-3 border-b print:hidden">
            <p className="text-sm text-muted-foreground">
              Relatório para contagem física — {filtered.length} produtos
            </p>
          </div>
          <div className="hidden print:block px-5 py-4">
            <h1 className="text-lg font-bold">Estoque Jhonrob — Relatório de Contagem</h1>
            <p className="text-sm">Data: {new Date().toLocaleDateString('pt-BR')} | Categoria: {
              filterCategory === 'todos' ? 'Todos' :
              filterCategory === 'ferro_redondo' ? 'Ferro Redondo' : 'Tubo de Aço'
            }</p>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3 + daysOfWeek.length} className="px-5 py-8 text-center text-muted-foreground">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
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
      </div>
    </AppLayout>
  );
};

export default Reports;
