import { useEffect, useState, useMemo } from 'react';
import {
  getMtdProducts, addMtdProduct, updateMtdProduct, deleteMtdProduct,
  getMtdMovements, addMtdMovement,
  MtdProduct, MtdMovement, MtdType, MTD_TYPE_LABELS, CONDICAO_OPTIONS,
} from '@/lib/mtd';
import AppLayout from '@/components/AppLayout';
import { Plus, Trash2, Search, Pencil, X, ArrowLeftRight, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import logoHeader from '@/assets/logo_header.png';

const Motorredutores = () => {
  const [products, setProducts] = useState<MtdProduct[]>([]);
  const [movements, setMovements] = useState<MtdMovement[]>([]);
  const [tab, setTab] = useState<'estoque' | 'movimentacoes'>('estoque');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'todos' | MtdType>('todos');

  // Form fields
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [mtdType, setMtdType] = useState<MtdType>('REDLER');
  const [portaria, setPortaria] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [ofNumber, setOfNumber] = useState('');
  const [cliente, setCliente] = useState('');
  const [condicao, setCondicao] = useState('');

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

  // Movement form
  const [showMovForm, setShowMovForm] = useState(false);
  const [movProductId, setMovProductId] = useState('');
  const [movType, setMovType] = useState<'entrada' | 'saida'>('saida');
  const [movQty, setMovQty] = useState('1');
  const [movClienteDestino, setMovClienteDestino] = useState('');
  const [movNotaFiscal, setMovNotaFiscal] = useState('');
  const [movDate, setMovDate] = useState(new Date().toISOString().split('T')[0]);
  const [movObs, setMovObs] = useState('');

  // Month filter for movements
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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
        p.cliente.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'todos' || p.mtdType === filterType;
      return matchesSearch && matchesType;
    });
  }, [products, search, filterType]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => m.date.startsWith(monthKey));
  }, [movements, monthKey]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMtdProduct({
        code: code.trim(), description: description.trim(), mtdType,
        portaria: portaria.trim(), notaFiscal: notaFiscal.trim(),
        ofNumber: ofNumber.trim(), cliente: cliente.trim(), condicao: condicao.trim(),
      });
      toast.success('Motorredutor cadastrado!');
      setCode(''); setDescription(''); setPortaria(''); setNotaFiscal('');
      setOfNumber(''); setCliente(''); setCondicao(''); setShowForm(false);
      reload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Excluir "${desc}"?`)) return;
    try { await deleteMtdProduct(id); toast.success('Excluído'); reload(); }
    catch (err: any) { toast.error(err.message); }
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

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === movProductId);
    if (!product) { toast.error('Selecione um motorredutor'); return; }
    try {
      await addMtdMovement({
        mtdProductId: product.id, mtdProductCode: product.code,
        mtdProductDescription: product.description, type: movType,
        quantity: parseInt(movQty) || 1, clienteDestino: movClienteDestino.trim(),
        notaFiscal: movNotaFiscal.trim(),
        date: movDate, observacao: movObs.trim(),
      });
      toast.success('Movimentação registrada!');
      setMovProductId(''); setMovQty('1'); setMovClienteDestino(''); setMovNotaFiscal(''); setMovObs(''); setShowMovForm(false);
      reload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePrint = () => window.print();

  const monthEntries = filteredMovements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
  const monthExits = filteredMovements.filter(m => m.type === 'saida').reduce((s, m) => s + m.quantity, 0);

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
            <button onClick={handlePrint}
              className="inline-flex items-center gap-2 border font-semibold px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        {tab === 'estoque' && (
          <>
            {/* Add button */}
            <div className="flex justify-end print:hidden">
              <button onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">
                <Plus className="w-4 h-4" /> Novo Motorredutor
              </button>
            </div>

            {/* Add form */}
            {showForm && (
              <form onSubmit={handleAdd} className="bg-card border rounded-lg p-5 space-y-4 print:hidden">
                <h3 className="font-semibold text-foreground">Cadastrar Motorredutor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Código</label>
                    <input value={code} onChange={e => setCode(e.target.value)} className="input-steel w-full font-mono" required placeholder="Ex: MTD-001" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
                    <input value={description} onChange={e => setDescription(e.target.value)} className="input-steel w-full" required placeholder="Descrição" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Tipo MTD</label>
                    <select value={mtdType} onChange={e => setMtdType(e.target.value as MtdType)} className="input-steel w-full">
                      {Object.entries(MTD_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Condição</label>
                    <input value={condicao} onChange={e => setCondicao(e.target.value)} className="input-steel w-full" placeholder="Ex: Novo, Usado" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Portaria</label>
                    <input value={portaria} onChange={e => setPortaria(e.target.value)} className="input-steel w-full" placeholder="Portaria" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Nota Fiscal</label>
                    <input value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} className="input-steel w-full" placeholder="NF" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">OF</label>
                    <input value={ofNumber} onChange={e => setOfNumber(e.target.value)} className="input-steel w-full" placeholder="Ordem de Fabricação" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Cliente</label>
                    <input value={cliente} onChange={e => setCliente(e.target.value)} className="input-steel w-full" placeholder="Cliente de compra" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">Salvar</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                </div>
              </form>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-end print:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="input-steel pl-10 w-64" placeholder="Buscar código, descrição, cliente..." />
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

            {/* Print header */}
            <div className="hidden print:flex px-5 py-4 items-center gap-3 border-b bg-card rounded-lg border">
              <img src={logoHeader} alt="Jhonrob" className="h-10" />
              <div>
                <h1 className="text-lg font-bold">Relatório de Estoque — Motorredutores</h1>
                <p className="text-sm">Data: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Condição</th>
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
                      <tr key={p.id} className="border-b last:border-0 table-row-alt hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-semibold text-primary">{p.code}</td>
                        <td className="px-4 py-2.5">{p.description}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                            {MTD_TYPE_LABELS[p.mtdType] || p.mtdType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">{p.quantity}</td>
                        <td className="px-4 py-2.5 text-xs">{p.condicao || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{p.portaria || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{p.notaFiscal || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{p.ofNumber || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">{p.cliente || '—'}</td>
                        <td className="px-4 py-2.5 print:hidden">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(p.id, p.description)} className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

        {tab === 'movimentacoes' && (
          <>
            {/* Movement controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1.5 rounded hover:bg-muted transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <span className="font-semibold text-foreground capitalize min-w-[180px] text-center">{getMonthLabel(selectedMonth)}</span>
                <button onClick={nextMonth} className="p-1.5 rounded hover:bg-muted transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <button onClick={() => setShowMovForm(!showMovForm)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">
                <ArrowLeftRight className="w-4 h-4" /> Nova Movimentação
              </button>
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

            {/* Movement form */}
            {showMovForm && (
              <form onSubmit={handleMovement} className="bg-card border rounded-lg p-5 space-y-4 print:hidden">
                <h3 className="font-semibold text-foreground">Registrar Movimentação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Motorredutor</label>
                    <select value={movProductId} onChange={e => setMovProductId(e.target.value)} className="input-steel w-full" required>
                      <option value="">Selecione...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.code} — {p.description}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Tipo</label>
                    <select value={movType} onChange={e => setMovType(e.target.value as any)} className="input-steel w-full">
                      <option value="saida">Saída</option>
                      <option value="entrada">Entrada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Quantidade</label>
                    <input type="number" min="1" value={movQty} onChange={e => setMovQty(e.target.value)} className="input-steel w-full font-mono" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Cliente Destino</label>
                    <input value={movClienteDestino} onChange={e => setMovClienteDestino(e.target.value)} className="input-steel w-full" placeholder="Para qual cliente" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Data</label>
                    <input type="date" value={movDate} onChange={e => setMovDate(e.target.value)} className="input-steel w-full font-mono" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Observação</label>
                    <input value={movObs} onChange={e => setMovObs(e.target.value)} className="input-steel w-full" placeholder="Opcional" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">Confirmar</button>
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
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente Destino</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Nenhuma movimentação neste mês</td></tr>
                  ) : (
                    filteredMovements.map(m => (
                      <tr key={m.id} className="border-b last:border-0 table-row-alt hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs">{new Date(m.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${m.type === 'entrada' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                            {m.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-primary">{m.mtdProductCode}</td>
                        <td className="px-4 py-2.5">{m.mtdProductDescription}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">{m.quantity}</td>
                        <td className="px-4 py-2.5 text-xs">{m.clienteDestino || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.observacao || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                  <label className="text-sm font-medium text-foreground block mb-1">Tipo MTD</label>
                  <select value={editMtdType} onChange={e => setEditMtdType(e.target.value as MtdType)} className="input-steel w-full">
                    {Object.entries(MTD_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Condição</label>
                  <input value={editCondicao} onChange={e => setEditCondicao(e.target.value)} className="input-steel w-full" />
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
    </AppLayout>
  );
};

export default Motorredutores;
