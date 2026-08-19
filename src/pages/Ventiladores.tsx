import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Fan, Plus, Search, Trash2, Check, PackageCheck,
  Warehouse, ClipboardList, ArrowLeftRight, Pencil,
  ChevronUp, ChevronDown, ChevronsUpDown, GripVertical,
} from 'lucide-react';
import {
  addVentMovement,
  addVentPending,
  addVentStock,
  deleteVentPending,
  deleteVentStock,
  formatDateBR,
  getVentMovements,
  getVentPending,
  getVentStock,
  reorderVentPending,
  todayLocalISO,
  updateVentPending,
  updateVentStock,
  VentiladorMovement,
  VentiladorPending,
  VentiladorStatus,
  VentiladorStock,
  VentiladorTipo,
  VENT_STATUS_LABELS,
  VENT_TIPO_LABELS,
} from '@/lib/ventiladores';

type Tab = 'stock' | 'pending' | 'mov';

const TIPO_OPTIONS: VentiladorTipo[] = ['SILO', 'TORRADOR', 'ARMAZEM'];

export default function Ventiladores() {
  const [tab, setTab] = useState<Tab>('stock');
  const [stock, setStock] = useState<VentiladorStock[]>([]);
  const [pending, setPending] = useState<VentiladorPending[]>([]);
  const [movs, setMovs] = useState<VentiladorMovement[]>([]);
  const [tipoFilter, setTipoFilter] = useState<'all' | VentiladorTipo>('all');
  const [search, setSearch] = useState('');

  const reload = async () => {
    try {
      const [s, p, m] = await Promise.all([getVentStock(), getVentPending(), getVentMovements()]);
      setStock(s); setPending(p); setMovs(m);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' });
    }
  };
  useEffect(() => { reload(); }, []);

  // ------- dialogs
  const [stockDialog, setStockDialog] = useState(false);
  const [stockForm, setStockForm] = useState({
    code: '', description: '', tipo: 'SILO' as VentiladorTipo,
    clienteMode: 'estoque' as 'estoque' | 'cliente',
    cliente: '', ofNumber: '',
    voltaObra: false,
  });

  const [pendingDialog, setPendingDialog] = useState(false);
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const [pendingForm, setPendingForm] = useState({
    code: '', description: '', tipo: 'SILO' as VentiladorTipo,
    cliente: '', ofNumber: '', prazoEntrega: '', quantidade: 1, negativa: false,
  });

  const [exitDialog, setExitDialog] = useState<VentiladorStock | null>(null);
  const [exitObs, setExitObs] = useState('');

  const [confirmArrival, setConfirmArrival] = useState<VentiladorPending | null>(null);
  const [arrivalQty, setArrivalQty] = useState(1);

  // Reserva modal (substitui window.prompt)
  const [reserveDialog, setReserveDialog] = useState<{ stock: VentiladorStock; status: VentiladorStatus } | null>(null);
  const [reserveForm, setReserveForm] = useState({ cliente: '', ofNumber: '' });

  // Delete confirmations (substituem window.confirm/prompt)
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [deleteStockId, setDeleteStockId] = useState<string | null>(null);
  const [deleteStockPwd, setDeleteStockPwd] = useState('');

  // Bulk selection
  const [selectedStock, setSelectedStock] = useState<Set<string>>(new Set());
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [bulkDeleteStockOpen, setBulkDeleteStockOpen] = useState(false);
  const [bulkDeleteStockPwd, setBulkDeleteStockPwd] = useState('');
  const [bulkDeletePendingOpen, setBulkDeletePendingOpen] = useState(false);
  const [stockAvailableDialog, setStockAvailableDialog] = useState<{ disponivel: VentiladorStock; cliente: string; ofNumber: string; qty: number } | null>(null);

  const toggleSelectStock = (id: string) => {
    setSelectedStock(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectPending = (id: string) => {
    setSelectedPending(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAllStock = (ids: string[]) => {
    setSelectedStock(prev => {
      const allSelected = ids.length > 0 && ids.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev); ids.forEach(id => next.delete(id)); return next;
      }
      const next = new Set(prev); ids.forEach(id => next.add(id)); return next;
    });
  };
  const toggleSelectAllPending = (ids: string[]) => {
    setSelectedPending(prev => {
      const allSelected = ids.length > 0 && ids.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev); ids.forEach(id => next.delete(id)); return next;
      }
      const next = new Set(prev); ids.forEach(id => next.add(id)); return next;
    });
  };

  const confirmBulkDeleteStock = async () => {
    if (bulkDeleteStockPwd !== 'Jhonrob@1') {
      toast({ title: 'Senha incorreta', variant: 'destructive' }); return;
    }
    const ids = Array.from(selectedStock);
    try {
      await Promise.all(ids.map(id => deleteVentStock(id)));
      toast({ title: `${ids.length} ventilador(es) excluído(s)` });
      setSelectedStock(new Set());
      setBulkDeleteStockOpen(false);
      setBulkDeleteStockPwd('');
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const confirmBulkDeletePending = async () => {
    const ids = Array.from(selectedPending);
    try {
      await Promise.all(ids.map(id => deleteVentPending(id)));
      toast({ title: `${ids.length} pendência(s) excluída(s)` });
      setSelectedPending(new Set());
      setBulkDeletePendingOpen(false);
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  // ------- filters
  const filteredStock = useMemo(() => {
    return stock.filter(s => {
      if (tipoFilter !== 'all' && s.tipo !== tipoFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.code.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.cliente.toLowerCase().includes(q) ||
          s.ofNumber.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stock, tipoFilter, search]);

  // ------- ordenação do estoque
  type StockSortKey = 'code' | 'description' | 'tipo' | 'cliente' | 'ofNumber' | 'status' | 'voltaObra' | 'createdAt';
  const [stockSort, setStockSort] = useState<{ key: StockSortKey; dir: 'asc' | 'desc' } | null>(null);
  const toggleStockSort = (key: StockSortKey) => {
    setStockSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };
  const sortedStock = useMemo(() => {
    if (!stockSort) return filteredStock;
    const { key, dir } = stockSort;
    const mult = dir === 'asc' ? 1 : -1;
    const val = (s: VentiladorStock) => {
      switch (key) {
        case 'tipo': return VENT_TIPO_LABELS[s.tipo];
        case 'status': return VENT_STATUS_LABELS[s.status];
        case 'voltaObra': return s.voltaObra ? 1 : 0;
        case 'createdAt': return new Date(s.createdAt).getTime();
        default: return (s[key] as string) || '';
      }
    };
    return [...filteredStock].sort((a, b) => {
      const va = val(a); const vb = val(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult;
      const na = Number(va); const nb = Number(vb);
      if (String(va).trim() !== '' && String(vb).trim() !== '' && !isNaN(na) && !isNaN(nb)) return (na - nb) * mult;
      return String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base' }) * mult;
    });
  }, [filteredStock, stockSort]);

  const SortTh = ({ label, col, align = 'left' }: { label: string; col: StockSortKey; align?: 'left' | 'center' }) => {
    const active = stockSort?.key === col;
    return (
      <th className={`p-2 ${align === 'center' ? 'text-center' : 'text-left'}`}>
        <button
          type="button"
          onClick={() => toggleStockSort(col)}
          className={`inline-flex items-center gap-1 hover:text-primary transition-colors ${active ? 'text-primary font-semibold' : ''}`}
          title="Clique para ordenar"
        >
          {label}
          {active
            ? (stockSort!.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
            : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
        </button>
      </th>
    );
  };



  const filteredPending = useMemo(() => {
    return pending.filter(p => {
      if (tipoFilter !== 'all' && p.tipo !== tipoFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.cliente.toLowerCase().includes(q) ||
          p.ofNumber.toLowerCase().includes(q);
      }
      return true;
    });
  }, [pending, tipoFilter, search]);

  const filteredMovs = useMemo(() => {
    return movs.filter(m => {
      if (tipoFilter !== 'all' && m.tipo !== tipoFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.code.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.cliente.toLowerCase().includes(q);
      }
      return true;
    });
  }, [movs, tipoFilter, search]);

  // ------- actions
  const submitStock = async () => {
    if (!stockForm.code.trim() || !stockForm.description.trim()) {
      toast({ title: 'Preencha código e descrição', variant: 'destructive' }); return;
    }
    const isEstoque = stockForm.clienteMode === 'estoque';
    const cliente = isEstoque ? '' : stockForm.cliente.trim();
    const ofNumber = isEstoque ? '' : stockForm.ofNumber.trim();
    const status: VentiladorStatus = isEstoque ? 'disponivel' : 'reservado';
    if (!isEstoque && !cliente) {
      toast({ title: 'Informe o cliente ou selecione ESTOQUE', variant: 'destructive' }); return;
    }
    try {
      await addVentStock({
        code: stockForm.code, description: stockForm.description, tipo: stockForm.tipo,
        cliente, ofNumber, status, voltaObra: stockForm.voltaObra,
      });
      await addVentMovement({
        ventiladorId: null,
        code: stockForm.code, description: stockForm.description, tipo: stockForm.tipo,
        type: 'entrada', cliente, ofNumber,
        observacao: stockForm.voltaObra ? 'Entrada - volta de obra' : 'Entrada manual em estoque',
        date: todayLocalISO(),
      });
      setStockDialog(false);
      setStockForm({ code: '', description: '', tipo: 'SILO', clienteMode: 'estoque', cliente: '', ofNumber: '', voltaObra: false });
      toast({ title: 'Ventilador adicionado ao estoque' });
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const resetPendingForm = () => {
    setPendingForm({ code: '', description: '', tipo: 'SILO', cliente: '', ofNumber: '', prazoEntrega: '', quantidade: 1, negativa: false });
    setEditingPendingId(null);
  };

  const openEditPending = (p: VentiladorPending) => {
    setPendingForm({
      code: p.code, description: p.description, tipo: p.tipo,
      cliente: p.cliente, ofNumber: p.ofNumber, prazoEntrega: p.prazoEntrega,
      quantidade: p.quantidade,
      negativa: p.negativa,
    });
    setEditingPendingId(p.id);
    setPendingDialog(true);
  };

  const toggleNegativa = async (p: VentiladorPending) => {
    try {
      await updateVentPending(p.id, { negativa: !p.negativa });
      setPending(prev => prev.map(x => (x.id === p.id ? { ...x, negativa: !p.negativa } : x)));
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const submitPending = async () => {
    const { code, description, cliente, ofNumber, prazoEntrega, quantidade, tipo } = pendingForm;
    if (!code.trim() || !description.trim() || !cliente.trim() || !ofNumber.trim() || !prazoEntrega.trim()) {
      toast({ title: 'Preencha TODOS os campos obrigatórios', variant: 'destructive' }); return;
    }
    const qty = Math.max(1, Number(quantidade) || 1);

    // Edit mode
    if (editingPendingId) {
      try {
        await updateVentPending(editingPendingId, {
          code, description, tipo, cliente, ofNumber, prazoEntrega, quantidade: qty, negativa: pendingForm.negativa,
        });
        setPendingDialog(false);
        resetPendingForm();
        toast({ title: 'Pendência atualizada' });
        reload();
      } catch (e: any) {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' });
      }
      return;
    }

    const disponivel = stock.find(s =>
      s.code.trim().toLowerCase() === code.trim().toLowerCase() &&
      s.status === 'disponivel',
    );
    if (disponivel) {
      setStockAvailableDialog({ disponivel, cliente, ofNumber, qty });
      return;
    }
    await createPendingNow(qty);
  };

  const createPendingNow = async (qty: number) => {
    try {
      const maxP = pending.reduce((mx, p) => Math.max(mx, p.priority), 0);
      await addVentPending({ ...pendingForm, quantidade: qty, priority: maxP + 1 });
      setPendingDialog(false);
      resetPendingForm();
      toast({ title: 'Pendência registrada' });
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const reserveFromStock = async () => {
    if (!stockAvailableDialog) return;
    const { disponivel, cliente, ofNumber, qty } = stockAvailableDialog;
    try {
      await updateVentStock(disponivel.id, { status: 'reservado', cliente, ofNumber });
      toast({ title: 'Ventilador reservado no estoque' });
      setStockAvailableDialog(null);
      // If more than 1 was requested, create pendência for the remaining
      if (qty > 1) {
        await createPendingNow(qty - 1);
      } else {
        setPendingDialog(false);
        resetPendingForm();
        reload();
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const createPendingAnyway = async () => {
    if (!stockAvailableDialog) return;
    const qty = stockAvailableDialog.qty;
    setStockAvailableDialog(null);
    await createPendingNow(qty);
  };

  // ------- arrastar para reordenar prioridade
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDropOn = async (targetId: string) => {
    const sourceId = dragId;
    setDragId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    const list = [...pending].sort((a, b) => a.priority - b.priority);
    const from = list.findIndex(p => p.id === sourceId);
    const to = list.findIndex(p => p.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    const renumbered = list.map((p, i) => ({ ...p, priority: i + 1 }));
    setPending(renumbered); // otimista: sem delay
    try {
      await reorderVentPending(renumbered.map(p => ({ id: p.id, priority: p.priority })));
    } catch (e: any) {
      toast({ title: 'Erro ao reordenar', description: e.message, variant: 'destructive' });
      reload();
    }
  };


  const openArrival = (p: VentiladorPending) => {
    setArrivalQty(p.quantidade);
    setConfirmArrival(p);
  };

  const confirmArrivalAction = async () => {
    if (!confirmArrival) return;
    const p = confirmArrival;
    const chegou = Math.max(1, Math.min(p.quantidade, Number(arrivalQty) || 0));
    try {
      for (let i = 0; i < chegou; i++) {
        await addVentStock({
          code: p.code, description: p.description, tipo: p.tipo,
          cliente: p.cliente, ofNumber: p.ofNumber, status: 'reservado', voltaObra: false,
        });
        await addVentMovement({
          ventiladorId: null,
          code: p.code, description: p.description, tipo: p.tipo,
          type: 'entrada', cliente: p.cliente, ofNumber: p.ofNumber,
          observacao: `Chegada de carga - reservado para ${p.cliente}`,
          date: todayLocalISO(),
        });
      }
      const restante = p.quantidade - chegou;
      if (restante <= 0) {
        await deleteVentPending(p.id);
        toast({ title: `${chegou} ventilador(es) recebido(s). Pendência concluída.` });
      } else {
        await updateVentPending(p.id, { quantidade: restante });
        toast({ title: `${chegou} chegou(aram). Restam ${restante} na pendência.` });
      }
      setConfirmArrival(null);
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const doExit = async () => {
    if (!exitDialog) return;
    try {
      await addVentMovement({
        ventiladorId: exitDialog.id,
        code: exitDialog.code, description: exitDialog.description, tipo: exitDialog.tipo,
        type: 'saida', cliente: exitDialog.cliente, ofNumber: exitDialog.ofNumber,
        observacao: exitObs, date: todayLocalISO(),
      });
      await deleteVentStock(exitDialog.id);
      toast({ title: 'Baixa realizada' });
      setExitDialog(null); setExitObs('');
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const confirmDeletePending = async () => {
    if (!deletePendingId) return;
    try {
      await deleteVentPending(deletePendingId);
      toast({ title: 'Pendência excluída' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDeletePendingId(null);
    reload();
  };

  const confirmDeleteStock = async () => {
    if (!deleteStockId) return;
    if (deleteStockPwd !== 'Jhonrob@1') {
      toast({ title: 'Senha incorreta', variant: 'destructive' }); return;
    }
    try {
      await deleteVentStock(deleteStockId);
      toast({ title: 'Ventilador excluído' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDeleteStockId(null); setDeleteStockPwd('');
    reload();
  };

  const setStockStatus = async (s: VentiladorStock, status: VentiladorStatus) => {
    if (status === 'disponivel') {
      await updateVentStock(s.id, { status, cliente: '', ofNumber: '' });
      reload();
      return;
    }
    setReserveForm({ cliente: s.cliente || '', ofNumber: s.ofNumber || '' });
    setReserveDialog({ stock: s, status });
  };

  const confirmReserve = async () => {
    if (!reserveDialog) return;
    if (!reserveForm.cliente.trim()) {
      toast({ title: 'Informe o cliente', variant: 'destructive' }); return;
    }
    await updateVentStock(reserveDialog.stock.id, {
      status: reserveDialog.status,
      cliente: reserveForm.cliente.trim(),
      ofNumber: reserveForm.ofNumber.trim(),
    });
    setReserveDialog(null);
    reload();
  };

  const toggleVoltaObra = async (s: VentiladorStock) => {
    await updateVentStock(s.id, { voltaObra: !s.voltaObra });
    reload();
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Fan className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Ventiladores</h1>
          </div>
          <div className="flex gap-2">
            <Button variant={tab === 'stock' ? 'default' : 'outline'} size="sm" onClick={() => setTab('stock')}>
              <Warehouse className="w-4 h-4 mr-1" /> Estoque
            </Button>
            <Button variant={tab === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setTab('pending')}>
              <ClipboardList className="w-4 h-4 mr-1" /> Pendências
            </Button>
            <Button variant={tab === 'mov' ? 'default' : 'outline'} size="sm" onClick={() => setTab('mov')}>
              <ArrowLeftRight className="w-4 h-4 mr-1" /> Movimentações
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar código, descrição, cliente, OF..." className="pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant={tipoFilter === 'all' ? 'default' : 'outline'} onClick={() => setTipoFilter('all')}>Todos</Button>
            {TIPO_OPTIONS.map(t => (
              <Button key={t} size="sm" variant={tipoFilter === t ? 'default' : 'outline'} onClick={() => setTipoFilter(t)}>
                {VENT_TIPO_LABELS[t]}
              </Button>
            ))}
          </div>
          {tab === 'stock' && (
            <Button size="sm" className="ml-auto" onClick={() => setStockDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Entrada de Ventilador
            </Button>
          )}
          {tab === 'pending' && (
            <Button size="sm" className="ml-auto" onClick={() => setPendingDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova Pendência
            </Button>
          )}
        </div>

        {/* Resumo */}
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="rounded border px-3 py-1.5 bg-muted/40">
            Total em estoque: <span className="font-bold text-primary">{stock.length}</span>
          </div>
          <div className="rounded border px-3 py-1.5 bg-muted/40">
            Pendências: <span className="font-bold text-yellow-600">
              {pending.reduce((n, p) => n + p.quantidade, 0)}
            </span>
          </div>
          <div className="rounded border px-3 py-1.5 bg-muted/40">
            Em negativa: <span className="font-bold text-red-600">
              {pending.filter(p => p.negativa).length}
            </span>
          </div>
          <div className="rounded border px-3 py-1.5 bg-muted/40">
            Reservados: <span className="font-bold text-yellow-600">
              {stock.filter(s => s.status === 'reservado').length}
            </span>
          </div>
          <div className="rounded border px-3 py-1.5 bg-muted/40">
            Volta de obra: <span className="font-bold text-orange-600">
              {stock.filter(s => s.voltaObra).length}
            </span>
          </div>
        </div>

        {/* TAB: STOCK */}
        {tab === 'stock' && (
          <>
            {selectedStock.size > 0 && (
              <div className="flex items-center justify-between border rounded-md p-2 bg-muted/40">
                <span className="text-sm">
                  <strong>{selectedStock.size}</strong> selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedStock(new Set())}>Limpar</Button>
                  <Button size="sm" variant="destructive" onClick={() => { setBulkDeleteStockOpen(true); setBulkDeleteStockPwd(''); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir selecionado(s)
                  </Button>
                </div>
              </div>
            )}
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="p-2 w-8">
                      <Checkbox
                        checked={filteredStock.length > 0 && filteredStock.every(s => selectedStock.has(s.id))}
                        onCheckedChange={() => toggleSelectAllStock(filteredStock.map(s => s.id))}
                        aria-label="Selecionar todos"
                      />
                    </th>
                    <SortTh label="Código" col="code" />
                    <SortTh label="Descrição" col="description" />
                    <SortTh label="Tipo" col="tipo" />
                    <SortTh label="Cliente" col="cliente" />
                    <SortTh label="OF" col="ofNumber" />
                    <SortTh label="Status" col="status" />
                    <SortTh label="V.O." col="voltaObra" align="center" />
                    <SortTh label="Data" col="createdAt" />
                    <th className="text-right p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStock.map(s => (
                    <tr key={s.id} className={`border-t ${
                      s.status === 'reservado' ? 'bg-yellow-500/10' :
                      s.status === 'vendido' ? 'bg-red-500/10' : ''
                    }`}>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={selectedStock.has(s.id)}
                          onCheckedChange={() => toggleSelectStock(s.id)}
                          aria-label="Selecionar"
                        />
                      </td>
                      <td className="p-2 font-mono">{s.code}</td>
                      <td className="p-2">{s.description}</td>
                      <td className="p-2">{VENT_TIPO_LABELS[s.tipo]}</td>
                      <td className="p-2">{s.cliente || <span className="text-muted-foreground">ESTOQUE</span>}</td>
                      <td className="p-2">{s.ofNumber || '-'}</td>
                      <td className="p-2">
                        <Select value={s.status} onValueChange={(v) => setStockStatus(s, v as VentiladorStatus)}>
                          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(VENT_STATUS_LABELS) as VentiladorStatus[]).map(k =>
                              <SelectItem key={k} value={k}>{VENT_STATUS_LABELS[k]}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={s.voltaObra}
                          onCheckedChange={() => toggleVoltaObra(s)}
                          title="Volta de obra"
                          aria-label="Volta de obra"
                        />
                      </td>
                      <td className="p-2">{formatDateBR(s.createdAt)}</td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <Button size="sm" variant="outline" onClick={() => setExitDialog(s)}>
                          <PackageCheck className="w-3.5 h-3.5 mr-1" /> Baixa
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-1" onClick={() => { setDeleteStockId(s.id); setDeleteStockPwd(''); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredStock.length === 0 && (
                    <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">Nenhum ventilador em estoque.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB: PENDING */}
        {tab === 'pending' && (
          <>
            {selectedPending.size > 0 && (
              <div className="flex items-center justify-between border rounded-md p-2 bg-muted/40">
                <span className="text-sm">
                  <strong>{selectedPending.size}</strong> selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedPending(new Set())}>Limpar</Button>
                  <Button size="sm" variant="destructive" onClick={() => setBulkDeletePendingOpen(true)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir selecionado(s)
                  </Button>
                </div>
              </div>
            )}
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="p-2 w-8">
                      <Checkbox
                        checked={filteredPending.length > 0 && filteredPending.every(p => selectedPending.has(p.id))}
                        onCheckedChange={() => toggleSelectAllPending(filteredPending.map(p => p.id))}
                        aria-label="Selecionar todos"
                      />
                    </th>
                    <th className="text-left p-2 w-20">Prioridade</th>
                    <th className="text-left p-2 w-24">Código</th>
                    <th className="text-left p-2">Descrição</th>
                    <th className="text-left p-2 w-28">Tipo</th>
                    <th className="text-left p-2 w-32">Cliente</th>
                    <th className="text-left p-2 w-24">OF</th>
                    <th className="text-center p-2 w-12">Qtd</th>
                    <th className="text-center p-2 w-12" title="Negativa: itens que ainda faltam separar para o cliente">Neg.</th>
                    <th className="text-left p-2 w-24">Prazo</th>
                    <th className="text-right p-2 w-44">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((p, idx) => (
                    <tr
                      key={p.id}
                      draggable
                      onDragStart={() => setDragId(p.id)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverId(p.id); }}
                      onDragLeave={() => setDragOverId(prev => (prev === p.id ? null : prev))}
                      onDrop={() => handleDropOn(p.id)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                      className={`border-t transition-colors ${p.negativa ? 'bg-red-500/10' : ''} ${dragId === p.id ? 'opacity-50' : ''} ${
                        dragOverId === p.id && dragId !== p.id ? 'bg-primary/10 border-t-2 border-t-primary' : ''
                      }`}
                    >
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={selectedPending.has(p.id)}
                          onCheckedChange={() => toggleSelectPending(p.id)}
                          aria-label="Selecionar"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing" title="Arraste para alterar a prioridade">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-bold w-5 text-center">{idx + 1}</span>
                        </div>
                      </td>

                      <td className="p-2 font-mono whitespace-nowrap overflow-hidden text-ellipsis">{p.code}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                          <span className="overflow-hidden text-ellipsis">{p.description}</span>
                          {p.negativa && (
                            <span className="shrink-0 rounded px-1 py-0 text-[9px] font-bold bg-red-600 text-white leading-tight" title="Cliente em negativa - prioridade máxima">
                              NEG
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap">{VENT_TIPO_LABELS[p.tipo]}</td>
                      <td className="p-2 whitespace-nowrap overflow-hidden text-ellipsis">{p.cliente}</td>
                      <td className="p-2 whitespace-nowrap">{p.ofNumber || '-'}</td>
                      <td className="p-2 text-center font-bold">{p.quantidade}</td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={p.negativa}
                          onCheckedChange={() => toggleNegativa(p)}
                          title="Marcar como NEGATIVA (urgente)"
                          aria-label="Negativa"
                        />
                      </td>
                      <td className="p-2">{p.prazoEntrega ? formatDateBR(p.prazoEntrega) : '-'}</td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <Button size="sm" onClick={() => openArrival(p)}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Confirmar chegada
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-1" onClick={() => openEditPending(p)} title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-1" onClick={() => setDeletePendingId(p.id)} title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredPending.length === 0 && (
                    <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">Nenhuma pendência registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white">NEGATIVA</span>
              Cliente com itens pendentes que ainda faltam separar — prioridade máxima de atendimento.
            </p>
          </>
        )}


        {/* TAB: MOV */}
        {tab === 'mov' && (
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Modelo</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">OF</th>
                  <th className="text-left p-2">Observação</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovs.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2">{formatDateBR(m.date)}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        m.type === 'entrada' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
                      }`}>
                        {m.type === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                      </span>
                    </td>
                    <td className="p-2 font-mono">{m.code}</td>
                    <td className="p-2">{m.description}</td>
                    <td className="p-2">{VENT_TIPO_LABELS[m.tipo]}</td>
                    <td className="p-2">{m.cliente || '-'}</td>
                    <td className="p-2">{m.ofNumber || '-'}</td>
                    <td className="p-2">{m.observacao || '-'}</td>
                  </tr>
                ))}
                {filteredMovs.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Sem movimentações.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog: Entrada de estoque */}
      <Dialog open={stockDialog} onOpenChange={setStockDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entrada de Ventilador</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={stockForm.code} onChange={e => setStockForm({ ...stockForm, code: e.target.value })} /></div>
              <div>
                <Label>Modelo *</Label>
                <Select value={stockForm.tipo} onValueChange={(v) => setStockForm({ ...stockForm, tipo: v as VentiladorTipo })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPO_OPTIONS.map(t => <SelectItem key={t} value={t}>{VENT_TIPO_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição *</Label><Input value={stockForm.description} onChange={e => setStockForm({ ...stockForm, description: e.target.value })} /></div>
            <div>
              <Label>Destino</Label>
              <Select
                value={stockForm.clienteMode}
                onValueChange={(v) => setStockForm({ ...stockForm, clienteMode: v as 'estoque' | 'cliente' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="estoque">ESTOQUE (disponível)</SelectItem>
                  <SelectItem value="cliente">Cliente específico (reservado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {stockForm.clienteMode === 'cliente' && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cliente *</Label><Input value={stockForm.cliente} onChange={e => setStockForm({ ...stockForm, cliente: e.target.value })} /></div>
                <div><Label>OF (opcional)</Label><Input value={stockForm.ofNumber} onChange={e => setStockForm({ ...stockForm, ofNumber: e.target.value })} /></div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm pt-1 text-muted-foreground cursor-pointer">
              <Checkbox
                checked={stockForm.voltaObra}
                onCheckedChange={(v) => setStockForm({ ...stockForm, voltaObra: Boolean(v) })}
              />
              Volta de obra
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialog(false)}>Cancelar</Button>
            <Button onClick={submitStock}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Pending (nova / editar) */}
      <Dialog open={pendingDialog} onOpenChange={(o) => { setPendingDialog(o); if (!o) resetPendingForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPendingId ? 'Editar Pendência' : 'Nova Pendência'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={pendingForm.code} onChange={e => setPendingForm({ ...pendingForm, code: e.target.value })} /></div>
              <div>
                <Label>Modelo *</Label>
                <Select value={pendingForm.tipo} onValueChange={(v) => setPendingForm({ ...pendingForm, tipo: v as VentiladorTipo })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPO_OPTIONS.map(t => <SelectItem key={t} value={t}>{VENT_TIPO_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição *</Label><Input value={pendingForm.description} onChange={e => setPendingForm({ ...pendingForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cliente *</Label><Input value={pendingForm.cliente} onChange={e => setPendingForm({ ...pendingForm, cliente: e.target.value })} /></div>
              <div><Label>OF *</Label><Input value={pendingForm.ofNumber} onChange={e => setPendingForm({ ...pendingForm, ofNumber: e.target.value })} /></div>
              <div>
                <Label>Quantidade *</Label>
                <Input type="number" min={1} value={pendingForm.quantidade}
                  onChange={e => setPendingForm({ ...pendingForm, quantidade: Number(e.target.value) || 1 })} />
              </div>
            </div>
            <div>
              <Label>Prazo de entrega *</Label>
              <Input type="date" value={pendingForm.prazoEntrega} onChange={e => setPendingForm({ ...pendingForm, prazoEntrega: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={pendingForm.negativa}
                onCheckedChange={(v) => setPendingForm({ ...pendingForm, negativa: Boolean(v) })}
              />
              Cliente em <strong>NEGATIVA</strong> (itens que ainda faltam separar — urgente)
            </label>
            <p className="text-xs text-muted-foreground">Todos os campos marcados com * são obrigatórios.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingDialog(false); resetPendingForm(); }}>Cancelar</Button>
            <Button onClick={submitPending}>{editingPendingId ? 'Salvar alterações' : 'Registrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão de pendência */}
      <Dialog open={!!deletePendingId} onOpenChange={(o) => !o && setDeletePendingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir pendência</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta pendência? Esta ação não poderá ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePendingId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeletePending}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão de estoque (com senha) */}
      <Dialog open={!!deleteStockId} onOpenChange={(o) => { if (!o) { setDeleteStockId(null); setDeleteStockPwd(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir ventilador do estoque</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Senha para excluir</Label>
            <Input
              type="password"
              autoFocus
              value={deleteStockPwd}
              onChange={e => setDeleteStockPwd(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmDeleteStock(); }}
              placeholder="Digite a senha"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteStockId(null); setDeleteStockPwd(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteStock}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete stock (com senha) */}
      <Dialog open={bulkDeleteStockOpen} onOpenChange={(o) => { if (!o) { setBulkDeleteStockOpen(false); setBulkDeleteStockPwd(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir {selectedStock.size} ventilador(es)</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Esta ação não poderá ser desfeita. Digite a senha para confirmar.
            </p>
            <Label>Senha</Label>
            <Input
              type="password"
              autoFocus
              value={bulkDeleteStockPwd}
              onChange={e => setBulkDeleteStockPwd(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmBulkDeleteStock(); }}
              placeholder="Digite a senha"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkDeleteStockOpen(false); setBulkDeleteStockPwd(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmBulkDeleteStock}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete pending */}
      <Dialog open={bulkDeletePendingOpen} onOpenChange={(o) => !o && setBulkDeletePendingOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir {selectedPending.size} pendência(s)</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir as pendências selecionadas? Esta ação não poderá ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeletePendingOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmBulkDeletePending}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>




      {/* Confirm arrival */}
      <Dialog open={!!confirmArrival} onOpenChange={(o) => !o && setConfirmArrival(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar chegada de carga</DialogTitle></DialogHeader>
          {confirmArrival && (
            <div className="text-sm space-y-2">
              <div><strong>Código:</strong> {confirmArrival.code}</div>
              <div><strong>Descrição:</strong> {confirmArrival.description}</div>
              <div><strong>Modelo:</strong> {VENT_TIPO_LABELS[confirmArrival.tipo]}</div>
              <div><strong>Cliente:</strong> {confirmArrival.cliente}</div>
              <div><strong>OF:</strong> {confirmArrival.ofNumber || '-'}</div>
              <div><strong>Pendente:</strong> {confirmArrival.quantidade}</div>
              <div className="pt-2">
                <Label>Quantos ventiladores chegaram?</Label>
                <Input type="number" min={1} max={confirmArrival.quantidade}
                  value={arrivalQty}
                  onChange={e => setArrivalQty(Number(e.target.value) || 1)} />
                <p className="text-xs text-muted-foreground mt-1">
                  Máx: {confirmArrival.quantidade}. Restante ficará na pendência.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmArrival(null)}>Cancelar</Button>
            <Button onClick={confirmArrivalAction}>Confirmar chegada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reserve dialog (substitui window.prompt) */}
      <Dialog open={!!reserveDialog} onOpenChange={(o) => !o && setReserveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reserveDialog?.status === 'vendido' ? 'Marcar como Vendido' : 'Reservar Ventilador'}
            </DialogTitle>
          </DialogHeader>
          {reserveDialog && (
            <div className="text-sm space-y-3">
              <div>
                <strong>{reserveDialog.stock.code}</strong> - {reserveDialog.stock.description}
              </div>
              <div>
                <Label>Cliente *</Label>
                <Input
                  autoFocus
                  value={reserveForm.cliente}
                  onChange={e => setReserveForm({ ...reserveForm, cliente: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label>OF</Label>
                <Input
                  value={reserveForm.ofNumber}
                  onChange={e => setReserveForm({ ...reserveForm, ofNumber: e.target.value })}
                  placeholder="Número da OF (opcional)"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReserveDialog(null)}>Cancelar</Button>
            <Button onClick={confirmReserve}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit dialog */}
      <Dialog open={!!exitDialog} onOpenChange={(o) => !o && setExitDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dar baixa (saída)</DialogTitle></DialogHeader>
          {exitDialog && (
            <div className="text-sm space-y-2">
              <div><strong>{exitDialog.code}</strong> - {exitDialog.description}</div>
              <div>Cliente: {exitDialog.cliente || '-'} | OF: {exitDialog.ofNumber || '-'}</div>
              <div>
                <Label>Observação</Label>
                <Textarea value={exitObs} onChange={e => setExitObs(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExitDialog(null); setExitObs(''); }}>Cancelar</Button>
            <Button onClick={doExit}>Confirmar baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ventilador disponível em estoque */}
      <Dialog open={!!stockAvailableDialog} onOpenChange={(o) => !o && setStockAvailableDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-warning/15 text-warning">⚠️</span>
              Ventilador disponível em estoque
            </DialogTitle>
          </DialogHeader>
          {stockAvailableDialog && (
            <div className="text-sm space-y-3">
              <div className="rounded-md border bg-muted/40 p-3 space-y-1">
                <div><span className="text-muted-foreground">Código:</span> <strong>{stockAvailableDialog.disponivel.code}</strong></div>
                <div><span className="text-muted-foreground">Descrição:</span> {stockAvailableDialog.disponivel.description}</div>
                <div><span className="text-muted-foreground">Modelo:</span> {VENT_TIPO_LABELS[stockAvailableDialog.disponivel.tipo]}</div>
              </div>
              <p>
                Existe <strong>1 unidade disponível</strong> em estoque com este código.
                Deseja <strong>reservar</strong> a unidade do estoque para{' '}
                <strong>{stockAvailableDialog.cliente}</strong>
                {stockAvailableDialog.ofNumber ? ` (OF ${stockAvailableDialog.ofNumber})` : ''}?
              </p>
              {stockAvailableDialog.qty > 1 && (
                <p className="text-xs text-muted-foreground">
                  A quantidade pendente é {stockAvailableDialog.qty}. Ao reservar, 1 sai do estoque e {stockAvailableDialog.qty - 1} ficarão como pendência.
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={createPendingAnyway}>
              Criar pendência mesmo assim
            </Button>
            <Button onClick={reserveFromStock}>
              Reservar do estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
