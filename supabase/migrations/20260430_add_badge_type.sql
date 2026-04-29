-- Add badge_type column to products table
-- Possible values: 'new' | 'featured' | 'sale' | 'unavailable'
-- null = defaults to 'new' in the frontend

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS badge_type TEXT DEFAULT 'new'
    CHECK (badge_type IN ('new', 'featured', 'sale', 'unavailable'));

-- Migrate existing data:
-- Products already marked as is_featured → badge_type = 'featured'
UPDATE products
  SET badge_type = 'featured'
  WHERE is_featured = true AND badge_type = 'new';

-- Products with stock = 0 → badge_type = 'unavailable'
UPDATE products
  SET badge_type = 'unavailable'
  WHERE stock = 0 AND badge_type = 'new';

COMMENT ON COLUMN products.badge_type IS
  'Display label for the product card: new | featured | sale | unavailable. Products with badge_type=unavailable are hidden from the public catalog.';
