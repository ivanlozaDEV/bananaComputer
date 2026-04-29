-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Beneficios de Producto v1.0
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Añadir garantía y obsequios a la tabla de productos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty text DEFAULT '1 Año';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gifts text;

-- Comentario: Estos campos servirán para mostrar beneficios en las cards 
-- y como valores por defecto en las cotizaciones.
