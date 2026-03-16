import { supabase } from '@/integrations/supabase/client';

export type UnitType = 'kg' | 'barra';
export type MovementType = 'entrada' | 'saida';

export interface Product {
  id: string;
  code: string;
  description: string;
  unit: UnitType;
  category: 'ferro_redondo' | 'tubo_aco';
  quantity: number;
  weightPerUnit: number;
  createdAt: string;
}

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
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    unit: row.unit as UnitType,
    category: row.category as Product['category'],
    quantity: Number(row.quantity),
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
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('code');
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
  }).select().single();
  if (error) {
    if (error.code === '23505') throw new Error('Código já cadastrado');
    throw error;
  }
  return mapProduct(data);
}

export async function updateProduct(id: string, updates: Partial<Pick<Product, 'description' | 'unit' | 'category'>>) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
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

export async function addMovement(mov: Omit<Movement, 'id' | 'createdAt'>): Promise<Movement> {
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
  }).select().single();
  if (error) throw error;
  return mapMovement(data);
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
