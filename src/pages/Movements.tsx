import { useEffect, useState, useCallback } from 'react';
import { getProducts, addMovement, getMovements, Product, Movement } from '@/lib/inventory';
import AppLayout from '@/components/AppLayout';
import { ArrowDownCircle, ArrowUpCircle, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';

function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

const Movements = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'todos' | 'entrada' | 'saida'>('todos');

  // CAPTCHA state
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error('Selecione um produto'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { toast.error('Quantidade inválida'); return; }

    // Show CAPTCHA instead of submitting directly
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError(false);
    setShowCaptcha(true);
  };

  const confirmMovement = async () => {
    if (parseInt(captchaInput) !== captcha.answer) {
      setCaptchaError(true);
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
      return;
    }

    setShowCaptcha(false);
    if (!selectedProduct) return;
    const qty = parseFloat(quantity);

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

  const formatDateTime = (createdAt: string) => {
    const d = new Date(createdAt);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

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
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Data / Hora</th>
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
                      <td className="px-5 py-3 font-mono text-xs">{formatDateTime(m.createdAt)}</td>
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

      {/* Confirmation Modal */}
      {showCaptcha && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCaptcha(false)}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-lg">Confirmação</h3>
              </div>
              <button onClick={() => setShowCaptcha(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
              <p className="text-foreground font-medium">
                <span className="font-bold">{selectedProduct?.code} — {selectedProduct?.description}</span>
              </p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {quantity} {selectedProduct?.unit}
              </p>
              <p className={`text-xs font-semibold uppercase ${type === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                {type === 'entrada' ? '▼ Entrada' : '▲ Saída'}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCaptcha(false)} className="px-4 py-2 rounded-md text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmMovement} className="px-4 py-2 rounded-md text-sm font-semibold bg-success text-success-foreground hover:bg-success/90 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Movements;
