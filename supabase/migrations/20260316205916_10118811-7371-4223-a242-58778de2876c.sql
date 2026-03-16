
ALTER TABLE public.products DROP CONSTRAINT products_category_check;
ALTER TABLE public.products ADD CONSTRAINT products_category_check CHECK (category IN ('ferro_redondo', 'tubo_aco', 'cantoneira', 'ferro_chato'));
