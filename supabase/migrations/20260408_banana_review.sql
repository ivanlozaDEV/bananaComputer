-- Add banana_review column to products to store AI-generated assessments
ALTER TABLE products ADD COLUMN IF NOT EXISTS banana_review jsonb;
