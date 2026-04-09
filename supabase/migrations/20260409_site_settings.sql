-- Create a table for global site settings
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Ollama host if it doesn't exist
INSERT INTO site_settings (key, value)
VALUES ('ollama_host', 'http://localhost:11434')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so the assistant can pick it up)
CREATE POLICY "Allow public read for site_settings"
  ON site_settings FOR SELECT
  USING (true);

-- Allow admin write access (using service role or if we have an admin role check)
-- For now, let's allow all authenticated users to update if they are in the admin dashboard context
-- (In a real app, we'd check for an 'admin' role)
CREATE POLICY "Allow authenticated to update site_settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (true);
