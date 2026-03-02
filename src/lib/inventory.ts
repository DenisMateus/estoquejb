export type UnitType = 'kg' | 'barra';
export type MovementType = 'entrada' | 'saida';

export interface Product {
  id: string;
  code: string;
  description: string;
  unit: UnitType;
  category: 'ferro_redondo' | 'tubo_aco';
  quantity: number;
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

const PRODUCTS_KEY = 'jhonrob_products';
const MOVEMENTS_KEY = 'jhonrob_movements';
const AUTH_KEY = 'jhonrob_auth';

export function getProducts(): Product[] {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'quantity'>): Product {
  const products = getProducts();
  const exists = products.find(p => p.code === product.code);
  if (exists) throw new Error('Código já cadastrado');
  
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    quantity: 0,
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Pick<Product, 'description' | 'unit' | 'category'>>) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Produto não encontrado');
  products[idx] = { ...products[idx], ...updates };
  saveProducts(products);
  return products[idx];
}

export function deleteProduct(id: string) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}

export function getMovements(): Movement[] {
  const data = localStorage.getItem(MOVEMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveMovements(movements: Movement[]) {
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

export function addMovement(mov: Omit<Movement, 'id' | 'createdAt'>): Movement {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === mov.productId);
  if (idx === -1) throw new Error('Produto não encontrado');

  if (mov.type === 'saida' && products[idx].quantity < mov.quantity) {
    throw new Error('Estoque insuficiente');
  }

  if (mov.type === 'entrada') {
    products[idx].quantity += mov.quantity;
  } else {
    products[idx].quantity -= mov.quantity;
  }
  saveProducts(products);

  const newMov: Movement = {
    ...mov,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const movements = getMovements();
  movements.unshift(newMov);
  saveMovements(movements);
  return newMov;
}

export function login(user: string, pass: string): boolean {
  if (user === 'PCP4' && pass === 'Jhorob@1') {
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
