-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Sistema de Numeración de Pedidos Profesional (BC-1000)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Crear secuencia para los números (empezando en 1000)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- 2. Agregar la columna 'order_number' a la tabla de pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- 3. Crear función para auto-generar e insertar el formato 'BC-XXXX'
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'BC-' || nextval('order_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Activar el disparador (trigger) automático
DROP TRIGGER IF EXISTS tr_assign_order_number ON public.orders;
CREATE TRIGGER tr_assign_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- 5. Actualizar los pedidos que ya existen con un número nuevo secuencial
UPDATE public.orders 
SET order_number = 'BC-' || nextval('order_number_seq')
WHERE order_number IS NULL;
