-- DukaVerse — production baseline schema for Supabase/Postgres
-- Apply as a versioned migration to a fresh project.
-- All money values are stored as whole TZS in bigint columns.

create schema if not exists private;

create type public.sale_status as enum ('Paid', 'Not paid', 'Returned');
create type public.staff_role as enum ('Owner', 'Admin', 'Manager', 'Cashier', 'Stock keeper');
create type public.subscription_interval as enum ('Monthly', '3 months', '6 months', 'Yearly');
create type public.subscription_status as enum ('Trialing', 'Active', 'Past due', 'Canceled', 'Expired');
create type public.stock_movement_type as enum ('Opening', 'Purchase', 'Sale', 'Adjustment', 'Return');

-- User-owned profile. Authorization never relies on editable user_metadata.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  type text not null check (char_length(trim(type)) between 2 and 60),
  timezone text not null default 'Africa/Dar_es_Salaam',
  currency char(3) not null default 'TZS',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  location text not null check (char_length(trim(location)) between 2 and 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, name)
);

-- One membership per user/business. branch_id NULL means all branches.
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  role public.staff_role not null default 'Cashier',
  branch_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id),
  foreign key (business_id, branch_id)
    references public.branches(business_id, id) on delete cascade
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  sku text,
  category text not null default '',
  stock integer not null default 0 check (stock >= 0),
  unit text not null default 'units' check (char_length(trim(unit)) between 1 and 30),
  size text not null default '' check (size in ('', 'small', 'mid', 'large')),
  price bigint not null check (price >= 0),
  reorder integer not null default 10 check (reorder >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, name),
  unique (branch_id, sku),
  unique (branch_id, id)
);

-- A sale row currently represents one product line, preserving application compatibility.
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid,
  product_name text not null check (char_length(trim(product_name)) > 0),
  qty integer not null check (qty > 0),
  unit_price bigint not null check (unit_price >= 0),
  total bigint not null check (total >= 0 and total = qty::bigint * unit_price),
  payment text not null check (char_length(trim(payment)) > 0),
  status public.sale_status not null default 'Paid',
  sold_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (branch_id, product_id)
    references public.products(branch_id, id) on delete set null (product_id)
);

-- Immutable inventory ledger: additions are positive, sales are negative.
create table public.stock_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  branch_id uuid not null references public.branches(id) on delete cascade,
  movement_type public.stock_movement_type not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  balance_after integer not null check (balance_after >= 0),
  note text,
  reference_sale_id uuid references public.sales(id) on delete set null,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (branch_id, product_id)
    references public.products(branch_id, id) on delete restrict
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  billing_interval public.subscription_interval not null,
  status public.subscription_status not null default 'Trialing',
  amount_tzs bigint not null check (amount_tzs >= 0),
  provider text,
  provider_reference text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (provider, provider_reference)
);

create table public.alert_preferences (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  low_stock_email boolean not null default true,
  low_stock_sms boolean not null default false,
  daily_report_email boolean not null default true,
  daily_report_sms boolean not null default false,
  recipient_email text,
  recipient_phone text,
  updated_at timestamptz not null default now()
);

-- Query/RLS indexes. PostgreSQL does not create these for foreign keys automatically.
create index businesses_owner_id_idx on public.businesses(owner_id);
create index branches_business_id_idx on public.branches(business_id);
create index staff_user_business_idx on public.staff(user_id, business_id) where is_active;
create index staff_branch_user_idx on public.staff(branch_id, user_id) where is_active;
create index products_branch_active_idx on public.products(branch_id, is_active);
create index products_low_stock_idx on public.products(branch_id, stock, reorder) where is_active;
create index sales_branch_created_at_idx on public.sales(branch_id, created_at desc);
create index sales_product_created_at_idx on public.sales(product_id, created_at desc);
create index sales_sold_by_idx on public.sales(sold_by);
create index stock_logs_branch_created_at_idx on public.stock_logs(branch_id, created_at desc);
create index stock_logs_product_created_at_idx on public.stock_logs(product_id, created_at desc);
create index stock_logs_added_by_idx on public.stock_logs(added_by);
create index subscriptions_business_status_idx on public.subscriptions(business_id, status);
create unique index subscriptions_one_current_idx
  on public.subscriptions(business_id)
  where status in ('Trialing', 'Active', 'Past due');

