-- ═══════════════════════════════════════════════════════════════════════
-- BananaComputer — Master Migration (v1.0)
-- Complete database reset and recreation script.
-- Run entirely in: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- PART 1: DROP EVERYTHING (clean slate)
-- ─────────────────────────────────────────────────────────────────

drop table if exists order_items          cascade;
drop table if exists orders               cascade;
drop table if exists product_attributes   cascade;
drop table if exists product_images       cascade;
drop table if exists products             cascade;
drop table if exists attribute_definitions cascade;
drop table if exists subcategories        cascade;
drop table if exists categories           cascade;
drop table if exists customers            cascade;
drop table if exists hero_content         cascade;

drop function if exists handle_new_user() cascade;

-- ─────────────────────────────────────────────────────────────────
-- PART 2: TABLES
-- ─────────────────────────────────────────────────────────────────

-- 1. Hero content (editable landing page copy)
create table hero_content (
  id            uuid primary key default gen_random_uuid(),
  title         text not null default 'BANANA COMPUTER',
  subtitle      text not null default 'El futuro de la computación. Redefinido.',
  primary_cta   text not null default 'Explorar Sistemas',
  secondary_cta text not null default 'Más información',
  image_url     text,
  updated_at    timestamptz default now()
);

-- 2. Categories (e.g. Laptops, Monitors)
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  slug        text unique not null,
  description text,
  created_at  timestamptz default now()
);

-- 3. Subcategories — audience-based (e.g. Gaming Fuerte, Estudiantes)
create table subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name        text not null,
  slug        text not null,
  created_at  timestamptz default now(),
  unique (category_id, slug)
);

-- 4. Attribute definitions
--    subcategory_id = NULL  → applies to ALL products in the category
--    subcategory_id = <id>  → only shown when that subcategory is selected
create table attribute_definitions (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references categories(id) on delete cascade,
  subcategory_id uuid references subcategories(id) on delete cascade,
  name           text not null,
  unit           text,
  icon           text,           -- emoji or icon key, e.g. '💾'
  data_type      text not null default 'text',  -- 'number' | 'text' | 'boolean'
  display_order  integer not null default 0
);

-- 5. Products
create table products (
  id                 uuid primary key default gen_random_uuid(),
  sku                text unique not null,
  name               text not null,
  tagline            text,
  marketing_subtitle text,
  marketing_body     text,
  description        text,
  price              numeric(10,2) not null,
  stock              integer not null default 0,
  category_id        uuid references categories(id),
  subcategory_id     uuid references subcategories(id),
  image_url          text,
  datasheet          jsonb,           -- raw datasheet key/value pairs
  is_featured        boolean not null default false,
  is_active          boolean not null default true,
  created_at         timestamptz default now()
);

-- 6. Product image gallery
create table product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  image_url     text not null,
  alt_text      text,
  display_order integer not null default 0
);

-- 7. Product spec card values (links products to attribute_definitions)
create table product_attributes (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  attribute_id uuid not null references attribute_definitions(id) on delete cascade,
  value        text not null,
  unique (product_id, attribute_id)
);

-- 8. Customers (extends Supabase auth.users)
create table customers (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  address_line1 text,
  address_line2 text,
  city          text,
  country       text,
  zip_code      text,
  updated_at    timestamptz default now()
);

-- 9. Orders
create table orders (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid references customers(id),
  status           text not null default 'pending',
  total            numeric(10,2) not null,
  shipping_address jsonb,
  created_at       timestamptz default now()
);

-- 10. Order items
create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity   integer not null,
  unit_price numeric(10,2) not null
);

-- ─────────────────────────────────────────────────────────────────
-- PART 3: TRIGGERS
-- ─────────────────────────────────────────────────────────────────

