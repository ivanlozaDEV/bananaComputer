-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Granular Address Refactor (Libreta de Direcciones)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Update customer_addresses table
alter table public.customer_addresses 
  add column if not exists street_main text,
  add column if not exists street_secondary text,
  add column if not exists house_number text,
  add column if not exists province text,
  add column if not exists canton text,
  add column if not exists zip_code text,
  alter column address_line1 drop not null,
  alter column city drop not null;

-- NOTE: We keep address_line1 and city for backward compatibility or migration,
-- but the new fields will be the primary ones.