-- Generic updated_at trigger.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
for each row execute function private.set_updated_at();
create trigger branches_set_updated_at before update on public.branches
for each row execute function private.set_updated_at();
create trigger staff_set_updated_at before update on public.staff
for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function private.set_updated_at();
create trigger alert_preferences_set_updated_at before update on public.alert_preferences
for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;

  if nullif(trim(new.raw_user_meta_data ->> 'business_name'), '') is not null then
    insert into public.businesses (owner_id, name, type)
    values (
      new.id,
      trim(new.raw_user_meta_data ->> 'business_name'),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_type'), ''), 'Retail shop')
    )
    returning id into v_business_id;

    insert into public.branches (business_id, name, location)
    values (
      v_business_id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'branch_name'), ''), trim(new.raw_user_meta_data ->> 'business_name')),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_location'), ''), 'Not specified')
    );

    insert into public.staff (business_id, user_id, name, role, branch_id)
    values (
      v_business_id,
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      'Owner',
      null
    );

    insert into public.alert_preferences (business_id, recipient_email, recipient_phone)
    values (
      v_business_id,
      new.email,
      nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
    );

    insert into public.subscriptions (
      business_id, billing_interval, status, amount_tzs, starts_at, ends_at
    ) values (
      v_business_id, 'Monthly', 'Trialing', 0, now(), now() + interval '14 days'
    );
  end if;
  return new;
end;
$$;

create trigger auth_user_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

-- Private RLS helpers prevent recursive policy evaluation.
create or replace function private.is_business_owner(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id
      and b.owner_id = (select auth.uid())
  );
$$;

create or replace function private.has_business_role(
  p_business_id uuid,
  p_roles public.staff_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.is_business_owner(p_business_id))
    or exists (
      select 1 from public.staff s
      where s.business_id = p_business_id
        and s.user_id = (select auth.uid())
        and s.is_active
        and s.role = any(p_roles)
    );
$$;

create or replace function private.can_access_branch(
  p_branch_id uuid,
  p_roles public.staff_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.branches br
    where br.id = p_branch_id
      and (
        (select private.is_business_owner(br.business_id))
        or exists (
          select 1 from public.staff s
          where s.business_id = br.business_id
            and s.user_id = (select auth.uid())
            and s.is_active
            and (s.branch_id is null or s.branch_id = br.id)
            and (p_roles is null or s.role = any(p_roles))
        )
      )
  );
$$;

-- Paid subscriptions and the initial 14-day trial unlock write operations.
-- Read access remains available after expiry so owners can retrieve their data.
create or replace function private.has_active_access(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and (
        b.trial_ends_at > now()
        or exists (
          select 1
          from public.subscriptions s
          where s.business_id = b.id
            and s.status in ('Trialing', 'Active')
            and s.starts_at <= now()
            and s.ends_at > now()
        )
      )
  );
$$;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.is_business_owner(uuid) to authenticated;
grant execute on function private.has_business_role(uuid, public.staff_role[]) to authenticated;
grant execute on function private.can_access_branch(uuid, public.staff_role[]) to authenticated;
grant execute on function private.has_active_access(uuid) to authenticated;

-- Enforce the product requirement: maximum five active branches per business.
create or replace function private.enforce_branch_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Serialize branch creation for this business so concurrent inserts cannot
  -- bypass the five-active-branch limit.
  perform 1 from public.businesses where id = new.business_id for update;

  if new.is_active and (
    select count(*) from public.branches
    where business_id = new.business_id
      and is_active
      and id <> new.id
  ) >= 5 then
    raise exception 'A business can have at most 5 active branches'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger branches_enforce_limit
before insert or update of is_active, business_id on public.branches
for each row execute function private.enforce_branch_limit();

create or replace function private.log_product_opening_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stock > 0 then
    insert into public.stock_logs (
      product_id, branch_id, movement_type, quantity_delta,
      balance_after, note, added_by
    ) values (
      new.id, new.branch_id, 'Opening', new.stock,
      new.stock, 'Opening stock', (select auth.uid())
    );
  end if;
  return new;
end;
$$;

create trigger products_log_opening_stock
after insert on public.products
for each row execute function private.log_product_opening_stock();

