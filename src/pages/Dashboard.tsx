import { useEffect, useState } from 'react';
import { getProducts, getMovements, Product, Movement } from '@/lib/inventory';
import { Package, ArrowDownCircle, ArrowUpCircle, Activity } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, m] = await Promise.all([getProducts(), getMovements()]);
      setProducts(p);
      setMovements(m);
    };
    load();
  }, []);

  const totalProducts = products.length;
  const ferroCount = products.filter(p => p.category === 'ferro_redondo').length;
  const tuboCount = products.filter(p => p.category === 'tubo_aco').length;

  const today = new Date().toISOString().split('T')[0];
  const todayMovements = movements.filter(m => m.date === today);
  const todayEntries = todayMovements.filter(m => m.type === 'entrada').length;
  const todayExits = todayMovements.filter(m => m.type === 'saida').length;

  const recentMovements = movements.slice(0, 10);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Painel de Controle</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Produtos</p>
                <p className="text-2xl font-bold font-mono text-foreground">{totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ferro: {ferroCount} | Tubo: {tuboCount}</p>
                <p className="text-2xl font-bold font-mono text-foreground">{movements.length}</p>
                <p className="text-xs text-muted-foreground">movimentações totais</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas Hoje</p>
                <p className="text-2xl font-bold font-mono text-foreground">{todayEntries}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saídas Hoje</p>
                <p className="text-2xl font-bold font-mono text-foreground">{todayExits}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-foreground">Últimas Movimentações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      Nenhuma movimentação registrada
                    </td>
                  </tr>
                ) : (
                  recentMovements.map(m => (
                    <tr key={m.id} className="border-b last:border-0 table-row-alt">
                      <td className="px-5 py-3 font-mono text-xs">{m.date}</td>
                      <td className="px-5 py-3 font-mono font-medium">{m.productCode}</td>
                      <td className="px-5 py-3">{m.productDescription}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                          ${m.type === 'entrada'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                          }`}>
                          {m.type === 'entrada' ? '▼ Entrada' : '▲ Saída'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-medium">
                        {m.quantity} {m.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
