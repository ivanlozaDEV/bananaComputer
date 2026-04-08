-- Migration: Add model_number column to products
-- Date: 2026-04-08

ALTER TABLE products ADD COLUMN IF NOT EXISTS model_number text;

-- Optional: Copy SKU to model_number if SKU looks like a model (heuristic)
-- For now, we will leave it empty so the admin can fill it correctly.