-- Atomic sale operation: validates access, locks stock, derives price server-side,
-- records the sale and stock ledger entry, then decrements inventory.
create or replace function public.record_sale(
  p_product_id uuid,
  p_qty integer,
  p_payment text,
  p_status public.sale_status default 'Paid'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_sale_id uuid;
  v_user_id uuid := (select auth.uid());
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
  -- Resolve the business through the branch rather than trusting client data.
  if not exists (
    select 1 from public.branches br
    where br.id = v_product.branch_id
      and (select private.has_active_access(br.business_id))
  ) then raise exception 'Subscription required'; end if;
  if v_product.stock < p_qty then raise exception 'Insufficient stock'; end if;

  insert into public.sales (
    branch_id, product_id, product_name, qty, unit_price, total,
    payment, status, sold_by
  ) values (
    v_product.branch_id, v_product.id, v_product.name, p_qty,
    v_product.price, p_qty::bigint * v_product.price,
    trim(p_payment), p_status, v_user_id
  ) returning id into v_sale_id;

  update public.products
  set stock = stock - p_qty
  where id = v_product.id;

  insert into public.stock_logs (
    product_id, branch_id, movement_type, quantity_delta, balance_after,
    note, reference_sale_id, added_by
  ) values (
    v_product.id, v_product.branch_id, 'Sale', -p_qty,
    v_product.stock - p_qty, 'Sale recorded', v_sale_id, v_user_id
  );

  return v_sale_id;
end;
$$;

create or replace function public.add_stock(
  p_product_id uuid,
  p_quantity integer,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_new_balance integer;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;

  select * into v_product
  from public.products
  where id = p_product_id and is_active
  for update;

  if not found then raise exception 'Product not found'; end if;
  if not (select private.can_access_branch(
    v_product.branch_id,
    array['Owner','Admin','Manager','Stock keeper']::public.staff_role[]
  )) then raise exception 'Not authorized'; end if;
  if not exists (
    select 1 from public.branches br
    where br.id = v_product.branch_id
      and (select private.has_active_access(br.business_id))
  ) then raise exception 'Subscription required'; end if;

  v_new_balance := v_product.stock + p_quantity;
  update public.products set stock = v_new_balance where id = v_product.id;

  insert into public.stock_logs (
    product_id, branch_id, movement_type, quantity_delta,
    balance_after, note, added_by
  ) values (
    v_product.id, v_product.branch_id, 'Purchase', p_quantity,
    v_new_balance, nullif(trim(p_note), ''), v_user_id
  );

  return v_new_balance;
end;
$$;

revoke all on function public.record_sale(uuid, integer, text, public.sale_status) from public, anon;
revoke all on function public.add_stock(uuid, integer, text) from public, anon;
grant execute on function public.record_sale(uuid, integer, text, public.sale_status) to authenticated;
grant execute on function public.add_stock(uuid, integer, text) to authenticated;

-- Mark an unpaid (active) sale as paid.
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

-- Return a sale: marks it 'Returned' and puts the goods back into inventory.
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
revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function private.enforce_branch_limit() from public, anon, authenticated;
revoke execute on function private.log_product_opening_stock() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.staff enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.stock_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.alert_preferences enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy businesses_select_members on public.businesses for select to authenticated
using (owner_id = (select auth.uid()) or (select private.has_business_role(id, enum_range(null::public.staff_role))));
create policy businesses_update_owner on public.businesses for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy businesses_delete_owner on public.businesses for delete to authenticated
using (owner_id = (select auth.uid()));

create policy branches_select_members on public.branches for select to authenticated
using ((select private.can_access_branch(id)));
create policy branches_insert_admin on public.branches for insert to authenticated
with check (
  (select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[]))
  and (select private.has_active_access(business_id))
);
create policy branches_update_admin on public.branches for update to authenticated
using (
  (select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[]))
  and (select private.has_active_access(business_id))
)
with check (
  (select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[]))
  and (select private.has_active_access(business_id))
);
create policy branches_delete_owner on public.branches for delete to authenticated
using ((select private.is_business_owner(business_id)));

