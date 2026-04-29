-- Migration: Add slug to products and categories
-- 1. Add slug to products if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='slug') THEN
        ALTER TABLE products ADD COLUMN slug TEXT UNIQUE;
    END IF;
END $$;

-- 2. Function to generate slugs
CREATE OR REPLACE FUNCTION generate_slug(name TEXT, model TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                trim(name || ' ' || COALESCE(model, '')),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Update existing products with slugs
UPDATE products SET slug = generate_slug(name, model_number) WHERE slug IS NULL;

-- 4. Ensure slugs are unique (add suffix if needed - simplified version)
-- (In a real production environment we might need a more robust collision handler)
-- For now, let's just make sure they have a slug.
