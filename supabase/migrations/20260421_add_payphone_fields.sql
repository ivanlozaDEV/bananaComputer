-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Add PayPhone Transaction Fields to Orders
-- ═══════════════════════════════════════════════════════════════════════

alter table public.orders 
  add column if not exists payphone_transaction_id text,
  add column if not exists authorization_code text;

-- Optional: add comments for clarity
comment on column public.orders.payphone_transaction_id is 'Transaction ID returned by PayPhone (integer or string)';
comment on column public.orders.authorization_code is 'Authorization code returned by PayPhone upon successful payment';
