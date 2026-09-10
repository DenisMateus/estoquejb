-- 1. Lock down all tables to authenticated users only
DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','movements','mtd_products','mtd_movements','ventiladores_stock','ventiladores_pending','ventiladores_movements']
  LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Authenticated can select %1$s" ON public.%1$I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "Authenticated can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "Authenticated can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "Authenticated can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)', t);
  END LOOP;
END $$;

-- 2. Atomic stock movement to prevent race conditions
CREATE OR REPLACE FUNCTION public.add_movement(
  p_product_id uuid,
  p_type text,
  p_quantity numeric,
  p_date text,
  p_origem text DEFAULT 'manual'
)
RETURNS public.movements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_product public.products;
  v_movement public.movements;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF p_type NOT IN ('entrada','saida') THEN
    RAISE EXCEPTION 'INVALID_TYPE';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  UPDATE public.products
     SET quantity = CASE WHEN p_type = 'entrada' THEN quantity + p_quantity ELSE quantity - p_quantity END
   WHERE id = p_product_id
     AND (p_type = 'entrada' OR quantity >= p_quantity)
  RETURNING * INTO v_product;

  IF v_product.id IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK';
    ELSE
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
    END IF;
  END IF;

  INSERT INTO public.movements (
    product_id, product_code, product_description, type, quantity, unit, date, origem
  ) VALUES (
    v_product.id, v_product.code, v_product.description, p_type, p_quantity, v_product.unit, p_date, COALESCE(p_origem,'manual')
  ) RETURNING * INTO v_movement;

  RETURN v_movement;
END $$;

REVOKE ALL ON FUNCTION public.add_movement(uuid, text, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_movement(uuid, text, numeric, text, text) TO authenticated;