import { useEffect, useState, useMemo } from 'react';
import { getProducts, addMovement, getMovements, applyInventoryCount, Product, Movement, formatQuantity, SectorType } from '@/lib/inventory';
import AppLayout from '@/components/AppLayout';
import { ArrowDownCircle, ArrowUpCircle, ShieldCheck, X, ChevronLeft, ChevronRight, ClipboardList, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

const Movements = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [inputMode, setInputMode] = useState<'barra' | 'peso'>('barra');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<'todos' | 'entrada' | 'saida' | 'inventario'>('todos');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Inventory tab state
  const [invSector, setInvSector] = useState<SectorType>(() => (localStorage.getItem('inv_sector') as SectorType) || 'usinagem');
  const [invDate, setInvDate] = useState(() => localStorage.getItem('inv_date') || new Date().toISOString().split('T')[0]);
  const [invCounts, setInvCounts] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(`inv_counts_${localStorage.getItem('inv_sector') || 'usinagem'}`);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [invSearch, setInvSearch] = useState('');
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [invConfirm, setInvConfirm] = useState(false);

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

  // Persist inventory state
  useEffect(() => { localStorage.setItem('inv_sector', invSector); }, [invSector]);
  useEffect(() => { localStorage.setItem('inv_date', invDate); }, [invDate]);
  useEffect(() => {
    localStorage.setItem(`inv_counts_${invSector}`, JSON.stringify(invCounts));
  }, [invCounts, invSector]);

  const switchInvSector = (s: SectorType) => {
    setInvSector(s);
    try {
      const raw = localStorage.getItem(`inv_counts_${s}`);
      setInvCounts(raw ? JSON.parse(raw) : {});
    } catch { setInvCounts({}); }
  };

  const selectedProduct = products.find(p => p.id === productId);

  const isBarraProduct = selectedProduct?.unit === 'barra';
  const computedBarras = (() => {
    if (!selectedProduct) return 0;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return 0;
    if (isBarraProduct && inputMode === 'peso') {
      const wpu = selectedProduct.weightPerUnit || 0;
      if (wpu <= 0) return 0;
      return qty / wpu;
    }
    return qty;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error('Selecione um produto'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { toast.error('Quantidade inválida'); return; }
    if (isBarraProduct && inputMode === 'peso' && (!selectedProduct.weightPerUnit || selectedProduct.weightPerUnit <= 0)) {
      toast.error('Produto não possui peso unitário cadastrado'); return;
    }

    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError(false);
    setShowCaptcha(true);
  };

  const confirmMovement = async () => {
    setShowCaptcha(false);
    if (!selectedProduct) return;
    const finalQty = computedBarras;
    if (finalQty <= 0) { toast.error('Quantidade inválida'); return; }

    try {
      await addMovement({
        productId: selectedProduct.id,
        productCode: selectedProduct.code,
        productDescription: selectedProduct.description,
        type,
        quantity: finalQty,
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

  const monthKey = getMonthKey(selectedMonth);
  const filteredMovements = useMemo(() => {
    return movements
      .filter(m => m.date.startsWith(monthKey))
      .filter(m => {
        if (filterType === 'todos') return true;
        if (filterType === 'inventario') return m.origem === 'inventario';
        return m.type === filterType;
      });
  }, [movements, monthKey, filterType]);

  const monthEntries = filteredMovements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
  const monthExits = filteredMovements.filter(m => m.type === 'saida').reduce((s, m) => s + m.quantity, 0);

  const prevMonth = () => setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (next <= new Date()) setSelectedMonth(next);
  };
  const isCurrentMonth = getMonthKey(selectedMonth) === getMonthKey(new Date());

  const formatDateTime = (createdAt: string) => {
    const d = new Date(createdAt);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ====== Inventory tab ======
  const sectorProducts = useMemo(
    () => products.filter(p => p.sector === invSector)
      .filter(p => {
        if (!invSearch.trim()) return true;
        const q = invSearch.toLowerCase();
        return p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }),
    [products, invSector, invSearch]
  );

  const invDiffs = useMemo(() => {
    return sectorProducts
      .map(p => {
        const raw = invCounts[p.id];
        if (raw === undefined || raw === '') return null;
        const counted = parseFloat(raw);
        if (isNaN(counted) || counted < 0) return null;
        const diff = counted - p.quantity;
        return { product: p, counted, diff };
      })
      .filter((x): x is { product: Product; counted: number; diff: number } => x !== null && x.diff !== 0);
  }, [sectorProducts, invCounts]);

  const handleConcludeInventory = async () => {
    if (invDiffs.length === 0) {
      toast.error('Nenhuma diferença para registrar');
      return;
    }
    setInvSubmitting(true);
    try {
      const n = await applyInventoryCount(
        invDiffs.map(d => ({ product: d.product, countedQty: d.counted })),
        invDate,
      );
      toast.success(`Inventário concluído: ${n} ajuste(s) registrado(s)`);
      setInvCounts({});
      setInvConfirm(false);
      reload();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao concluir inventário');
    } finally {
      setInvSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Movimentações de Estoque</h2>

        <Tabs defaultValue="movimentacoes" className="w-full">
          <TabsList>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="inventario" className="gap-2">
              <ClipboardList className="w-4 h-4" /> Inventário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movimentacoes" className="space-y-6">
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
                    {p.code} - {p.description} (Estoque: {formatQuantity(p.quantity)} {p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Quantidade ({isBarraProduct ? (inputMode === 'peso' ? 'kg' : 'barra') : (selectedProduct?.unit || 'un')})
              </label>
              {isBarraProduct && (
                <div className="flex gap-1 mb-1">
                  <button type="button" onClick={() => setInputMode('barra')}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${inputMode === 'barra' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    Por Barra
                  </button>
                  <button type="button" onClick={() => setInputMode('peso')}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${inputMode === 'peso' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    Por Peso (kg)
                  </button>
                </div>
              )}
              <input type="number" step="0.01" min="0.01" value={quantity}
                onChange={e => setQuantity(e.target.value)} className="input-steel w-full font-mono" placeholder="0.00" required />
              {isBarraProduct && inputMode === 'peso' && computedBarras > 0 && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  ≈ {computedBarras.toFixed(2)} barra(s) (peso unit.: {selectedProduct?.weightPerUnit} kg)
                </p>
              )}
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
          <div className="px-5 py-4 border-b space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground">Histórico de Movimentações</h3>
              <div className="flex gap-1 flex-wrap">
                {(['todos', 'entrada', 'saida', 'inventario'] as const).map(f => (
                  <button key={f} onClick={() => setFilterType(f)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors
                      ${filterType === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {f === 'todos' ? 'Todos' : f === 'entrada' ? 'Entradas' : f === 'saida' ? 'Saídas' : 'Inventário'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <span className="text-sm font-semibold text-foreground capitalize min-w-[160px] text-center">
                  {getMonthLabel(selectedMonth)}
                </span>
                <button onClick={nextMonth} disabled={isCurrentMonth}
                  className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex gap-3 text-xs font-mono">
                <span className="text-success">▼ Entradas: {monthEntries.toFixed(2)}</span>
                <span className="text-destructive">▲ Saídas: {monthExits.toFixed(2)}</span>
              </div>
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
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Origem</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Qtd</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Un</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
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
                      <td className="px-5 py-3">
                        {m.origem === 'inventario' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
                            <ClipboardCheck className="w-3 h-3" /> Inventário
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold">{formatQuantity(m.quantity)}</td>
                      <td className="px-5 py-3 uppercase font-mono text-xs">{m.unit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </TabsContent>

          {/* ===== Inventory tab ===== */}
          <TabsContent value="inventario" className="space-y-4">
            <div className="bg-card border rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Setor</label>
                    <div className="flex gap-1">
                      {(['usinagem', 'guilhotina'] as SectorType[]).map(s => (
                        <button key={s} type="button" onClick={() => switchInvSector(s)}
                          className={`px-3 py-2 rounded text-xs font-semibold transition-colors capitalize ${invSector === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Data do Inventário</label>
                    <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="input-steel font-mono" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium text-foreground block mb-1">Buscar</label>
                    <input type="text" value={invSearch} onChange={e => setInvSearch(e.target.value)}
                      placeholder="Código ou descrição..." className="input-steel w-full" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInvConfirm(true)}
                  disabled={invDiffs.length === 0 || invSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-6 py-2 rounded-md text-sm transition-colors inline-flex items-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Concluir Inventário ({invDiffs.length})
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Informe a quantidade contada de cada item. Ao concluir, as diferenças serão registradas como movimentações de <strong>entrada</strong> ou <strong>saída</strong> com origem <strong>Inventário</strong>. Itens em branco serão ignorados.
              </p>
            </div>

            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Estoque Atual</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Un</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qtd Contada</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorProducts.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Nenhum produto neste setor</td></tr>
                  ) : sectorProducts.map(p => {
                    const raw = invCounts[p.id] ?? '';
                    const counted = raw === '' ? null : parseFloat(raw);
                    const diff = counted !== null && !isNaN(counted) ? counted - p.quantity : null;
                    return (
                      <tr key={p.id} className="border-b last:border-0 table-row-alt">
                        <td className="px-4 py-2 font-mono font-medium">{p.code}</td>
                        <td className="px-4 py-2">{p.description}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatQuantity(p.quantity)}</td>
                        <td className="px-4 py-2 uppercase font-mono text-xs">{p.unit}</td>
                        <td className="px-4 py-2 text-right">
                          <input type="number" step="0.01" min="0" value={raw}
                            onChange={e => setInvCounts(s => ({ ...s, [p.id]: e.target.value }))}
                            className="input-steel w-28 font-mono text-right" placeholder="—" />
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold">
                          {diff === null || isNaN(diff) ? (
                            <span className="text-muted-foreground">—</span>
                          ) : diff === 0 ? (
                            <span className="text-muted-foreground">0</span>
                          ) : diff > 0 ? (
                            <span className="text-success">+{formatQuantity(diff)}</span>
                          ) : (
                            <span className="text-destructive">{formatQuantity(diff)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Modal (movement) */}
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
                {isBarraProduct && inputMode === 'peso'
                  ? `${quantity} kg → ${computedBarras.toFixed(2)} barra(s)`
                  : `${quantity} ${selectedProduct?.unit}`}
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

      {/* Confirmation Modal (inventory) */}
      {invConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !invSubmitting && setInvConfirm(false)}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-lg">Concluir Inventário</h3>
              </div>
              <button onClick={() => !invSubmitting && setInvConfirm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Serão registrados <strong className="text-foreground">{invDiffs.length}</strong> ajuste(s) de inventário no setor <strong className="capitalize text-foreground">{invSector}</strong>:
            </p>
            <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
              {invDiffs.map(d => (
                <div key={d.product.id} className="flex justify-between items-center px-3 py-2 text-sm">
                  <span className="font-mono">{d.product.code} <span className="text-muted-foreground">— {d.product.description}</span></span>
                  <span className={`font-mono font-bold ${d.diff > 0 ? 'text-success' : 'text-destructive'}`}>
                    {d.diff > 0 ? '+' : ''}{formatQuantity(d.diff)} {d.product.unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setInvConfirm(false)} disabled={invSubmitting}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleConcludeInventory} disabled={invSubmitting}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {invSubmitting ? 'Registrando...' : 'Confirmar e Concluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Movements;
