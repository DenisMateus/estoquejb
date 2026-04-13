import { useEffect, useState, useMemo } from 'react';
import {
  getMtdProducts, addMtdProduct, updateMtdProduct, deleteMtdProduct,
  getMtdMovements, addMtdMovement,
  MtdProduct, MtdMovement, MtdType, MTD_TYPE_LABELS, CONDICAO_OPTIONS,
} from '@/lib/mtd';
import AppLayout from '@/components/AppLayout';
import { Plus, Trash2, Search, Pencil, X, ArrowLeftRight, Printer, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, ClipboardCheck, Check, XCircle, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import logoHeader from '@/assets/logo_header.png';

const DELETE_SECRET_CODE = 'Jhonrob@1';

const Motorredutores = () => {
  const [products, setProducts] = useState<MtdProduct[]>([]);
  const [movements, setMovements] = useState<MtdMovement[]>([]);
  const [tab, setTab] = useState<'estoque' | 'movimentacoes' | 'inventario' | 'imprimir'>('estoque');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'todos' | MtdType>('todos');
  const [stockFilter, setStockFilter] = useState<'com_estoque' | 'sem_estoque' | 'todos'>('com_estoque');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; desc: string } | null>(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'code'>('confirm');

  // Movement form
  const [showMovForm, setShowMovForm] = useState(false);
  const [movFormType, setMovFormType] = useState<'entrada' | 'saida'>('entrada');

  // Entrada fields
  const [entCode, setEntCode] = useState('');
  const [entDescription, setEntDescription] = useState('');
  const [entMtdType, setEntMtdType] = useState<MtdType>('REDLER');
  const [entCondicao, setEntCondicao] = useState('');
  const [entPortaria, setEntPortaria] = useState('');
  const [entNotaFiscal, setEntNotaFiscal] = useState('');
  const [entOfNumber, setEntOfNumber] = useState('');
  const [entCliente, setEntCliente] = useState('');
  const [entQuantidade, setEntQuantidade] = useState(1);

  // Saida fields
  const [saidaProductId, setSaidaProductId] = useState('');
  const [saidaCliente, setSaidaCliente] = useState('');
  const [saidaDate, setSaidaDate] = useState(new Date().toISOString().split('T')[0]);
  const [saidaObs, setSaidaObs] = useState('');
  const [saidaQtd, setSaidaQtd] = useState(1);

  // Entrada date
  const [entDate, setEntDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit
  const [editProduct, setEditProduct] = useState<MtdProduct | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMtdType, setEditMtdType] = useState<MtdType>('REDLER');
  const [editPortaria, setEditPortaria] = useState('');
  const [editNotaFiscal, setEditNotaFiscal] = useState('');
  const [editOfNumber, setEditOfNumber] = useState('');
  const [editCliente, setEditCliente] = useState('');
  const [editCondicao, setEditCondicao] = useState('');

  // Month filter for movements
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Inventário
  const [inventarioChecked, setInventarioChecked] = useState<Record<string, 'sim' | 'nao'>>({});
  const [inventarioProcessing, setInventarioProcessing] = useState<string | null>(null);
  const [inventarioSearch, setInventarioSearch] = useState('');
  const [inventarioConfirm, setInventarioConfirm] = useState<{ type: 'sim' | 'nao'; product: MtdProduct } | null>(null);

  const reload = async () => {
    try {
      const [p, m] = await Promise.all([getMtdProducts(), getMtdMovements()]);
      setProducts(p);
      setMovements(m);
    } catch {
      toast.error('Erro ao carregar motorredutores');
    }
  };
  useEffect(() => { reload(); }, []);

  const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const getMonthLabel = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const prevMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const monthKey = getMonthKey(selectedMonth);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = search === '' ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.cliente.toLowerCase().includes(search.toLowerCase()) ||
        p.notaFiscal.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'todos' || p.mtdType === filterType;
      const matchesStock = stockFilter === 'todos' ||
        (stockFilter === 'com_estoque' && p.quantity > 0) ||
        (stockFilter === 'sem_estoque' && p.quantity === 0);
      return matchesSearch && matchesType && matchesStock;
    });
  }, [products, search, filterType, stockFilter]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => m.date.startsWith(monthKey));
  }, [movements, monthKey]);

  // Print only motors with stock
  const printProducts = useMemo(() => {
    return products.filter(p => p.quantity > 0);
  }, [products]);

  const handleEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entQuantidade < 1) { toast.error('Quantidade deve ser pelo menos 1'); return; }
    try {
      const newProduct = await addMtdProduct({
        code: entCode.trim(),
        description: entDescription.trim(),
        mtdType: entMtdType,
        quantity: entQuantidade,
        portaria: entPortaria.trim(),
        notaFiscal: entNotaFiscal.trim(),
        ofNumber: entOfNumber.trim(),
        cliente: entCliente.trim(),
        condicao: entCondicao.trim(),
      });
      await addMtdMovement({
        mtdProductId: newProduct.id,
        mtdProductCode: newProduct.code,
        mtdProductDescription: newProduct.description,
        type: 'entrada',
        quantity: entQuantidade,
        clienteDestino: entCliente.trim(),
        notaFiscal: entNotaFiscal.trim(),
        date: entDate,
        observacao: `OF: ${entOfNumber.trim()}`,
      }, true);
      toast.success(`${entQuantidade} motor(es) cadastrado(s)!`);
      setEntCode(''); setEntDescription(''); setEntPortaria('');
      setEntNotaFiscal(''); setEntOfNumber(''); setEntCliente('');
      setEntCondicao(''); setEntQuantidade(1); setShowMovForm(false);
      reload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaida = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === saidaProductId);
    if (!product) { toast.error('Selecione um motorredutor'); return; }
    if (saidaQtd < 1 || saidaQtd > product.quantity) {
      toast.error(`Quantidade inválida. Estoque disponível: ${product.quantity}`);
      return;
    }
    try {
      await addMtdMovement({
        mtdProductId: product.id,
        mtdProductCode: product.code,
        mtdProductDescription: product.description,
        type: 'saida',
        quantity: saidaQtd,
        clienteDestino: saidaCliente.trim(),
        notaFiscal: '',
        date: saidaDate,
        observacao: saidaObs.trim(),
      });
      toast.success('Saída registrada!');
      setSaidaProductId(''); setSaidaCliente(''); setSaidaObs('');
      setSaidaQtd(1); setShowMovForm(false);
      reload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteClick = (id: string, desc: string) => {
    setDeleteTarget({ id, desc });
    setDeleteCode('');
    setDeleteStep('confirm');
  };

  const handleDeleteConfirm = async () => {
    if (deleteStep === 'confirm') {
      setDeleteStep('code');
      return;
    }
    if (deleteCode !== DELETE_SECRET_CODE) {
      toast.error('Código incorreto!');
      return;
    }
    if (!deleteTarget) return;
    try {
      await deleteMtdProduct(deleteTarget.id);
      toast.success('Excluído');
      reload();
    } catch (err: any) {
      toast.error(err.message);
    }
    setDeleteTarget(null);
    setDeleteCode('');
  };

  const openEdit = (p: MtdProduct) => {
    setEditProduct(p); setEditCode(p.code); setEditDescription(p.description);
    setEditMtdType(p.mtdType); setEditPortaria(p.portaria); setEditNotaFiscal(p.notaFiscal);
    setEditOfNumber(p.ofNumber); setEditCliente(p.cliente); setEditCondicao(p.condicao);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      await updateMtdProduct(editProduct.id, {
        code: editCode.trim(), description: editDescription.trim(), mtdType: editMtdType,
        portaria: editPortaria.trim(), notaFiscal: editNotaFiscal.trim(),
        ofNumber: editOfNumber.trim(), cliente: editCliente.trim(), condicao: editCondicao.trim(),
      });
      toast.success('Atualizado!'); setEditProduct(null); reload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePrint = () => window.print();

  const handleInventarioNao = async (product: MtdProduct) => {
    setInventarioConfirm(null);
    setInventarioProcessing(product.id);
    try {
      await addMtdMovement({
        mtdProductId: product.id,
        mtdProductCode: product.code,
        mtdProductDescription: product.description,
        type: 'saida',
        quantity: product.quantity,
        clienteDestino: 'INVENTÁRIO - Baixa automática',
        notaFiscal: '',
        date: new Date().toISOString().split('T')[0],
        observacao: 'Baixa por inventário - motor não encontrado no estoque físico',
      });
      setInventarioChecked(prev => ({ ...prev, [product.id]: 'nao' }));
      toast.success(`Motor ${product.code} baixado do estoque (inventário)`);
      await reload();
    } catch (err: any) {
      toast.error(err.message);
    }
    setInventarioProcessing(null);
  };

  const handleInventarioSim = (product: MtdProduct) => {
    setInventarioConfirm(null);
    setInventarioChecked(prev => ({ ...prev, [product.id]: 'sim' }));
    toast.success('Motor confirmado no inventário!');
  };

  const handleInventarioRetornar = async (product: MtdProduct) => {
    setInventarioProcessing(product.id);
    try {
      await addMtdMovement({
        mtdProductId: product.id,
        mtdProductCode: product.code,
        mtdProductDescription: product.description,
        type: 'entrada',
        quantity: 1,
        clienteDestino: '',
        notaFiscal: '',
        date: new Date().toISOString().split('T')[0],
        observacao: 'Retorno ao estoque - correção de inventário',
      });
      setInventarioChecked(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      toast.success(`Motor ${product.code} retornado ao estoque!`);
      await reload();
    } catch (err: any) {
      toast.error(err.message);
    }
    setInventarioProcessing(null);
  };

  const productsWithStock = products.filter(p => p.quantity > 0);

  const inventarioProducts = productsWithStock.filter(p => {
    if (!inventarioSearch.trim()) return true;
    const term = inventarioSearch.toLowerCase().trim();
    return p.code.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.notaFiscal || '').toLowerCase().includes(term) ||
      (p.ofNumber || '').toLowerCase().includes(term) ||
      (p.cliente || '').toLowerCase().includes(term);
  });
  const inventarioTotal = inventarioProducts.length;
  const inventarioCheckedCount = inventarioProducts.filter(p => inventarioChecked[p.id]).length;
  const inventarioPendingCount = inventarioTotal - inventarioCheckedCount;

  const monthEntries = filteredMovements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
  const monthExits = filteredMovements.filter(m => m.type === 'saida').reduce((s, m) => s + m.quantity, 0);

  // Saida search
  const [saidaSearchType, setSaidaSearchType] = useState<'codigo' | 'nf'>('codigo');
  const [saidaSearch, setSaidaSearch] = useState('');

  const saidaFilteredProducts = useMemo(() => {
    if (!saidaSearch.trim()) return productsWithStock;
    const term = saidaSearch.toLowerCase().trim();
    return productsWithStock.filter(p =>
      saidaSearchType === 'nf'
        ? p.notaFiscal.toLowerCase().includes(term)
        : p.code.toLowerCase().includes(term)
    );
  }, [productsWithStock, saidaSearch, saidaSearchType]);

  // When selecting a product for saída, update max qty
  const selectedSaidaProduct = products.find(p => p.id === saidaProductId);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <h2 className="text-xl font-bold text-foreground">Motorredutores (MTD)</h2>
          <div className="flex gap-2">
            <button onClick={() => setTab('estoque')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${tab === 'estoque' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              Estoque
            </button>
            <button onClick={() => setTab('movimentacoes')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${tab === 'movimentacoes' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              Movimentações
            </button>
            <button onClick={() => { setTab('inventario'); setInventarioChecked({}); }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${tab === 'inventario' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              <ClipboardCheck className="w-4 h-4 inline mr-1" />Inventário
            </button>
            <button onClick={() => setTab('imprimir')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${tab === 'imprimir' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              <Printer className="w-4 h-4 inline mr-1" />Imprimir
            </button>
          </div>
        </div>

        {/* ===== ESTOQUE TAB ===== */}
        {tab === 'estoque' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end print:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="input-steel pl-10 w-64" placeholder="Buscar código, descrição, NF..." />
              </div>
              <div className="flex gap-1">
                <button onClick={() => setStockFilter('com_estoque')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${stockFilter === 'com_estoque' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  Com Estoque
                </button>
                <button onClick={() => setStockFilter('sem_estoque')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${stockFilter === 'sem_estoque' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  Baixados
                </button>
                <button onClick={() => setStockFilter('todos')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${stockFilter === 'todos' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  Todos
                </button>
              </div>
              <div className="flex gap-1">
                {(['todos', ...Object.keys(MTD_TYPE_LABELS)] as const).map(val => (
                  <button key={val} onClick={() => setFilterType(val as any)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterType === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {val === 'todos' ? 'Todos' : MTD_TYPE_LABELS[val as MtdType]}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex gap-4 print:hidden">
              <div className="bg-card border rounded-lg px-4 py-2 text-sm">
                Total exibido: <span className="font-bold">{filteredProducts.length}</span> registro(s)
              </div>
              <div className="bg-card border rounded-lg px-4 py-2 text-sm">
                Total de motores em estoque: <span className="font-bold text-success">{productsWithStock.reduce((s, p) => s + p.quantity, 0)}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Equipamento</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Condição</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Portaria</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">NF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">OF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-8 text-center text-muted-foreground">Nenhum motorredutor encontrado</td></tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${p.quantity === 0 ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-2.5 font-mono font-semibold text-primary">{p.code}</td>
                        <td className="px-4 py-2.5">{p.description}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                            {MTD_TYPE_LABELS[p.mtdType] || p.mtdType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs">{p.condicao || '—'}</td>
                        <td className="px-4 py-2.5 text-center font-bold">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${p.quantity > 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                            {p.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono">{p.portaria || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{p.notaFiscal || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{p.ofNumber || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">{p.cliente || '—'}</td>
                        <td className="px-4 py-2.5 print:hidden">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteClick(p.id, p.description)} className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== MOVIMENTAÇÕES TAB ===== */}
        {tab === 'movimentacoes' && (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1.5 rounded hover:bg-muted transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <span className="font-semibold text-foreground capitalize min-w-[180px] text-center">{getMonthLabel(selectedMonth)}</span>
                <button onClick={nextMonth} className="p-1.5 rounded hover:bg-muted transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setMovFormType('entrada'); setShowMovForm(true); }}
                  className="inline-flex items-center gap-2 bg-success text-white font-semibold px-4 py-2 rounded-md hover:bg-success/90 transition-colors text-sm">
                  <ArrowDown className="w-4 h-4" /> Entrada de Motor
                </button>
                <button onClick={() => { setMovFormType('saida'); setShowMovForm(true); }}
                  className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground font-semibold px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors text-sm">
                  <ArrowUp className="w-4 h-4" /> Saída de Motor
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 print:hidden">
              <div className="bg-card border rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Entradas no mês</p>
                <p className="text-2xl font-bold text-success">{monthEntries}</p>
              </div>
              <div className="bg-card border rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Saídas no mês</p>
                <p className="text-2xl font-bold text-destructive">{monthExits}</p>
              </div>
            </div>

            {/* Entrada form */}
            {showMovForm && movFormType === 'entrada' && (
              <form onSubmit={handleEntrada} className="bg-card border rounded-lg p-5 space-y-4 print:hidden">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-success" /> Entrada de Motor (Cadastrar Novo)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Código</label>
                    <input value={entCode} onChange={e => setEntCode(e.target.value)} className="input-steel w-full font-mono" required placeholder="Ex: 039000137" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
                    <input value={entDescription} onChange={e => setEntDescription(e.target.value)} className="input-steel w-full" required placeholder="Descrição do motor" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Equipamento (Tipo MTD)</label>
                    <select value={entMtdType} onChange={e => setEntMtdType(e.target.value as MtdType)} className="input-steel w-full">
                      {Object.entries(MTD_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Condição</label>
                    <select value={entCondicao} onChange={e => setEntCondicao(e.target.value)} className="input-steel w-full" required>
                      <option value="">Selecione...</option>
                      {CONDICAO_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Quantidade</label>
                    <input type="number" min={1} value={entQuantidade} onChange={e => setEntQuantidade(Number(e.target.value))} className="input-steel w-full font-mono" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Cliente (fornecedor/reserva)</label>
                    <input value={entCliente} onChange={e => setEntCliente(e.target.value)} className="input-steel w-full" placeholder="De quem é o motor" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Nota Fiscal</label>
                    <input value={entNotaFiscal} onChange={e => setEntNotaFiscal(e.target.value)} className="input-steel w-full" placeholder="Nº da NF" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">OF</label>
                    <input value={entOfNumber} onChange={e => setEntOfNumber(e.target.value)} className="input-steel w-full" placeholder="Ordem de Fabricação" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Portaria</label>
                    <input value={entPortaria} onChange={e => setEntPortaria(e.target.value)} className="input-steel w-full" placeholder="Portaria" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Data</label>
                    <input type="date" value={entDate} onChange={e => setEntDate(e.target.value)} className="input-steel w-full font-mono" required />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-success text-white font-semibold px-4 py-2 rounded-md hover:bg-success/90 transition-colors text-sm">Registrar Entrada</button>
                  <button type="button" onClick={() => setShowMovForm(false)} className="px-4 py-2 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                </div>
              </form>
            )}

            {/* Saída form */}
            {showMovForm && movFormType === 'saida' && (
              <form onSubmit={handleSaida} className="bg-card border rounded-lg p-5 space-y-4 print:hidden">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-destructive" /> Saída de Motor
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                    <label className="text-sm font-medium text-foreground block">Buscar Motorredutor</label>
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => { setSaidaSearchType('codigo'); setSaidaSearch(''); setSaidaProductId(''); }}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${saidaSearchType === 'codigo' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                          Por Código
                        </button>
                        <button type="button" onClick={() => { setSaidaSearchType('nf'); setSaidaSearch(''); setSaidaProductId(''); }}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${saidaSearchType === 'nf' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                          Por NF
                        </button>
                      </div>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input value={saidaSearch} onChange={e => { setSaidaSearch(e.target.value); setSaidaProductId(''); }}
                          className="input-steel w-full pl-10" placeholder={saidaSearchType === 'nf' ? 'Digite o nº da NF...' : 'Digite o código do motor...'} />
                      </div>
                    </div>
                    {saidaSearch.trim() && (
                      <div className="border rounded-md max-h-48 overflow-y-auto bg-card">
                        {saidaFilteredProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3">Nenhum motor encontrado</p>
                        ) : (
                          saidaFilteredProducts.map(p => (
                            <button type="button" key={p.id} onClick={() => { setSaidaProductId(p.id); setSaidaQtd(1); setSaidaSearch(saidaSearchType === 'nf' ? p.notaFiscal : p.code); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-0 transition-colors ${saidaProductId === p.id ? 'bg-primary/10' : ''}`}>
                              <span className="font-mono font-semibold text-primary">{p.code}</span>
                              <span className="text-muted-foreground"> — {p.description}</span>
                              <span className="text-xs text-muted-foreground"> | NF: {p.notaFiscal || '—'} | Cliente: {p.cliente || '—'} | Qtd: {p.quantity}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {saidaProductId && selectedSaidaProduct && (
                      <p className="text-xs text-success font-medium">
                        ✓ Selecionado: {selectedSaidaProduct.code} — {selectedSaidaProduct.description} (NF: {selectedSaidaProduct.notaFiscal || '—'})
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Cliente Final (destino)</label>
                    <input value={saidaCliente} onChange={e => setSaidaCliente(e.target.value)} className="input-steel w-full" placeholder="Para qual cliente vai o motor" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Quantidade</label>
                    <input type="number" min={1} max={selectedSaidaProduct?.quantity || 1} value={saidaQtd} onChange={e => setSaidaQtd(Number(e.target.value))} className="input-steel w-full font-mono" required />
                    {selectedSaidaProduct && <p className="text-xs text-muted-foreground mt-1">Disponível: {selectedSaidaProduct.quantity}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Data da Baixa</label>
                    <input type="date" value={saidaDate} onChange={e => setSaidaDate(e.target.value)} className="input-steel w-full font-mono" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Observação</label>
                    <input value={saidaObs} onChange={e => setSaidaObs(e.target.value)} className="input-steel w-full" placeholder="Opcional" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-destructive text-destructive-foreground font-semibold px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors text-sm">Registrar Saída</button>
                  <button type="button" onClick={() => setShowMovForm(false)} className="px-4 py-2 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                </div>
              </form>
            )}

            {/* Movements table */}
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">NF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Nenhuma movimentação neste mês</td></tr>
                  ) : (
                    filteredMovements.map(m => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${m.type === 'entrada' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                            {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-primary">{m.mtdProductCode}</td>
                        <td className="px-4 py-2.5">{m.mtdProductDescription}</td>
                        <td className="px-4 py-2.5 text-center font-bold">{m.quantity}</td>
                        <td className="px-4 py-2.5 text-xs">{m.clienteDestino || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{m.notaFiscal || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.observacao || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== INVENTÁRIO TAB ===== */}
        {tab === 'inventario' && (
          <>
            <div className="bg-card border rounded-lg p-4 space-y-1">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" /> Inventário de Motorredutores
              </h3>
              <p className="text-sm text-muted-foreground">
                Confira cada motor no estoque físico. Clique <strong className="text-success">SIM</strong> se o motor está presente ou <strong className="text-destructive">NÃO</strong> para dar baixa automática.
              </p>
              <div className="flex gap-4 pt-2">
                <span className="text-sm">Total: <strong>{inventarioTotal}</strong></span>
                <span className="text-sm text-success">Confirmados: <strong>{inventarioProducts.filter(p => inventarioChecked[p.id] === 'sim').length}</strong></span>
                <span className="text-sm text-destructive">Baixados: <strong>{inventarioProducts.filter(p => inventarioChecked[p.id] === 'nao').length}</strong></span>
                <span className="text-sm text-muted-foreground">Pendentes: <strong>{inventarioPendingCount}</strong></span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar por código, descrição, NF, OF ou cliente..."
                value={inventarioSearch}
                onChange={e => setInventarioSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Equipamento</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">NF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">OF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioProducts.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">Nenhum motorredutor em estoque para inventariar</td></tr>
                  ) : (
                    inventarioProducts.map(p => {
                      const status = inventarioChecked[p.id];
                      const isProcessing = inventarioProcessing === p.id;
                      return (
                        <tr key={p.id} className={`border-b last:border-0 transition-colors ${status === 'sim' ? 'bg-success/5' : status === 'nao' ? 'bg-destructive/5 opacity-50' : 'hover:bg-muted/30'}`}>
                          <td className="px-4 py-2.5 font-mono font-semibold text-primary">{p.code}</td>
                          <td className="px-4 py-2.5">{p.description}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {MTD_TYPE_LABELS[p.mtdType] || p.mtdType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold">{p.quantity}</td>
                          <td className="px-4 py-2.5 text-xs font-mono">{p.notaFiscal || '—'}</td>
                          <td className="px-4 py-2.5 text-xs font-mono">{p.ofNumber || '—'}</td>
                          <td className="px-4 py-2.5 text-xs">{p.cliente || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {status === 'sim' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-success/15 text-success"><Check className="w-3 h-3" /> OK</span>}
                            {status === 'nao' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-destructive/15 text-destructive"><XCircle className="w-3 h-3" /> Baixado</span>}
                            {!status && <span className="text-xs text-muted-foreground">Pendente</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {!status && !isProcessing && (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setInventarioConfirm({ type: 'sim', product: p })}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-success text-white hover:bg-success/90 transition-colors">
                                  <Check className="w-3.5 h-3.5" /> SIM
                                </button>
                                <button onClick={() => setInventarioConfirm({ type: 'nao', product: p })}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                                  <XCircle className="w-3.5 h-3.5" /> NÃO
                                </button>
                              </div>
                            )}
                            {isProcessing && <span className="text-xs text-muted-foreground">Processando...</span>}
                            {status === 'sim' && !isProcessing && <span className="text-xs text-muted-foreground">—</span>}
                            {status === 'nao' && !isProcessing && (
                              <button onClick={() => handleInventarioRetornar(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                <Undo2 className="w-3.5 h-3.5" /> Retornar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal de confirmação do inventário */}
            {inventarioConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-card rounded-lg border shadow-lg p-6 w-full max-w-md space-y-4">
                  {inventarioConfirm.type === 'sim' ? (
                    <>
                      <h3 className="text-lg font-bold text-success flex items-center gap-2">
                        <Check className="w-5 h-5" /> Confirmar Presença no Estoque
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tem certeza que o motor <strong className="text-foreground">{inventarioConfirm.product.code}</strong> está presente no estoque físico?
                      </p>
                      <div className="text-xs space-y-1 bg-muted/50 rounded p-3">
                        <p><strong>Descrição:</strong> {inventarioConfirm.product.description}</p>
                        <p><strong>NF:</strong> {inventarioConfirm.product.notaFiscal || '—'} | <strong>OF:</strong> {inventarioConfirm.product.ofNumber || '—'}</p>
                        <p><strong>Cliente:</strong> {inventarioConfirm.product.cliente || '—'}</p>
                      </div>
                      <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setInventarioConfirm(null)}
                          className="px-4 py-2 rounded text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                          Cancelar
                        </button>
                        <button onClick={() => handleInventarioSim(inventarioConfirm.product)}
                          className="px-4 py-2 rounded text-sm font-bold bg-success text-white hover:bg-success/90 transition-colors">
                          Sim, está no estoque
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> Dar Baixa no Estoque
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tem certeza que o motor <strong className="text-foreground">{inventarioConfirm.product.code}</strong> <strong className="text-destructive">NÃO</strong> foi encontrado no estoque físico?
                      </p>
                      <div className="text-xs space-y-1 bg-muted/50 rounded p-3">
                        <p><strong>Descrição:</strong> {inventarioConfirm.product.description}</p>
                        <p><strong>NF:</strong> {inventarioConfirm.product.notaFiscal || '—'} | <strong>OF:</strong> {inventarioConfirm.product.ofNumber || '—'}</p>
                        <p><strong>Cliente:</strong> {inventarioConfirm.product.cliente || '—'}</p>
                      </div>
                      <p className="text-xs text-destructive font-semibold">⚠️ Esta ação vai dar baixa automática deste motor no sistema. Se errar, você pode clicar em "Retornar" para devolver ao estoque.</p>
                      <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setInventarioConfirm(null)}
                          className="px-4 py-2 rounded text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                          Cancelar
                        </button>
                        <button onClick={() => handleInventarioNao(inventarioConfirm.product)}
                          className="px-4 py-2 rounded text-sm font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                          Sim, dar baixa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== IMPRIMIR TAB ===== */}
        {tab === 'imprimir' && (
          <>
            <div className="print:hidden flex justify-end">
              <button onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">
                <Printer className="w-4 h-4" /> Imprimir Relatório
              </button>
            </div>

            {/* Print header */}
            <div className="flex px-5 py-4 items-center gap-3 border-b bg-card rounded-lg border">
              <img src={logoHeader} alt="Jhonrob" className="h-10" />
              <div>
                <h1 className="text-lg font-bold">Relatório de Estoque — Motorredutores</h1>
                <p className="text-sm text-muted-foreground">Data: {new Date().toLocaleDateString('pt-BR')} — Apenas motores em estoque</p>
              </div>
            </div>

            {/* Print table */}
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Equipamento</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Condição</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Portaria</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">NF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">OF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {printProducts.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">Nenhum motorredutor em estoque</td></tr>
                  ) : (
                    printProducts.map(p => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono font-semibold">{p.code}</td>
                        <td className="px-4 py-2">{p.description}</td>
                        <td className="px-4 py-2 text-xs">{MTD_TYPE_LABELS[p.mtdType] || p.mtdType}</td>
                        <td className="px-4 py-2 text-xs">{p.condicao || '—'}</td>
                        <td className="px-4 py-2 text-center font-bold">{p.quantity}</td>
                        <td className="px-4 py-2 text-xs font-mono">{p.portaria || '—'}</td>
                        <td className="px-4 py-2 text-xs font-mono">{p.notaFiscal || '—'}</td>
                        <td className="px-4 py-2 text-xs font-mono">{p.ofNumber || '—'}</td>
                        <td className="px-4 py-2 text-xs">{p.cliente || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              Total em estoque: <span className="font-bold">{printProducts.reduce((s, p) => s + p.quantity, 0)}</span> motor(es) em <span className="font-bold">{printProducts.length}</span> registro(s)
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditProduct(null)}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-lg">Editar Motorredutor</h3>
              <button onClick={() => setEditProduct(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Código</label>
                  <input value={editCode} onChange={e => setEditCode(e.target.value)} className="input-steel w-full font-mono" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
                  <input value={editDescription} onChange={e => setEditDescription(e.target.value)} className="input-steel w-full" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Equipamento (Tipo MTD)</label>
                  <select value={editMtdType} onChange={e => setEditMtdType(e.target.value as MtdType)} className="input-steel w-full">
                    {Object.entries(MTD_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Condição</label>
                  <select value={editCondicao} onChange={e => setEditCondicao(e.target.value)} className="input-steel w-full">
                    <option value="">Selecione...</option>
                    {CONDICAO_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Portaria</label>
                  <input value={editPortaria} onChange={e => setEditPortaria(e.target.value)} className="input-steel w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Nota Fiscal</label>
                  <input value={editNotaFiscal} onChange={e => setEditNotaFiscal(e.target.value)} className="input-steel w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">OF</label>
                  <input value={editOfNumber} onChange={e => setEditOfNumber(e.target.value)} className="input-steel w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Cliente</label>
                  <input value={editCliente} onChange={e => setEditCliente(e.target.value)} className="input-steel w-full" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditProduct(null)} className="px-4 py-2 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border">
            {deleteStep === 'confirm' ? (
              <>
                <h3 className="text-lg font-bold mb-3 text-foreground">Excluir Motorredutor</h3>
                <p className="text-muted-foreground mb-5">
                  Deseja realmente excluir <strong className="text-foreground">"{deleteTarget.desc}"</strong>?
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90">Cancelar</button>
                  <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700">Confirmar</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-3 text-foreground">Digite o código de segurança</h3>
                <p className="text-muted-foreground mb-4">Para excluir, insira o código de autorização:</p>
                <input
                  type="password"
                  value={deleteCode}
                  onChange={e => setDeleteCode(e.target.value)}
                  placeholder="Código de segurança"
                  className="w-full border rounded-md px-3 py-2 mb-5 bg-background text-foreground"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleDeleteConfirm()}
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90">Cancelar</button>
                  <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700">Excluir</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Motorredutores;
