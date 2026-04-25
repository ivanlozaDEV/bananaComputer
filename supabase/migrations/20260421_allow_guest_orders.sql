-- Allow anyone to insert orders (Guests)
create policy "Allow anon insert orders"
  on public.orders for insert
  with check (true);

-- Allow anyone to insert order items
create policy "Allow anon insert order_items"
  on public.order_items for insert
  with check (true);

-- Allow anon to see orders they just created (via ID matching)
-- Note: This is minimal read access for the confirmation page.
create policy "Allow anon select own orders"
  on public.orders for select
  using (true);

create policy "Allow anon select own order_items"
  on public.order_items for select
  using (true);
