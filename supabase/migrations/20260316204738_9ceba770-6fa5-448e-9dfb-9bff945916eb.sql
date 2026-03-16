
-- Add sector column to products table to distinguish between Usinagem and Guilhotina
ALTER TABLE public.products ADD COLUMN sector text NOT NULL DEFAULT 'usinagem';

-- Create index for sector filtering
CREATE INDEX idx_products_sector ON public.products (sector);
