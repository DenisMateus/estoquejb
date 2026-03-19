
-- Table for motorredutores (MTD) inventory
CREATE TABLE public.mtd_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  description text NOT NULL,
  mtd_type text NOT NULL, -- REDLER, ELEVADOR, THV, CT, MPL
  quantity integer NOT NULL DEFAULT 0,
  portaria text DEFAULT '',
  nota_fiscal text DEFAULT '',
  of_number text DEFAULT '',
  cliente text DEFAULT '',
  condicao text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(code)
);

ALTER TABLE public.mtd_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read mtd_products" ON public.mtd_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert mtd_products" ON public.mtd_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update mtd_products" ON public.mtd_products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete mtd_products" ON public.mtd_products FOR DELETE USING (true);

-- Table for MTD movements (saída para cliente)
CREATE TABLE public.mtd_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtd_product_id uuid NOT NULL REFERENCES public.mtd_products(id) ON DELETE CASCADE,
  mtd_product_code text NOT NULL,
  mtd_product_description text NOT NULL,
  type text NOT NULL DEFAULT 'saida', -- entrada or saida
  quantity integer NOT NULL DEFAULT 1,
  cliente_destino text NOT NULL DEFAULT '',
  date text NOT NULL,
  observacao text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mtd_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read mtd_movements" ON public.mtd_movements FOR SELECT USING (true);
CREATE POLICY "Allow public insert mtd_movements" ON public.mtd_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete mtd_movements" ON public.mtd_movements FOR DELETE USING (true);
