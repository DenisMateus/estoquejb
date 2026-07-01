
CREATE TABLE public.ventiladores_stock (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null,
  tipo text not null default 'SILO',
  cliente text not null default '',
  of_number text not null default '',
  status text not null default 'disponivel',
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ventiladores_stock TO anon, authenticated;
GRANT ALL ON public.ventiladores_stock TO service_role;
ALTER TABLE public.ventiladores_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read stock" ON public.ventiladores_stock FOR SELECT USING (true);
CREATE POLICY "public insert stock" ON public.ventiladores_stock FOR INSERT WITH CHECK (true);
CREATE POLICY "public update stock" ON public.ventiladores_stock FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete stock" ON public.ventiladores_stock FOR DELETE USING (true);

CREATE TABLE public.ventiladores_pending (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null,
  tipo text not null default 'SILO',
  cliente text not null default '',
  of_number text not null default '',
  prazo_entrega text not null default '',
  priority integer not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ventiladores_pending TO anon, authenticated;
GRANT ALL ON public.ventiladores_pending TO service_role;
ALTER TABLE public.ventiladores_pending ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pending" ON public.ventiladores_pending FOR SELECT USING (true);
CREATE POLICY "public insert pending" ON public.ventiladores_pending FOR INSERT WITH CHECK (true);
CREATE POLICY "public update pending" ON public.ventiladores_pending FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete pending" ON public.ventiladores_pending FOR DELETE USING (true);

CREATE TABLE public.ventiladores_movements (
  id uuid primary key default gen_random_uuid(),
  ventilador_id uuid,
  code text not null,
  description text not null,
  tipo text not null default 'SILO',
  type text not null,
  cliente text not null default '',
  of_number text not null default '',
  observacao text not null default '',
  date text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ventiladores_movements TO anon, authenticated;
GRANT ALL ON public.ventiladores_movements TO service_role;
ALTER TABLE public.ventiladores_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read mov" ON public.ventiladores_movements FOR SELECT USING (true);
CREATE POLICY "public insert mov" ON public.ventiladores_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete mov" ON public.ventiladores_movements FOR DELETE USING (true);
