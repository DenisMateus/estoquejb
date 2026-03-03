import { useEffect, useState } from 'react';
import { getProducts, addMovement, getMovements, Product, Movement } from '@/lib/inventory';
import AppLayout from '@/components/AppLayout';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';

const Movements = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'todos' | 'entrada' | 'saida'>('todos');

  const reload = async () => {
    try {
      const [p, m] = await Promise.all([getProducts(), getMovements()]);
      setProducts(p);
      setMovements(m);
    } catch (err: any) {
      toast.error('Erro ao carregar dados');
    }
  };
  useEffect(() => { reload(); }, []);

  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error('Selecione um produto'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { toast.error('Quantidade inválida'); return; }

    try {
      await addMovement({
        productId: selectedProduct.id,
        productCode: selectedProduct.code,
        productDescription: selectedProduct.description,
        type,
        quantity: qty,
        unit: selectedProduct.unit,
        date,
      });
      toast.success(`${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      setQuantity('');
      setProductId('');
      reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredMovements = filterType === 'todos'
    ? movements
    : movements.filter(m => m.type === filterType);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Movimentações de Estoque</h2>

        <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-5 space-y-4">
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setType('entrada')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors
                ${type === 'entrada' ? 'btn-entry' : 'bg-muted text-muted-foreground'}`}>
              <ArrowDownCircle className="w-4 h-4" /> Entrada
            </button>
            <button type="button" onClick={() => setType('saida')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors
                ${type === 'saida' ? 'btn-exit' : 'bg-muted text-muted-foreground'}`}>
              <ArrowUpCircle className="w-4 h-4" /> Saída
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Produto</label>
              <select value={productId} onChange={e => setProductId(e.target.value)} className="input-steel w-full" required>
                <option value="">Selecione...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.description} (Estoque: {p.quantity} {p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Quantidade ({selectedProduct?.unit || 'un'})
              </label>
              <input type="number" step="0.01" min="0.01" value={quantity}
                onChange={e => setQuantity(e.target.value)} className="input-steel w-full font-mono" placeholder="0.00" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-steel w-full font-mono" required />
            </div>
          </div>

          <button type="submit" className={`font-semibold px-6 py-2 rounded-md text-sm transition-colors
            ${type === 'entrada' ? 'btn-entry' : 'btn-exit'}`}>
            Registrar {type === 'entrada' ? 'Entrada' : 'Saída'}
          </button>
        </form>

        <div className="bg-card rounded-lg border">
          <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">Histórico de Movimentações</h3>
            <div className="flex gap-1">
              {(['todos', 'entrada', 'saida'] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors
                    ${filterType === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {f === 'todos' ? 'Todos' : f === 'entrada' ? 'Entradas' : 'Saídas'}
                </button>
              ))}
            </div>
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
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Un</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      Nenhuma movimentação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(m => (
                    <tr key={m.id} className="border-b last:border-0 table-row-alt">
                      <td className="px-5 py-3 font-mono text-xs">{m.date}</td>
                      <td className="px-5 py-3 font-mono font-medium">{m.productCode}</td>
                      <td className="px-5 py-3">{m.productDescription}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                          ${m.type === 'entrada' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {m.type === 'entrada' ? '▼ Entrada' : '▲ Saída'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold">{m.quantity}</td>
                      <td className="px-5 py-3 uppercase font-mono text-xs">{m.unit}</td>
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

export default Movements;
