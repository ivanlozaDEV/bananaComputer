-- Migración para añadir soporte a múltiples métodos de pago y descuentos
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'payphone',
ADD COLUMN IF NOT EXISTS base_total numeric(10,2),
ADD COLUMN IF NOT EXISTS final_total numeric(10,2),
ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0;

-- Actualizar órdenes existentes para que tengan coherencia
UPDATE orders SET 
  base_total = total,
  final_total = total,
  discount_amount = 0
WHERE base_total IS NULL;
