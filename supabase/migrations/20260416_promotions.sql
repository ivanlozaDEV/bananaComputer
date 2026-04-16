-- ─────────────────────────────────────────────────────────────────
-- Promotions table — banner images configurable from admin
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────

create table if not exists promotions (
  id            uuid primary key default gen_random_uuid(),
  image_url     text not null,        -- horizontal banner image (text baked in)
  link_url      text,                 -- where clicking the banner goes
  is_active     boolean not null default true,
  display_order integer not null default 0,
  starts_at     timestamptz,          -- optional scheduling
  ends_at       timestamptz,
  created_at    timestamptz default now()
);

-- RLS
alter table promotions enable row level security;

-- Public can read active promotions
create policy "public read active promotions"
  on promotions for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
  );

-- Admins (authenticated) have full access
create policy "admin full access promotions"
  on promotions for all
  using (auth.uid() is not null);

-- Storage bucket for banners (re-uses product-images bucket, or create a new one)
-- If you want a separate bucket, run:
-- insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict do nothing;