-- Auto-create a customer row when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into customers (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- PART 4: ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────

alter table hero_content          enable row level security;
alter table categories            enable row level security;
alter table subcategories         enable row level security;
alter table attribute_definitions enable row level security;
alter table products              enable row level security;
alter table product_images        enable row level security;
alter table product_attributes    enable row level security;
alter table customers             enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;

-- Public reads (store catalog)
create policy "public read hero"                  on hero_content          for select using (true);
create policy "public read categories"            on categories            for select using (true);
create policy "public read subcategories"         on subcategories         for select using (true);
create policy "public read attribute_definitions" on attribute_definitions for select using (true);
create policy "public read products"              on products              for select using (is_active = true);
create policy "public read product_images"        on product_images        for select using (true);
create policy "public read product_attributes"    on product_attributes    for select using (true);

-- Admin full access (any authenticated user — your admin is the only user)
create policy "admin full access products"      on products              for all using (auth.uid() is not null);
create policy "admin full access attrs"         on attribute_definitions for all using (auth.uid() is not null);
create policy "admin full access prod_attrs"    on product_attributes    for all using (auth.uid() is not null);
create policy "admin full access prod_images"   on product_images        for all using (auth.uid() is not null);
create policy "admin full access categories"    on categories            for all using (auth.uid() is not null);
create policy "admin full access subcategories" on subcategories         for all using (auth.uid() is not null);
create policy "admin full access hero"          on hero_content          for all using (auth.uid() is not null);

-- Customers manage their own data
create policy "customers own data"        on customers    for all using (auth.uid() = id);
create policy "customers own orders"      on orders       for all using (auth.uid() = customer_id);
create policy "customers own order_items" on order_items  for select using (
  order_id in (select id from orders where customer_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────────
-- PART 5: STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update set public = true, file_size_limit = 10485760;

-- Drop old storage policies (safe re-run)
drop policy if exists "Public read product images"       on storage.objects;
drop policy if exists "Superadmin upload product images" on storage.objects;
drop policy if exists "Superadmin update product images" on storage.objects;
drop policy if exists "Superadmin delete product images" on storage.objects;
drop policy if exists "Auth upload product images"       on storage.objects;
drop policy if exists "Auth update product images"       on storage.objects;
drop policy if exists "Auth delete product images"       on storage.objects;

create policy "Public read product images"  on storage.objects for select using (bucket_id = 'product-images');
create policy "Auth upload product images"  on storage.objects for insert with check (bucket_id = 'product-images' and auth.uid() is not null);
create policy "Auth update product images"  on storage.objects for update using     (bucket_id = 'product-images' and auth.uid() is not null);
create policy "Auth delete product images"  on storage.objects for delete using     (bucket_id = 'product-images' and auth.uid() is not null);

-- ─────────────────────────────────────────────────────────────────
-- PART 6: SEED DATA — Hero content
-- ─────────────────────────────────────────────────────────────────

insert into hero_content (title, subtitle, primary_cta, secondary_cta)
values ('BANANA COMPUTER', 'El futuro de la computación. Redefinido.', 'Explorar Sistemas', 'Más información');

-- ─────────────────────────────────────────────────────────────────
-- PART 7: SEED DATA — Laptops (category, subcategories, attributes)
-- ─────────────────────────────────────────────────────────────────

do $$
declare
  cat_id       uuid;
  sub_gaming_h uuid;
  sub_diseno   uuid;
  sub_edicion  uuid;
begin

  -- Category
  insert into categories (name, slug, description)
  values ('Laptops', 'laptops', 'Computadoras portátiles para todo tipo de usuario')
  on conflict (slug) do update set description = excluded.description;

  select id into cat_id from categories where slug = 'laptops';

  -- Subcategories by audience
  insert into subcategories (category_id, name, slug) values
    (cat_id, 'Básicas',            'laptops-basicas'),
    (cat_id, 'Estudiantes',        'laptops-estudiantes'),
    (cat_id, 'Oficina y Negocios', 'laptops-oficina'),
    (cat_id, 'Ingeniería / CAD',   'laptops-ingenieria'),
    (cat_id, 'Diseño Gráfico',     'laptops-diseno'),
    (cat_id, 'Edición de Video',   'laptops-edicion'),
    (cat_id, 'Gaming Suave',       'laptops-gaming-suave'),
    (cat_id, 'Gaming Fuerte',      'laptops-gaming-fuerte')
  on conflict (category_id, slug) do nothing;

  select id into sub_gaming_h from subcategories where slug = 'laptops-gaming-fuerte';
  select id into sub_diseno   from subcategories where slug = 'laptops-diseno';
  select id into sub_edicion  from subcategories where slug = 'laptops-edicion';

  -- Base attributes: all laptops
  insert into attribute_definitions (category_id, subcategory_id, name, unit, icon, data_type, display_order) values
    (cat_id, null, 'RAM',            'GB',   '🧠', 'number', 1),
    (cat_id, null, 'Almacenamiento', 'GB',   '💾', 'number', 2),
    (cat_id, null, 'Procesador',     null,   '⚡', 'text',   3),
    (cat_id, null, 'Pantalla',       'pulg', '🖥️', 'number', 4),
    (cat_id, null, 'Batería',        'Wh',   '🔋', 'number', 5),
    (cat_id, null, 'Peso',           'kg',   '⚖️', 'number', 6),
    (cat_id, null, 'WiFi',           null,   '📶', 'text',   7),
    (cat_id, null, 'Cámara',         null,   '📷', 'text',   8);

  -- Extra: Gaming Fuerte
  insert into attribute_definitions (category_id, subcategory_id, name, unit, icon, data_type, display_order) values
    (cat_id, sub_gaming_h, 'GPU',           null, '🎮', 'text',   9),
    (cat_id, sub_gaming_h, 'VRAM',          'GB', '💾', 'number', 10),
    (cat_id, sub_gaming_h, 'Frecuencia Hz', 'Hz', '⚡', 'number', 11);

  -- Extra: Diseño Gráfico
  insert into attribute_definitions (category_id, subcategory_id, name, unit, icon, data_type, display_order) values
    (cat_id, sub_diseno, 'GPU',           null, '🎨', 'text', 9),
    (cat_id, sub_diseno, 'Gama de Color', null, '🌈', 'text', 10);

  -- Extra: Edición de Video
  insert into attribute_definitions (category_id, subcategory_id, name, unit, icon, data_type, display_order) values
    (cat_id, sub_edicion, 'GPU',  null, '🎬', 'text',   9),
    (cat_id, sub_edicion, 'VRAM', 'GB', '💾', 'number', 10);

end $$;

-- ─────────────────────────────────────────────────────────────────
-- PART 8: SEED DATA — ASUS Vivobook Go 15 OLED sample product
-- ─────────────────────────────────────────────────────────────────

do $$
declare
  cat_id      uuid;
  sub_id      uuid;
  prod_id     uuid;
  attr_ram    uuid;
  attr_ssd    uuid;
  attr_cpu    uuid;
  attr_screen uuid;
  attr_bat    uuid;
  attr_weight uuid;
  attr_cam    uuid;
  attr_wifi   uuid;
begin

  select id into cat_id from categories where slug = 'laptops';
  select id into sub_id from subcategories where slug = 'laptops-basicas' and category_id = cat_id;

  select id into attr_ram    from attribute_definitions where category_id = cat_id and name = 'RAM';
  select id into attr_ssd    from attribute_definitions where category_id = cat_id and name = 'Almacenamiento';
  select id into attr_cpu    from attribute_definitions where category_id = cat_id and name = 'Procesador';
  select id into attr_screen from attribute_definitions where category_id = cat_id and name = 'Pantalla';
  select id into attr_bat    from attribute_definitions where category_id = cat_id and name = 'Batería';
  select id into attr_weight from attribute_definitions where category_id = cat_id and name = 'Peso';
  select id into attr_cam    from attribute_definitions where category_id = cat_id and name = 'Cámara';
  select id into attr_wifi   from attribute_definitions where category_id = cat_id and name = 'WiFi';

  insert into products (
    sku, name, tagline, marketing_subtitle, marketing_body, description,
    price, stock, category_id, subcategory_id, is_featured, is_active, datasheet
  ) values (
    'ASUS-E1504F-R5-8GB',
    'ASUS Vivobook Go 15 OLED',
    'Pantalla OLED que lo cambia todo.',
    'Ligero, compacto y versátil — para ir a donde vayas.',
    'El Vivobook Go 15 OLED combina lo mejor de la tecnología OLED con un diseño ultradelgado. Su pantalla 15.6" OLED NanoEdge ofrece colores PANTONE y contraste 1.000.000:1. Certificación militar MIL-STD-810H y hasta 8 horas de batería.',
    'Laptop OLED 15.6" con AMD Ryzen 5, 8GB RAM y 512GB SSD. Certificación MIL-STD-810H.',
    799.00, 15, cat_id, sub_id, true, true,
    '{
      "Part No": "E1504FA-L1285W",
      "Sistema operativo": "Windows 11 Home",
      "Procesador": "AMD Ryzen 5 7520U (4 núcleos, 2.8-4.3 GHz)",
      "Gráficos": "AMD Radeon 610M (integrado)",
      "Pantalla": "15.6\" OLED FHD NanoEdge",
      "Resolución": "1920 x 1080 @ 60 Hz",
      "Brillo": "600 nits (pico HDR)",
      "Gama de color": "100% DCI-P3 PANTONE Validated",
      "RAM": "8 GB LPDDR5",
      "Almacenamiento": "512 GB M.2 NVMe PCIe 3.0 SSD",
      "Cámara": "HD 720p con obturador de privacidad",
      "WiFi": "Wi-Fi 5 (802.11ac) dual band",
      "Bluetooth": "5.0",
      "Puertos": "USB 3.2 Gen1 Tipo-A, USB 3.2 Gen1 Tipo-C, USB 2.0 Tipo-A, HDMI 1.4, Jack 3.5mm",
      "Batería": "42 WHrs, carga rápida (50% en 30 min)",
      "Peso": "1.63 kg",
      "Certificación": "MIL-STD-810H"
    }'::jsonb
  )
  on conflict (sku) do nothing
  returning id into prod_id;

  if prod_id is not null then
    insert into product_attributes (product_id, attribute_id, value) values
      (prod_id, attr_ram,    '8'),
      (prod_id, attr_ssd,    '512'),
      (prod_id, attr_cpu,    'AMD Ryzen 5 7520U'),
      (prod_id, attr_screen, '15.6'),
      (prod_id, attr_bat,    '42'),
      (prod_id, attr_weight, '1.63'),
      (prod_id, attr_cam,    'HD 720p con privacidad'),
      (prod_id, attr_wifi,   'Wi-Fi 5 dual band');
  end if;

end $$;

-- ─────────────────────────────────────────────────────────────────
-- VERIFICATION (optional — shows current state after running)
-- ─────────────────────────────────────────────────────────────────
select 'hero_content'         as tabla, count(*)::text as filas from hero_content union all
select 'categories',                    count(*)::text           from categories union all
select 'subcategories',                 count(*)::text           from subcategories union all
select 'attribute_definitions',         count(*)::text           from attribute_definitions union all
select 'products',                      count(*)::text           from products union all
select 'product_attributes',            count(*)::text           from product_attributes;
