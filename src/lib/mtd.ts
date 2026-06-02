import { supabase } from '@/integrations/supabase/client';

export type MtdType = 'REDLER' | 'ELEVADOR' | 'THV' | 'CT' | 'MPL' | 'CAVACO' | 'TRIPPER' | 'TH' | 'VALVULA_ROTATIVA' | 'TORRADOR' | 'ESPALHADOR' | 'REGISTRO_MOTORIZADO';

export const MTD_TYPE_LABELS: Record<MtdType, string> = {
  CAVACO: 'Cavaco',
  CT: 'CT',
  ELEVADOR: 'Elevador',
  ESPALHADOR: 'Espalhador',
  MPL: 'MPL',
  REDLER: 'Redler',
  REGISTRO_MOTORIZADO: 'Registro Motorizado',
  TH: 'TH',
  THV: 'THV',
  TORRADOR: 'Torrador',
  TRIPPER: 'Tripper',
  VALVULA_ROTATIVA: 'Válvula Rotativa',
};

export interface MtdProduct {
  id: string;
  code: string;
  description: string;
  mtdType: MtdType;
  quantity: number;
  portaria: string;
  notaFiscal: string;
  ofNumber: string;
  cliente: string;
  condicao: string;
  createdAt: string;
}

export interface MtdMovement {
  id: string;
  mtdProductId: string;
  mtdProductCode: string;
  mtdProductDescription: string;
  type: 'entrada' | 'saida';
  quantity: number;
  clienteDestino: string;
  notaFiscal: string;
  date: string;
  observacao: string;
  createdAt: string;
}

export const CONDICAO_OPTIONS = [
  'Novo',
  'Usado',
  'Recondicionado',
  'Revisado',
  'Danificado',
] as const;

function mapMtdProduct(row: any): MtdProduct {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    mtdType: row.mtd_type as MtdType,
    quantity: Number(row.quantity),
    portaria: row.portaria || '',
    notaFiscal: row.nota_fiscal || '',
    ofNumber: row.of_number || '',
    cliente: row.cliente || '',
    condicao: row.condicao || '',
    createdAt: row.created_at,
  };
}

function mapMtdMovement(row: any): MtdMovement {
  return {
    id: row.id,
    mtdProductId: row.mtd_product_id,
    mtdProductCode: row.mtd_product_code,
    mtdProductDescription: row.mtd_product_description,
    type: row.type as 'entrada' | 'saida',
    quantity: Number(row.quantity),
    clienteDestino: row.cliente_destino || '',
    notaFiscal: row.nota_fiscal || '',
    date: row.date,
    observacao: row.observacao || '',
    createdAt: row.created_at,
  };
}

export async function getMtdProducts(): Promise<MtdProduct[]> {
  const { data, error } = await supabase.from('mtd_products').select('*').order('code');
  if (error) throw error;
  return (data || []).map(mapMtdProduct);
}

export async function addMtdProduct(product: Omit<MtdProduct, 'id' | 'createdAt' | 'quantity'> & { quantity?: number }): Promise<MtdProduct> {
  const { data, error } = await supabase.from('mtd_products').insert({
    code: product.code,
    description: product.description,
    mtd_type: product.mtdType,
    quantity: product.quantity ?? 1,
    portaria: product.portaria,
    nota_fiscal: product.notaFiscal,
    of_number: product.ofNumber,
    cliente: product.cliente,
    condicao: product.condicao,
  }).select().single();
  if (error) throw error;
  return mapMtdProduct(data);
}

export async function updateMtdProduct(id: string, updates: Partial<Omit<MtdProduct, 'id' | 'createdAt' | 'quantity'>>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.mtdType !== undefined) dbUpdates.mtd_type = updates.mtdType;
  if (updates.portaria !== undefined) dbUpdates.portaria = updates.portaria;
  if (updates.notaFiscal !== undefined) dbUpdates.nota_fiscal = updates.notaFiscal;
  if (updates.ofNumber !== undefined) dbUpdates.of_number = updates.ofNumber;
  if (updates.cliente !== undefined) dbUpdates.cliente = updates.cliente;
  if (updates.condicao !== undefined) dbUpdates.condicao = updates.condicao;
  const { data, error } = await supabase.from('mtd_products').update(dbUpdates).eq('id', id).select().single();
  if (error) throw error;
  return mapMtdProduct(data);
}

export async function deleteMtdProduct(id: string) {
  const { error } = await supabase.from('mtd_products').delete().eq('id', id);
  if (error) throw error;
}

export async function getMtdMovements(): Promise<MtdMovement[]> {
  const { data, error } = await supabase.from('mtd_movements').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapMtdMovement);
}

export async function addMtdMovement(mov: Omit<MtdMovement, 'id' | 'createdAt'>, skipQtyUpdate = false): Promise<MtdMovement> {
  if (!skipQtyUpdate) {
    const { data: product, error: pErr } = await supabase.from('mtd_products').select('*').eq('id', mov.mtdProductId).single();
    if (pErr || !product) throw new Error('Motorredutor não encontrado');

    const currentQty = Number(product.quantity);
    if (mov.type === 'saida' && currentQty < mov.quantity) {
      throw new Error('Estoque insuficiente');
    }

    const newQty = mov.type === 'entrada' ? currentQty + mov.quantity : currentQty - mov.quantity;

    const { error: uErr } = await supabase.from('mtd_products').update({ quantity: newQty }).eq('id', mov.mtdProductId);
    if (uErr) throw uErr;
  }

  const { data, error } = await supabase.from('mtd_movements').insert({
    mtd_product_id: mov.mtdProductId,
    mtd_product_code: mov.mtdProductCode,
    mtd_product_description: mov.mtdProductDescription,
    type: mov.type,
    quantity: mov.quantity,
    cliente_destino: mov.clienteDestino,
    nota_fiscal: mov.notaFiscal,
    date: mov.date,
    observacao: mov.observacao,
  }).select().single();
  if (error) throw error;
  return mapMtdMovement(data);
}
