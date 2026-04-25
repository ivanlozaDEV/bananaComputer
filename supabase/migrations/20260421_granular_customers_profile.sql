-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Granular Profile Refactor (Datos de Perfil)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Update customers table (Main Profile)
alter table public.customers
  add column if not exists street_main text,
  add column if not exists street_secondary text,
  add column if not exists house_number text,
  add column if not exists province text,
  add column if not exists canton text,
  add column if not exists zip_code text,
  add column if not exists id_type integer default 1,
  add column if not exists id_number text,
  alter column address_line1 drop not null,
  alter column city drop not null;

-- NOTE: We keep address_line1 and city for backward compatibility or migration,
-- but the new fields will be the primary ones.
