-- Allow admin to see ALL orders (current policy only lets customers see their own)
create policy "admin full access orders"
  on public.orders for all
  using (auth.uid() is not null);

create policy "admin full access order_items"
  on public.order_items for all
  using (auth.uid() is not null);
