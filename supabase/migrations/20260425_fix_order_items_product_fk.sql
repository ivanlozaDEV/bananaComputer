-- ─────────────────────────────────────────────────────────────────
-- Fix order_items.product_id FK → ON DELETE SET NULL
--
-- Problema: La FK original no tiene cláusula CASCADE/SET NULL, lo que
-- hace que Supabase devuelva 409 Conflict al intentar eliminar un
-- producto que ya tiene ítems de orden referenciándolo.
--
-- Solución: Cambiar la FK a ON DELETE SET NULL para que, si se borra
-- un producto físicamente, el product_id en order_items quede en NULL
-- (preservando el historial de órdenes).
--
-- Nota: En el dashboard usamos soft-delete (is_active = false) para
-- conservar la referencia intacta, pero este fix protege contra
-- eliminaciones directas desde la BD o la API.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES products(id)
  ON DELETE SET NULL;
