import { supabase } from '@/integrations/supabase/client';

// Formata números decimais - mostra apenas parte inteira (80.5468 -> 80)
export function formatQuantity(value: number): string {
  if (!value || value === 0) return '0';
  // Retorna apenas a parte inteira (antes da vírgula)
  return Math.floor(value).toString();
}

export type UnitType = 'kg' | 'barra';
export type MovementType = 'entrada' | 'saida';

export type SectorType = 'usinagem' | 'guilhotina';
export type CategoryType = 'ferro_redondo' | 'tubo_aco' | 'cantoneira' | 'ferro_chato';

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  ferro_redondo: 'Ferro Redondo',
  tubo_aco: 'Tubo de Aço',
  cantoneira: 'Cantoneira',
  ferro_chato: 'Ferro Chato',
};

export interface Product {
  id: string;
  code: string;
  description: string;
  unit: UnitType;
  category: 'ferro_redondo' | 'tubo_aco' | 'cantoneira' | 'ferro_chato';
  quantity: number;
  weightPerUnit: number;
  sector: SectorType;
  createdAt: string;
}

export type OrigemType = 'manual' | 'inventario';

export interface Movement {
  id: string;
  productId: string;
  productCode: string;
  productDescription: string;
  type: MovementType;
  quantity: number;
  unit: UnitType;
  date: string;
  createdAt: string;
  origem: OrigemType;
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    unit: row.unit as UnitType,
    category: row.category as Product['category'],
    quantity: Number(row.quantity),
    weightPerUnit: Number(row.weight_per_unit || 0),
    sector: (row.sector || 'usinagem') as SectorType,
    createdAt: row.created_at,
  };
}

function mapMovement(row: any): Movement {
  return {
    id: row.id,
    productId: row.product_id,
    productCode: row.product_code,
    productDescription: row.product_description,
    type: row.type as MovementType,
    quantity: Number(row.quantity),
    unit: row.unit as UnitType,
    date: row.date,
    createdAt: row.created_at,
    origem: (row.origem || 'manual') as OrigemType,
  };
}

export async function getProducts(sector?: SectorType): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('code');
  if (sector) query = query.eq('sector', sector);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'quantity'>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert({
    code: product.code,
    description: product.description,
    unit: product.unit,
    category: product.category,
    quantity: 0,
    weight_per_unit: product.weightPerUnit,
    sector: product.sector || 'usinagem',
  }).select().single();
  if (error) {
    if (error.code === '23505') throw new Error('Código já cadastrado');
    throw error;
  }
  return mapProduct(data);
}

export async function updateProduct(id: string, updates: Partial<Pick<Product, 'code' | 'description' | 'unit' | 'category' | 'weightPerUnit'>>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.weightPerUnit !== undefined) dbUpdates.weight_per_unit = updates.weightPerUnit;
  const { data, error } = await supabase.from('products').update(dbUpdates).eq('id', id).select().single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function getMovements(): Promise<Movement[]> {
  const { data, error } = await supabase.from('movements').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapMovement);
}

export async function addMovement(mov: Omit<Movement, 'id' | 'createdAt' | 'origem'> & { origem?: OrigemType }): Promise<Movement> {
  // Get current product
  const { data: product, error: pErr } = await supabase.from('products').select('*').eq('id', mov.productId).single();
  if (pErr || !product) throw new Error('Produto não encontrado');

  const currentQty = Number(product.quantity);
  if (mov.type === 'saida' && currentQty < mov.quantity) {
    throw new Error('Estoque insuficiente');
  }

  const newQty = mov.type === 'entrada' ? currentQty + mov.quantity : currentQty - mov.quantity;

  // Update product quantity
  const { error: uErr } = await supabase.from('products').update({ quantity: newQty }).eq('id', mov.productId);
  if (uErr) throw uErr;

  // Insert movement
  const { data, error } = await supabase.from('movements').insert({
    product_id: mov.productId,
    product_code: mov.productCode,
    product_description: mov.productDescription,
    type: mov.type,
    quantity: mov.quantity,
    unit: mov.unit,
    date: mov.date,
    origem: mov.origem || 'manual',
  } as any).select().single();
  if (error) throw error;
  return mapMovement(data);
}

export async function applyInventoryCount(
  items: Array<{ product: Product; countedQty: number }>,
  date: string,
): Promise<number> {
  let count = 0;
  for (const { product, countedQty } of items) {
    const diff = countedQty - product.quantity;
    if (diff === 0) continue;
    const type: MovementType = diff > 0 ? 'entrada' : 'saida';
    await addMovement({
      productId: product.id,
      productCode: product.code,
      productDescription: product.description,
      type,
      quantity: Math.abs(diff),
      unit: product.unit,
      date,
      origem: 'inventario',
    });
    count++;
  }
  return count;
}

// Auth kept as localStorage (simple shared login)
const AUTH_KEY = 'jhonrob_auth';

export function login(user: string, pass: string): boolean {
  if (user === 'planejamentopcp' && pass === '123456') {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
