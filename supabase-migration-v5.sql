-- DukaVerse Migration v5 — Sale lifecycle (Active / Paid / Returned) + product size (kipimo)
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. New sale status: 'Returned' (unpaid sales are shown as "Active" in the app;
--    their stored status stays 'Not paid').
alter type public.sale_status add value if not exists 'Returned' after 'Not paid';

-- 2. Product size ("kipimo"): small / mid / large. Empty string = not set.
alter table public.products
  add column if not exists size text not null default ''
  check (size in ('', 'small', 'mid', 'large'));

-- Allow the app to update the new column (direct column grants are used on products).
grant update (size) on public.products to authenticated;

-- 3. Mark an unpaid sale as paid.
create or replace function public.mark_sale_paid(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.sales%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found'; end if;
  if not (select private.can_access_branch(v_sale.branch_id)) then
    raise exception 'Not authorized';
  end if;
  if v_sale.status <> 'Not paid' then
    raise exception 'Only unpaid (active) sales can be marked as paid';
  end if;

  update public.sales
  set status = 'Paid'
  where id = v_sale.id;
end;
$$;

-- 4. Return a sale: marks it 'Returned' and puts the goods back into inventory.
create or replace function public.return_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale    public.sales%rowtype;
  v_product public.products%rowtype;
  v_user_id uuid := (select auth.uid());
  v_branch_id uuid;
  v_balance integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found'; end if;
  if not (select private.can_access_branch(v_sale.branch_id)) then
    raise exception 'Not authorized';
  end if;
  if v_sale.status = 'Returned' then
    raise exception 'This sale has already been returned';
  end if;

  update public.sales
  set status = 'Returned'
  where id = v_sale.id;

  -- Put the goods back into inventory when the product still exists.
  if v_sale.product_id is not null then
    select * into v_product from public.products where id = v_sale.product_id for update;
    if found then
      v_branch_id := v_product.branch_id;
      update public.products
      set stock = stock + v_sale.qty
      where id = v_product.id
      returning stock into v_balance;

      insert into public.stock_logs (
        product_id, branch_id, movement_type,
        quantity_delta, balance_after,
        note, reference_sale_id, added_by
      ) values (
        v_product.id, v_branch_id, 'Return',
        v_sale.qty, v_balance,
        'Stock returned — sale ' || left(v_sale.id::text, 8),
        v_sale.id, v_user_id
      );
    end if;
  end if;
end;
$$;

revoke all on function public.mark_sale_paid(uuid) from public, anon;
revoke all on function public.return_sale(uuid) from public, anon;
grant execute on function public.mark_sale_paid(uuid) to authenticated;
grant execute on function public.return_sale(uuid) to authenticated;
