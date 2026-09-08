-- DukaVerse — Migration v2 (fixed)
-- Run this in Supabase SQL Editor after the baseline schema.
-- Safe to re-run — uses IF NOT EXISTS and DROP IF EXISTS.

-- ─────────────────────────────────────────────
-- 1. Products: add cost_price and selling_price
-- ─────────────────────────────────────────────
alter table public.products
  add column if not exists cost_price    bigint not null default 0 check (cost_price >= 0),
  add column if not exists selling_price bigint not null default 0 check (selling_price >= 0);

-- Backfill: selling_price = price, cost_price = 80% of price
update public.products
set
  selling_price = price,
  cost_price    = (price * 0.8)::bigint
where selling_price = 0;

-- ─────────────────────────────────────────────
-- 2. Sales: add cost_price, profit, customer fields
-- ─────────────────────────────────────────────
alter table public.sales
  add column if not exists cost_price     bigint not null default 0,
  add column if not exists profit         bigint not null default 0,
  add column if not exists customer_name  text,
  add column if not exists customer_phone text;

-- ─────────────────────────────────────────────
-- 3. Drop and recreate the low_stock view
--    (view column list changed — must drop first)
-- ─────────────────────────────────────────────
drop view if exists public.low_stock;

create view public.low_stock
with (security_invoker = true)
as
select
  id, branch_id, name, sku, category,
  stock, unit, price, cost_price, selling_price,
  reorder, updated_at
from public.products
where is_active and stock <= reorder;

grant select on public.low_stock to authenticated;

-- ─────────────────────────────────────────────
-- 4. Replace record_sale() RPC with profit support
-- ─────────────────────────────────────────────
create or replace function public.record_sale(
  p_product_id     uuid,
  p_qty            integer,
  p_payment        text,
  p_status         public.sale_status default 'Paid',
  p_customer_name  text default null,
  p_customer_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product    public.products%rowtype;
  v_sale_id    uuid;
  v_user_id    uuid := (select auth.uid());
  v_unit_price bigint;
  v_total      bigint;
  v_profit     bigint;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_qty is null or p_qty <= 0 then raise exception 'Quantity must be positive'; end if;
  if p_payment is null or trim(p_payment) = '' then raise exception 'Payment method is required'; end if;
  if p_status is null then raise exception 'Sale status is required'; end if;

  select * into v_product
  from public.products
  where id = p_product_id and is_active
  for update;

  if not found then raise exception 'Product not found'; end if;
  if not (select private.can_access_branch(
    v_product.branch_id,
    array['Owner','Admin','Manager','Cashier']::public.staff_role[]
  )) then raise exception 'Not authorized'; end if;
  if not exists (
    select 1 from public.branches br
    where br.id = v_product.branch_id
      and (select private.has_active_access(br.business_id))
  ) then raise exception 'Subscription required'; end if;
  if v_product.stock < p_qty then raise exception 'Insufficient stock'; end if;

  -- Use selling_price if set, else fall back to price
  v_unit_price := case when v_product.selling_price > 0
                       then v_product.selling_price
                       else v_product.price end;
  v_total  := p_qty::bigint * v_unit_price;
  v_profit := p_qty::bigint * (v_unit_price - v_product.cost_price);

  insert into public.sales (
    branch_id, product_id, product_name,
    qty, unit_price, cost_price, total, profit,
    payment, status,
    customer_name, customer_phone,
    sold_by
  ) values (
    v_product.branch_id, v_product.id, v_product.name,
    p_qty, v_unit_price, v_product.cost_price, v_total, v_profit,
    trim(p_payment), p_status,
    nullif(trim(coalesce(p_customer_name,  '')), ''),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    v_user_id
  ) returning id into v_sale_id;

  update public.products
  set stock = stock - p_qty
  where id = v_product.id;

  insert into public.stock_logs (
    product_id, branch_id, movement_type,
    quantity_delta, balance_after,
    note, reference_sale_id, added_by
  ) values (
    v_product.id, v_product.branch_id, 'Sale',
    -p_qty, v_product.stock - p_qty,
    'Sale recorded', v_sale_id, v_user_id
  );

  return v_sale_id;
end;
$$;

revoke all on function public.record_sale(uuid, integer, text, public.sale_status, text, text) from public, anon;
grant execute on function public.record_sale(uuid, integer, text, public.sale_status, text, text) to authenticated;

-- Allow updating the new price columns
grant update (name, sku, category, unit, price, cost_price, selling_price, reorder, is_active)
  on public.products to authenticated;

-- Done.
-- Verify:
-- select name, cost_price, selling_price, selling_price - cost_price as profit_per_unit
-- from public.products limit 5;
