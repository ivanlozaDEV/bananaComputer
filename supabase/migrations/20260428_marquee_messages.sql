-- Migration to create marquee_messages table
-- Created: 2026-04-28

CREATE TABLE IF NOT EXISTS marquee_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE marquee_messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to read active messages
CREATE POLICY "Public read active marquee messages"
ON marquee_messages FOR SELECT
USING (is_active = true);

-- Allow authenticated admins to do everything
CREATE POLICY "Admins full access to marquee messages"
ON marquee_messages FOR ALL
USING (auth.role() = 'authenticated');

-- Initial Data
INSERT INTO marquee_messages (text, display_order) VALUES
('⚡ OFERTAS EXCLUSIVAS SEMANALES', 1),
('🎮 HARDWARE GLOBAL CON GARANTÍA LOCAL', 2),
('🍌 BANANA COMPUTER - PEELING INTO THE FUTURE', 3),
('🚀 ENTREGAS EXPRESS A NIVEL NACIONAL', 4)
ON CONFLICT DO NOTHING;
