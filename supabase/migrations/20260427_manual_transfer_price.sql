-- Add transfer_price column to products table
ALTER TABLE public.products ADD COLUMN transfer_price NUMERIC(10,2);

-- Backfill existing products with the calculated 1.06 ratio price
UPDATE public.products 
SET transfer_price = ROUND(price / 1.06, 2) 
WHERE price IS NOT NULL AND transfer_price IS NULL;
