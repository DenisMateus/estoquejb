import { supabase } from '@/integrations/supabase/client';

export type VentiladorTipo = 'SILO' | 'TORRADOR' | 'ARMAZEM';
export const VENT_TIPO_LABELS: Record<VentiladorTipo, string> = {
  SILO: 'Silo',
  TORRADOR: 'Torrador',
  ARMAZEM: 'Armazém',
};

export type VentiladorStatus = 'disponivel' | 'reservado' | 'vendido';
export const VENT_STATUS_LABELS: Record<VentiladorStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

export interface VentiladorStock {
  id: string;
  code: string;
  description: string;
  tipo: VentiladorTipo;
  cliente: string;
  ofNumber: string;
  status: VentiladorStatus;
  voltaObra: boolean;
  createdAt: string;
}

export interface VentiladorPending {
  id: string;
  code: string;
  description: string;
  tipo: VentiladorTipo;
  cliente: string;
  ofNumber: string;
  prazoEntrega: string;
  priority: number;
  quantidade: number;
  createdAt: string;
}

export interface VentiladorMovement {
  id: string;
  ventiladorId: string | null;
  code: string;
  description: string;
  tipo: VentiladorTipo;
  type: 'entrada' | 'saida';
  cliente: string;
  ofNumber: string;
  observacao: string;
  date: string;
  createdAt: string;
}

const mapStock = (r: any): VentiladorStock => ({
  id: r.id,
  code: r.code,
  description: r.description,
  tipo: r.tipo as VentiladorTipo,
  cliente: r.cliente || '',
  ofNumber: r.of_number || '',
  status: (r.status as VentiladorStatus) || 'disponivel',
  voltaObra: Boolean(r.volta_obra),
  createdAt: r.created_at,
});

const mapPending = (r: any): VentiladorPending => ({
  id: r.id,
  code: r.code,
  description: r.description,
  tipo: r.tipo as VentiladorTipo,
  cliente: r.cliente || '',
  ofNumber: r.of_number || '',
  prazoEntrega: r.prazo_entrega || '',
  priority: Number(r.priority) || 0,
  quantidade: Number(r.quantidade) || 1,
  createdAt: r.created_at,
});

const mapMov = (r: any): VentiladorMovement => ({
  id: r.id,
  ventiladorId: r.ventilador_id,
  code: r.code,
  description: r.description,
  tipo: r.tipo as VentiladorTipo,
  type: r.type as 'entrada' | 'saida',
  cliente: r.cliente || '',
  ofNumber: r.of_number || '',
  observacao: r.observacao || '',
  date: r.date,
  createdAt: r.created_at,
});

export async function getVentStock(): Promise<VentiladorStock[]> {
  const { data, error } = await supabase.from('ventiladores_stock').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapStock);
}

export async function addVentStock(input: Omit<VentiladorStock, 'id' | 'createdAt'>): Promise<VentiladorStock> {
  const { data, error } = await supabase.from('ventiladores_stock').insert({
    code: input.code,
    description: input.description,
    tipo: input.tipo,
    cliente: input.cliente,
    of_number: input.ofNumber,
    status: input.status,
    volta_obra: input.voltaObra,
  }).select().single();
  if (error) throw error;
  return mapStock(data);
}

export async function updateVentStock(id: string, updates: Partial<Omit<VentiladorStock, 'id' | 'createdAt'>>) {
  const db: Record<string, any> = {};
  if (updates.code !== undefined) db.code = updates.code;
  if (updates.description !== undefined) db.description = updates.description;
  if (updates.tipo !== undefined) db.tipo = updates.tipo;
  if (updates.cliente !== undefined) db.cliente = updates.cliente;
  if (updates.ofNumber !== undefined) db.of_number = updates.ofNumber;
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.voltaObra !== undefined) db.volta_obra = updates.voltaObra;
  const { data, error } = await supabase.from('ventiladores_stock').update(db).eq('id', id).select().single();
  if (error) throw error;
  return mapStock(data);
}

export async function deleteVentStock(id: string) {
  const { error } = await supabase.from('ventiladores_stock').delete().eq('id', id);
  if (error) throw error;
}

export async function getVentPending(): Promise<VentiladorPending[]> {
  const { data, error } = await supabase.from('ventiladores_pending').select('*').order('priority', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapPending);
}

export async function addVentPending(input: Omit<VentiladorPending, 'id' | 'createdAt'>): Promise<VentiladorPending> {
  const { data, error } = await supabase.from('ventiladores_pending').insert({
    code: input.code,
    description: input.description,
    tipo: input.tipo,
    cliente: input.cliente,
    of_number: input.ofNumber,
    prazo_entrega: input.prazoEntrega,
    priority: input.priority,
  }).select().single();
  if (error) throw error;
  return mapPending(data);
}

export async function updateVentPending(id: string, updates: Partial<Omit<VentiladorPending, 'id' | 'createdAt'>>) {
  const db: Record<string, any> = {};
  if (updates.code !== undefined) db.code = updates.code;
  if (updates.description !== undefined) db.description = updates.description;
  if (updates.tipo !== undefined) db.tipo = updates.tipo;
  if (updates.cliente !== undefined) db.cliente = updates.cliente;
  if (updates.ofNumber !== undefined) db.of_number = updates.ofNumber;
  if (updates.prazoEntrega !== undefined) db.prazo_entrega = updates.prazoEntrega;
  if (updates.priority !== undefined) db.priority = updates.priority;
  const { data, error } = await supabase.from('ventiladores_pending').update(db).eq('id', id).select().single();
  if (error) throw error;
  return mapPending(data);
}

export async function deleteVentPending(id: string) {
  const { error } = await supabase.from('ventiladores_pending').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderVentPending(items: { id: string; priority: number }[]) {
  await Promise.all(items.map(it =>
    supabase.from('ventiladores_pending').update({ priority: it.priority }).eq('id', it.id)
  ));
}

export async function getVentMovements(): Promise<VentiladorMovement[]> {
  const { data, error } = await supabase.from('ventiladores_movements').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapMov);
}

export async function addVentMovement(input: Omit<VentiladorMovement, 'id' | 'createdAt'>): Promise<VentiladorMovement> {
  const { data, error } = await supabase.from('ventiladores_movements').insert({
    ventilador_id: input.ventiladorId,
    code: input.code,
    description: input.description,
    tipo: input.tipo,
    type: input.type,
    cliente: input.cliente,
    of_number: input.ofNumber,
    observacao: input.observacao,
    date: input.date,
  }).select().single();
  if (error) throw error;
  return mapMov(data);
}

// Data local YYYY-MM-DD sem shift de fuso
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
