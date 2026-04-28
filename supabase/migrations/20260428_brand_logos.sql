-- Migration: Add brand_logos table and storage bucket reference
-- Description: Creates the brand_logos table for floating brand logos on the home page and sets up RLS.

-- 1. Create the brand_logos table
CREATE TABLE IF NOT EXISTS brand_logos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE brand_logos ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to view brand logos (for the home page)
DROP POLICY IF EXISTS "Public read access" ON brand_logos;
CREATE POLICY "Public read access" 
ON brand_logos FOR SELECT 
USING (true);

-- Allow authenticated admins to manage brand logos
DROP POLICY IF EXISTS "Admin full access" ON brand_logos;
CREATE POLICY "Admin full access" 
ON brand_logos FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Storage Setup (Documentation)
-- Note: As requested, we are using the existing 'product-images' bucket for brand logos and hero images.
-- Ensure the 'product-images' bucket is set to 'Public' in the Supabase Dashboard.

/* 
-- Optional: Storage policies for the product-images bucket if not already set
-- These are usually already configured for products, but here they are for reference:
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
*/
