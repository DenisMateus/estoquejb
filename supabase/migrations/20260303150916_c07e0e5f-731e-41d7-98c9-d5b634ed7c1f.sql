
-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'barra')),
  category TEXT NOT NULL CHECK (category IN ('ferro_redondo', 'tubo_aco')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movements table
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'barra')),
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Public access policies (shared system, no auth required)
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read movements" ON public.movements FOR SELECT USING (true);
CREATE POLICY "Allow public insert movements" ON public.movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete movements" ON public.movements FOR DELETE USING (true);
