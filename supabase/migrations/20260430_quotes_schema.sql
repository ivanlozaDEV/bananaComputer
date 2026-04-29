-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Sistema de Cotizaciones v2
-- ═══════════════════════════════════════════════════════════════════════

-- 0. Habilitar Trigram para búsqueda difusa (Fuzzy Search)
create extension if not exists pg_trgm;

-- Función para búsqueda difusa de productos
create or replace function public.search_products_fuzzy(search_text text)
returns setof public.products
language sql
security definer
as $$
  select *
  from public.products
  where 
    (name % search_text OR sku % search_text OR model_number % search_text OR tagline % search_text)
    and is_active = true
  order by similarity(name, search_text) desc
  limit 10;
$$;

-- 1. Tabla de Prospectos (Clientes que no necesariamente tienen cuenta)
create table if not exists public.quotation_customers (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text,
  phone         text,
  id_number     text, -- Cédula o RUC
  id_type       integer default 1, -- 1: Cédula, 2: RUC, 3: Pasaporte
  company       text,
  address_data  jsonb default '{
    "street_main": "",
    "street_secondary": "",
    "house_number": "",
    "city": "",
    "province": "",
    "canton": "",
    "zip_code": ""
  }'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. Tabla de Cotizaciones
create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  
  -- Relaciones opcionales (un quote puede venir de un usuario registrado o un prospecto)
  customer_id   uuid references public.customers(id) on delete set null,
  prospect_id   uuid references public.quotation_customers(id) on delete set null,
  
  -- Snapshot CRÍTICO: Los datos en el momento de emitir la cotización
  customer_data jsonb not null,
  
  -- Snapshot de ítems
  items         jsonb not null default '[]'::jsonb,

  -- Totales
  totals        jsonb not null default '{
    "subtotal": 0,
    "tax": 0,
    "discount": 0,
    "total": 0
  }'::jsonb,

  status        text not null default 'sent', -- 'draft', 'sent', 'paid', 'expired'
  expires_at    timestamptz not null default (now() + interval '7 days'),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS
alter table public.quotation_customers enable row level security;
alter table public.quotes              enable row level security;

-- Admins: control total
create policy "Admins manage prospectos" on public.quotation_customers for all using ( (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'superadmin') );
create policy "Admins manage quotes"     on public.quotes              for all using ( (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'superadmin') );

-- Público: leer cotización activa
create policy "Public read active quotes" on public.quotes for select using ( status != 'expired' AND (expires_at > now() OR status = 'paid') );

-- Triggers para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_prospect_updated before update on public.quotation_customers for each row execute procedure handle_updated_at();
create trigger on_quote_updated    before update on public.quotes              for each row execute procedure handle_updated_at();