create policy staff_select_members on public.staff for select to authenticated
using (user_id = (select auth.uid()) or (select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[])));
create policy staff_insert_admin on public.staff for insert to authenticated
with check (
  (select private.has_active_access(business_id))
  and (
    (select private.is_business_owner(business_id))
    or (
      (select private.has_business_role(business_id, array['Admin']::public.staff_role[]))
      and role <> 'Owner'
    )
  )
);
create policy staff_update_admin on public.staff for update to authenticated
using (
  (select private.has_active_access(business_id))
  and (
    (select private.is_business_owner(business_id))
    or (
      (select private.has_business_role(business_id, array['Admin']::public.staff_role[]))
      and role <> 'Owner'
    )
  )
)
with check (
  (select private.has_active_access(business_id))
  and (
    (select private.is_business_owner(business_id))
    or (
      (select private.has_business_role(business_id, array['Admin']::public.staff_role[]))
      and role <> 'Owner'
    )
  )
);
create policy staff_delete_admin on public.staff for delete to authenticated
using ((select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[])) and role <> 'Owner');

create policy products_select_members on public.products for select to authenticated
using ((select private.can_access_branch(branch_id)));
create policy products_insert_stock_team on public.products for insert to authenticated
with check (
  (select private.can_access_branch(branch_id, array['Owner','Admin','Manager','Stock keeper']::public.staff_role[]))
  and exists (
    select 1 from public.branches br
    where br.id = branch_id and (select private.has_active_access(br.business_id))
  )
);
create policy products_update_stock_team on public.products for update to authenticated
using ((select private.can_access_branch(branch_id, array['Owner','Admin','Manager','Stock keeper']::public.staff_role[])))
with check (
  (select private.can_access_branch(branch_id, array['Owner','Admin','Manager','Stock keeper']::public.staff_role[]))
  and exists (
    select 1 from public.branches br
    where br.id = branch_id and (select private.has_active_access(br.business_id))
  )
);
create policy sales_select_members on public.sales for select to authenticated
using ((select private.can_access_branch(branch_id)));
-- Direct client inserts/updates are intentionally omitted; use record_sale().

create policy stock_logs_select_members on public.stock_logs for select to authenticated
using ((select private.can_access_branch(branch_id)));
-- Direct client writes are intentionally omitted; use add_stock()/record_sale().

create policy subscriptions_select_admin on public.subscriptions for select to authenticated
using ((select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[])));
create policy alert_preferences_select_admin on public.alert_preferences for select to authenticated
using ((select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[])));
create policy alert_preferences_insert_admin on public.alert_preferences for insert to authenticated
with check ((select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[])));
create policy alert_preferences_update_admin on public.alert_preferences for update to authenticated
using ((select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[])))
with check ((select private.has_business_role(business_id, array['Owner','Admin']::public.staff_role[])));

-- Views inherit the caller's permissions and underlying RLS.
create view public.daily_revenue
with (security_invoker = true)
as
select
  branch_id,
  date_trunc('day', created_at at time zone 'Africa/Dar_es_Salaam') as day,
  sum(total) filter (where status = 'Paid') as paid_revenue,
  sum(total) filter (where status = 'Not paid') as unpaid_revenue,
  sum(total) as gross_sales,
  count(*) as transactions
from public.sales
group by branch_id, date_trunc('day', created_at at time zone 'Africa/Dar_es_Salaam');

create view public.low_stock
with (security_invoker = true)
as
select id, branch_id, name, sku, category, stock, unit, price, reorder, updated_at
from public.products
where is_active and stock <= reorder;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, delete on public.businesses to authenticated;
grant update (name, type, timezone, currency) on public.businesses to authenticated;
grant select, insert, update, delete on public.branches, public.staff to authenticated;
grant select, insert on public.products to authenticated;
grant update (name, sku, category, unit, price, reorder, is_active) on public.products to authenticated;
grant select on public.sales, public.stock_logs to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update on public.alert_preferences to authenticated;
grant select on public.daily_revenue, public.low_stock to authenticated;

revoke all on public.profiles, public.businesses, public.branches, public.staff,
  public.products, public.sales, public.stock_logs, public.subscriptions,
  public.alert_preferences from anon;

comment on function public.record_sale is
  'Atomically records one product sale and decrements inventory using the stored product price.';
comment on function public.add_stock is
  'Atomically increments inventory and appends an immutable stock ledger entry.';
