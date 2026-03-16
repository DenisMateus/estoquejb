
-- Add weight_per_unit column to products (weight in kg per unit/bar)
ALTER TABLE public.products ADD COLUMN weight_per_unit numeric NOT NULL DEFAULT 0;
