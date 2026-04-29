-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Upgrade Cotizador v2.1
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Añadir el tipo de cotización para permitir el modo "Opciones"
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS quote_type text DEFAULT 'standard';

-- Comentario para documentar la estructura de ítems esperada en JSONB:
-- [
--   {
--     "id": "uuid",
--     "name": "string",
--     "sku": "string",
--     "price": number,
--     "quantity": number,
--     "warranty": "string",
--     "gifts": "string",
--     "pills": [
--        { "label": "RAM", "value": "16GB", "icon": "🧠" },
--        { "label": "SSD", "value": "512GB", "icon": "💾" }
--     ]
--   }
-- ]
