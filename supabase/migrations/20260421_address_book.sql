-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Address Book & Guest Checkout Migration
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Create customer_addresses table
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Mi Dirección', -- ej: Casa, Oficina, Facturación
  full_name text not null,
  email text,
  phone text not null,
  id_type integer not null default 1, -- 1: Cédula, 2: RUC, 3: Pasaporte
  id_number text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  zip_code text,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

-- 2. Update orders table to support guest checkout and billing data
alter table public.orders 
  alter column customer_id drop not null,
  add column if not exists billing_address jsonb,
  add column if not exists client_transaction_id text; -- Store PayPhone's ID for tracking

-- 3. Enable RLS for customer_addresses
alter table public.customer_addresses enable row level security;

-- 4. Policies for customer_addresses
create policy "Users can manage their own addresses"
  on public.customer_addresses
  for all
  using (auth.uid() = customer_id);

-- 5. Helper function to ensure only one default per customer
create or replace function public.set_default_address()
returns trigger as $$
begin
  if new.is_default then
    update public.customer_addresses
    set is_default = false
    where customer_id = new.customer_id and id != new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger ensure_single_default_address
  before insert or update on public.customer_addresses
  for each row execute function public.set_default_address();
