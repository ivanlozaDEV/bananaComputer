-- Migration: Expand product architecture for multi-category and multi-image support
-- Date: 2026-04-08

-- 1. Create join table for multi-category support (Many-to-Many)
CREATE TABLE IF NOT EXISTS product_subcategories (
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    subcategory_id uuid REFERENCES subcategories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, subcategory_id)
);

-- 2. Add multiple images support to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 3. Add image support to subcategories
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS image_url text;

-- 4. Sync initial data from legacy column
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='subcategory_id') THEN
        INSERT INTO product_subcategories (product_id, subcategory_id)
        SELECT id, subcategory_id FROM products WHERE subcategory_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
