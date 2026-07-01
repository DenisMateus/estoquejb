import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Fan, Plus, Search, Trash2, ArrowDown, ArrowUp, Check, PackageCheck,
  Warehouse, ClipboardList, ArrowLeftRight,
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
    cliente: '', ofNumber: '', status: 'disponivel' as VentiladorStatus,
  });

  const [pendingDialog, setPendingDialog] = useState(false);
  const [pendingForm, setPendingForm] = useState({
    code: '', description: '', tipo: 'SILO' as VentiladorTipo,
    cliente: '', ofNumber: '', prazoEntrega: '',
  });

  const [exitDialog, setExitDialog] = useState<VentiladorStock | null>(null);
  const [exitObs, setExitObs] = useState('');

  const [confirmArrival, setConfirmArrival] = useState<VentiladorPending | null>(null);

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
    try {
      await addVentStock({ ...stockForm });
      await addVentMovement({
        ventiladorId: null,
        code: stockForm.code, description: stockForm.description, tipo: stockForm.tipo,
        type: 'entrada', cliente: stockForm.cliente, ofNumber: stockForm.ofNumber,
        observacao: 'Entrada manual em estoque', date: todayLocalISO(),
      });
      setStockDialog(false);
      setStockForm({ code: '', description: '', tipo: 'SILO', cliente: '', ofNumber: '', status: 'disponivel' });
      toast({ title: 'Ventilador adicionado ao estoque' });
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const submitPending = async () => {
    if (!pendingForm.code.trim() || !pendingForm.description.trim() || !pendingForm.cliente.trim()) {
      toast({ title: 'Preencha código, descrição e cliente', variant: 'destructive' }); return;
    }
    // Verifica se há ventilador com mesmo código disponível em estoque
    const disponivel = stock.find(s =>
      s.code.trim().toLowerCase() === pendingForm.code.trim().toLowerCase() &&
      s.status === 'disponivel',
    );
    if (disponivel) {
      const ok = window.confirm(
        `⚠️ Existe um ventilador "${disponivel.code}" DISPONÍVEL em estoque!\n\n` +
        `Deseja RESERVAR o do estoque para ${pendingForm.cliente} (OF ${pendingForm.ofNumber || '-'}) em vez de criar uma pendência?`,
      );
      if (ok) {
        await updateVentStock(disponivel.id, {
          status: 'reservado', cliente: pendingForm.cliente, ofNumber: pendingForm.ofNumber,
        });
        toast({ title: 'Ventilador reservado no estoque' });
        setPendingDialog(false);
        setPendingForm({ code: '', description: '', tipo: 'SILO', cliente: '', ofNumber: '', prazoEntrega: '' });
        reload();
        return;
      }
    }
    try {
      const maxP = pending.reduce((mx, p) => Math.max(mx, p.priority), 0);
      await addVentPending({ ...pendingForm, priority: maxP + 1 });
      setPendingDialog(false);
      setPendingForm({ code: '', description: '', tipo: 'SILO', cliente: '', ofNumber: '', prazoEntrega: '' });
      toast({ title: 'Pendência registrada' });
      reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const movePriority = async (idx: number, dir: -1 | 1) => {
    const list = [...filteredPending];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    // troca prioridade
    const a = list[idx]; const b = list[target];
    const pa = a.priority; const pb = b.priority;
    await reorderVentPending([
      { id: a.id, priority: pb },
      { id: b.id, priority: pa },
    ]);
    reload();
  };

  const confirmArrivalAction = async (p: VentiladorPending) => {
    // Cria stock reservado ao cliente e remove pendência
    try {
      await addVentStock({
        code: p.code, description: p.description, tipo: p.tipo,
        cliente: p.cliente, ofNumber: p.ofNumber, status: 'reservado',
      });
      await addVentMovement({
        ventiladorId: null,
        code: p.code, description: p.description, tipo: p.tipo,
        type: 'entrada', cliente: p.cliente, ofNumber: p.ofNumber,
        observacao: `Chegada de carga - reservado para ${p.cliente}`,
        date: todayLocalISO(),
      });
      await deleteVentPending(p.id);
      toast({ title: `Ventilador de ${p.cliente} recebido e reservado` });
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

  const removePending = async (id: string) => {
    if (!window.confirm('Excluir esta pendência?')) return;
    await deleteVentPending(id); reload();
  };

  const removeStock = async (id: string) => {
    const pwd = window.prompt('Senha para excluir:');
    if (pwd !== 'Jhonrob@1') { toast({ title: 'Senha incorreta', variant: 'destructive' }); return; }
    await deleteVentStock(id); reload();
  };

  const setStockStatus = async (s: VentiladorStock, status: VentiladorStatus) => {
    let cliente = s.cliente; let of = s.ofNumber;
    if (status !== 'disponivel') {
      const c = window.prompt('Cliente:', s.cliente || '');
      if (c === null) return;
      cliente = c;
      const o = window.prompt('OF:', s.ofNumber || '');
      if (o === null) return;
      of = o;
    }
    await updateVentStock(s.id, { status, cliente, ofNumber: of });
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
            Pendências: <span className="font-bold text-yellow-600">{pending.length}</span>
          </div>
          <div className="rounded border px-3 py-1.5 bg-muted/40">
            Reservados: <span className="font-bold text-yellow-600">
              {stock.filter(s => s.status === 'reservado').length}
            </span>
          </div>
        </div>

        {/* TAB: STOCK */}
        {tab === 'stock' && (
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">OF</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-right p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map(s => (
                  <tr key={s.id} className={`border-t ${
                    s.status === 'reservado' ? 'bg-yellow-500/10' :
                    s.status === 'vendido' ? 'bg-red-500/10' : ''
                  }`}>
                    <td className="p-2 font-mono">{s.code}</td>
                    <td className="p-2">{s.description}</td>
                    <td className="p-2">{VENT_TIPO_LABELS[s.tipo]}</td>
                    <td className="p-2">{s.cliente || '-'}</td>
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
                    <td className="p-2">{formatDateBR(s.createdAt)}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => setExitDialog(s)}>
                        <PackageCheck className="w-3.5 h-3.5 mr-1" /> Baixa
                      </Button>
                      <Button size="sm" variant="ghost" className="ml-1" onClick={() => removeStock(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredStock.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhum ventilador em estoque.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: PENDING */}
        {tab === 'pending' && (
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left p-2 w-16">Ordem</th>
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">OF</th>
                  <th className="text-left p-2">Prazo</th>
                  <th className="text-right p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((p, idx) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <span className="font-bold w-5 text-center">{idx + 1}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => movePriority(idx, -1)} disabled={idx === 0}>
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => movePriority(idx, 1)} disabled={idx === filteredPending.length - 1}>
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-2 font-mono">{p.code}</td>
                    <td className="p-2">{p.description}</td>
                    <td className="p-2">{VENT_TIPO_LABELS[p.tipo]}</td>
                    <td className="p-2">{p.cliente}</td>
                    <td className="p-2">{p.ofNumber || '-'}</td>
                    <td className="p-2">{p.prazoEntrega ? formatDateBR(p.prazoEntrega) : '-'}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <Button size="sm" onClick={() => setConfirmArrival(p)}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Confirmar chegada
                      </Button>
                      <Button size="sm" variant="ghost" className="ml-1" onClick={() => removePending(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredPending.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhuma pendência registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cliente (opcional)</Label><Input value={stockForm.cliente} onChange={e => setStockForm({ ...stockForm, cliente: e.target.value })} /></div>
              <div><Label>OF (opcional)</Label><Input value={stockForm.ofNumber} onChange={e => setStockForm({ ...stockForm, ofNumber: e.target.value })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={stockForm.status} onValueChange={(v) => setStockForm({ ...stockForm, status: v as VentiladorStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(VENT_STATUS_LABELS) as VentiladorStatus[]).map(k =>
                  <SelectItem key={k} value={k}>{VENT_STATUS_LABELS[k]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialog(false)}>Cancelar</Button>
            <Button onClick={submitStock}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Pending */}
      <Dialog open={pendingDialog} onOpenChange={setPendingDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Pendência</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cliente *</Label><Input value={pendingForm.cliente} onChange={e => setPendingForm({ ...pendingForm, cliente: e.target.value })} /></div>
              <div><Label>OF</Label><Input value={pendingForm.ofNumber} onChange={e => setPendingForm({ ...pendingForm, ofNumber: e.target.value })} /></div>
            </div>
            <div>
              <Label>Prazo de entrega</Label>
              <Input type="date" value={pendingForm.prazoEntrega} onChange={e => setPendingForm({ ...pendingForm, prazoEntrega: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDialog(false)}>Cancelar</Button>
            <Button onClick={submitPending}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm arrival */}
      <Dialog open={!!confirmArrival} onOpenChange={(o) => !o && setConfirmArrival(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar chegada de carga</DialogTitle></DialogHeader>
          {confirmArrival && (
            <div className="text-sm space-y-1">
              <div><strong>Código:</strong> {confirmArrival.code}</div>
              <div><strong>Descrição:</strong> {confirmArrival.description}</div>
              <div><strong>Modelo:</strong> {VENT_TIPO_LABELS[confirmArrival.tipo]}</div>
              <div><strong>Cliente:</strong> {confirmArrival.cliente}</div>
              <div><strong>OF:</strong> {confirmArrival.ofNumber || '-'}</div>
              <p className="mt-3 text-muted-foreground">
                Este ventilador irá para o Estoque como <strong>Reservado</strong> para {confirmArrival.cliente} e sairá da lista de pendências.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmArrival(null)}>Cancelar</Button>
            <Button onClick={() => confirmArrival && confirmArrivalAction(confirmArrival)}>Confirmar chegada</Button>
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
    </AppLayout>
  );
}
