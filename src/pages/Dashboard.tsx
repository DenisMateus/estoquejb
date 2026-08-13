import { useEffect, useState, useMemo } from 'react';
import { getProducts, getMovements, Product, Movement, formatQuantity } from '@/lib/inventory';
import { getMtdProducts, getMtdMovements, MtdProduct, MtdMovement, MTD_TYPE_LABELS } from '@/lib/mtd';
import {
  getVentStock, getVentPending, getVentMovements,
  VentiladorStock, VentiladorPending, VentiladorMovement, VENT_TIPO_LABELS,
} from '@/lib/ventiladores';
import { Package, ArrowDownCircle, ArrowUpCircle, Activity, Cog, Fan, AlertTriangle, Clock } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

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

const StatCard = ({
  icon: Icon, label, value, hint, tone = 'primary',
}: { icon: any; label: string; value: string | number; hint?: string; tone?: string }) => (
  <div className="stat-card">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg bg-${tone}/10 flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 text-${tone}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
      </div>
    </div>
  </div>
);

const Panel = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-lg border">
    <div className="px-5 py-4 border-b">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [mtdProducts, setMtdProducts] = useState<MtdProduct[]>([]);
  const [mtdMovements, setMtdMovements] = useState<MtdMovement[]>([]);
  const [ventStock, setVentStock] = useState<VentiladorStock[]>([]);
  const [ventPending, setVentPending] = useState<VentiladorPending[]>([]);
  const [ventMovements, setVentMovements] = useState<VentiladorMovement[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, m, mp, mm, vs, vp, vm] = await Promise.all([
        getProducts(), getMovements(), getMtdProducts(), getMtdMovements(),
        getVentStock(), getVentPending(), getVentMovements(),
      ]);
      setProducts(p); setMovements(m);
      setMtdProducts(mp); setMtdMovements(mm);
      setVentStock(vs); setVentPending(vp); setVentMovements(vm);
    };
    load();
  }, []);

  const totalProducts = products.length;
  const ferroCount = products.filter(p => p.category === 'ferro_redondo').length;
  const tuboCount = products.filter(p => p.category === 'tubo_aco').length;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonth = monthKey(now);
  const todayMovements = movements.filter(m => m.date === today);
  const todayEntries = todayMovements.filter(m => m.type === 'entrada').length;
  const todayExits = todayMovements.filter(m => m.type === 'saida').length;

  const recentMovements = movements.slice(0, 8);

  const monthlyUsageData = useMemo(() => {
    const monthExits = movements.filter(m => m.type === 'saida' && m.date.startsWith(currentMonth));
    const grouped: Record<string, number> = {};
    monthExits.forEach(m => {
      const key = m.productDescription || m.productCode;
      grouped[key] = (grouped[key] || 0) + m.quantity;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.floor(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [movements, currentMonth]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    monthlyUsageData.forEach((item, i) => {
      config[item.name] = { label: item.name, color: COLORS[i % COLORS.length] };
    });
    return config;
  }, [monthlyUsageData]);

  const totalUsage = monthlyUsageData.reduce((sum, d) => sum + d.value, 0);
  const currentMonthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // MTD
  const mtdAvailable = mtdProducts.filter(p => p.status === 'disponivel' && p.quantity > 0);
  const mtdReserved = mtdProducts.filter(p => p.status === 'reservado');
  const mtdSold = mtdProducts.filter(p => p.status === 'vendido');
  const mtdByType = useMemo(() => {
    const grouped: Record<string, number> = {};
    mtdProducts.filter(p => p.quantity > 0).forEach(p => {
      const label = MTD_TYPE_LABELS[p.mtdType] || p.mtdType;
      grouped[label] = (grouped[label] || 0) + p.quantity;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [mtdProducts]);
  const mtdTypeConfig = useMemo(() => {
    const c: Record<string, { label: string; color: string }> = {};
    mtdByType.forEach((d, i) => { c[d.name] = { label: d.name, color: COLORS[i % COLORS.length] }; });
    return { value: { label: 'Qtd', color: 'hsl(var(--chart-1))' }, ...c };
  }, [mtdByType]);

  // Ventiladores
  const ventAvailable = ventStock.filter(v => v.status === 'disponivel');
  const ventReserved = ventStock.filter(v => v.status === 'reservado');
  const ventNegativa = ventPending.filter(v => v.negativa);
  const pendingQty = ventPending.reduce((s, v) => s + (v.quantidade || 0), 0);
  const ventByTipo = useMemo(() => {
    const grouped: Record<string, { name: string; estoque: number; pendente: number }> = {};
    const ensure = (name: string) => (grouped[name] ||= { name, estoque: 0, pendente: 0 });
    ventStock.forEach(v => { ensure(VENT_TIPO_LABELS[v.tipo] || v.tipo).estoque += 1; });
    ventPending.forEach(v => { ensure(VENT_TIPO_LABELS[v.tipo] || v.tipo).pendente += v.quantidade || 0; });
    return Object.values(grouped);
  }, [ventStock, ventPending]);

  // 6-month trend across modules
  const trendData = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: d.toLocaleDateString('pt-BR', { month: 'short' }) });
    }
    return months.map(({ key, label }) => ({
      name: label,
      usinagem: movements.filter(m => m.type === 'saida' && m.date.startsWith(key)).length,
      mtd: mtdMovements.filter(m => m.type === 'saida' && m.date.startsWith(key)).length,
      ventiladores: ventMovements.filter(m => m.type === 'saida' && m.date.startsWith(key)).length,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements, mtdMovements, ventMovements]);

  const trendConfig = {
    usinagem: { label: 'Usinagem/Guilhotina', color: 'hsl(var(--chart-1))' },
    mtd: { label: 'Motorredutores', color: 'hsl(var(--chart-2))' },
    ventiladores: { label: 'Ventiladores', color: 'hsl(var(--chart-3))' },
  };

  const ventConfig = {
    estoque: { label: 'Em estoque', color: 'hsl(var(--chart-3))' },
    pendente: { label: 'Pendentes', color: 'hsl(var(--chart-2))' },
  };

  const formatDateTime = (createdAt: string) => new Date(createdAt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">Painel de Controle</h2>
          <p className="text-sm text-muted-foreground">Visão geral de Usinagem, Guilhotina, Motorredutores e Ventiladores</p>
        </div>

        {/* Materiais */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Materiais — Usinagem / Guilhotina</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Total Produtos" value={totalProducts} hint={`Ferro: ${ferroCount} | Tubo: ${tuboCount}`} tone="primary" />
            <StatCard icon={Activity} label="Movimentações totais" value={movements.length} hint="histórico completo" tone="accent" />
            <StatCard icon={ArrowDownCircle} label="Entradas Hoje" value={todayEntries} tone="success" />
            <StatCard icon={ArrowUpCircle} label="Saídas Hoje" value={todayExits} tone="destructive" />
          </div>
        </section>

        {/* MTD + Ventiladores */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Motorredutores &amp; Ventiladores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Cog} label="MTD disponíveis" value={mtdAvailable.reduce((s, p) => s + p.quantity, 0)} hint={`${mtdProducts.length} registros`} tone="primary" />
            <StatCard icon={Clock} label="MTD reservados / vendidos" value={`${mtdReserved.length} / ${mtdSold.length}`} hint={`${mtdMovements.length} movimentações`} tone="accent" />
            <StatCard icon={Fan} label="Ventiladores em estoque" value={ventStock.length} hint={`${ventAvailable.length} disponíveis · ${ventReserved.length} reservados`} tone="success" />
            <StatCard icon={AlertTriangle} label="Pendências ventiladores" value={pendingQty} hint={`${ventPending.length} itens · ${ventNegativa.length} em negativa`} tone="destructive" />
          </div>
        </section>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel title={`Consumo de Materiais — ${currentMonthLabel}`} subtitle="Saídas agrupadas por produto no mês atual">
            {monthlyUsageData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhuma saída registrada neste mês</p>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ChartContainer config={chartConfig} className="h-[260px] w-[260px]">
                  <PieChart>
                    <Pie data={monthlyUsageData} cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={2} dataKey="value">
                      {monthlyUsageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-col gap-2 text-sm flex-1 w-full">
                  {monthlyUsageData.map((item, i) => {
                    const pct = totalUsage > 0 ? ((item.value / totalUsage) * 100).toFixed(1) : '0';
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground truncate">{item.name}</span>
                        <span className="text-muted-foreground ml-auto font-mono whitespace-nowrap">{formatQuantity(item.value)} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Estoque de Motorredutores por equipamento" subtitle="Quantidade disponível por tipo de MTD">
            {mtdByType.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhum motorredutor em estoque</p>
            ) : (
              <ChartContainer config={mtdTypeConfig} className="h-[300px] w-full">
                <BarChart data={mtdByType} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={110} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={4}>
                    {mtdByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </Panel>

          <Panel title="Ventiladores: estoque x pendências" subtitle="Comparativo por tipo de ventilador">
            {ventByTipo.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhum ventilador cadastrado</p>
            ) : (
              <ChartContainer config={ventConfig} className="h-[280px] w-full">
                <BarChart data={ventByTipo} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="estoque" fill="hsl(var(--chart-3))" radius={4} />
                  <Bar dataKey="pendente" fill="hsl(var(--chart-2))" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </Panel>

          <Panel title="Saídas nos últimos 6 meses" subtitle="Comparativo entre os módulos do sistema">
            <ChartContainer config={trendConfig} className="h-[280px] w-full">
              <LineChart data={trendData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="usinagem" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mtd" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ventiladores" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </Panel>
        </div>

        {/* Recent tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-foreground">Últimas Movimentações — Materiais</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Data / Hora</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Nenhuma movimentação registrada</td></tr>
                  ) : recentMovements.map(m => (
                    <tr key={m.id} className="border-b last:border-0 table-row-alt">
                      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                      <td className="px-4 py-2 font-mono font-medium whitespace-nowrap">{m.productCode}</td>
                      <td className="px-4 py-2 max-w-[240px] truncate" title={m.productDescription}>{m.productDescription}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${m.type === 'entrada' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {m.type === 'entrada' ? '▼ Entrada' : '▲ Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-medium whitespace-nowrap">{formatQuantity(m.quantity)} {m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-foreground">Últimas Movimentações — MTD &amp; Ventiladores</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Módulo</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...mtdMovements.slice(0, 8).map(m => ({
                      id: `mtd-${m.id}`, modulo: 'MTD', code: m.mtdProductCode,
                      cliente: m.clienteDestino, type: m.type, createdAt: m.createdAt,
                    })),
                    ...ventMovements.slice(0, 8).map(m => ({
                      id: `v-${m.id}`, modulo: 'Ventilador', code: m.code,
                      cliente: m.cliente, type: m.type, createdAt: m.createdAt,
                    })),
                  ]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .slice(0, 8)
                    .map(m => (
                      <tr key={m.id} className="border-b last:border-0 table-row-alt">
                        <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{m.modulo}</span>
                        </td>
                        <td className="px-4 py-2 font-mono font-medium whitespace-nowrap">{m.code}</td>
                        <td className="px-4 py-2 max-w-[160px] truncate" title={m.cliente}>{m.cliente || '—'}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${m.type === 'entrada' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {m.type === 'entrada' ? '▼ Entrada' : '▲ Saída'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {mtdMovements.length === 0 && ventMovements.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Nenhuma movimentação registrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
