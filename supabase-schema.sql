-- DukaVerse — Supabase schema
-- Run this in the Supabase SQL editor or via `supabase db push`.
-- Enable Row Level Security on every table.

-- ─────────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────────
create type sale_status as enum ('Paid', 'Not paid');
create type staff_role  as enum ('Owner', 'Admin', 'Manager', 'Cashier', 'Stock keeper');

-- ─────────────────────────────────────────────
--  BUSINESSES
-- ─────────────────────────────────────────────
create table businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  type        text not null,
  created_at  timestamptz default now() not null
);

alter table businesses enable row level security;

create policy "Owner can manage their businesses"
  on businesses for all
  using (owner_id = auth.uid());

-- ─────────────────────────────────────────────
--  BRANCHES
-- ─────────────────────────────────────────────
create table branches (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid references businesses(id) on delete cascade not null,
  name         text not null,
  location     text not null,
  created_at   timestamptz default now() not null
);

alter table branches enable row level security;

-- Branch access: business owner or staff
create policy "Business members can read branches"
  on branches for select
  using (
    exists (
      select 1 from businesses b
      where b.id = branches.business_id
        and b.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where s.branch_id = branches.id
        and s.user_id = auth.uid()
    )
  );

create policy "Owner can manage branches"
  on branches for all
  using (
    exists (
      select 1 from businesses b
      where b.id = branches.business_id
        and b.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
--  PRODUCTS
-- ─────────────────────────────────────────────
create table products (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid references branches(id) on delete cascade not null,
  name        text not null,
  category    text not null default '',
  stock       integer not null default 0,
  unit        text not null default 'units',
  price       integer not null,   -- TZS, no decimals
  reorder     integer not null default 10,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table products enable row level security;

create policy "Branch members can read products"
  on products for select
  using (
    exists (
      select 1 from branches br
      join businesses b on b.id = br.business_id
      where br.id = products.branch_id
        and b.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where (s.branch_id = products.branch_id or s.branch_id is null)
        and s.user_id = auth.uid()
    )
  );

create policy "Owner and managers can write products"
  on products for all
  using (
    exists (
      select 1 from branches br
      join businesses b on b.id = br.business_id
      where br.id = products.branch_id
        and b.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where (s.branch_id = products.branch_id or s.branch_id is null)
        and s.user_id = auth.uid()
        and s.role in ('Admin', 'Manager', 'Stock keeper')
    )
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────
--  SALES
-- ─────────────────────────────────────────────
create table sales (
  id            uuid primary key default gen_random_uuid(),
  branch_id     uuid references branches(id) on delete cascade not null,
  product_id    uuid references products(id) on delete set null,
  product_name  text not null,   -- denormalised
  qty           integer not null,
  total         integer not null, -- TZS
  payment       text not null,
  status        sale_status not null default 'Paid',
  sold_by       uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now() not null
);

alter table sales enable row level security;

create policy "Branch members can read sales"
  on sales for select
  using (
    exists (
      select 1 from branches br
      join businesses b on b.id = br.business_id
      where br.id = sales.branch_id
        and b.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where (s.branch_id = sales.branch_id or s.branch_id is null)
        and s.user_id = auth.uid()
    )
  );

create policy "Cashiers and up can insert sales"
  on sales for insert
  with check (
    exists (
      select 1 from branches br
      join businesses b on b.id = br.business_id
      where br.id = sales.branch_id
        and b.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where (s.branch_id = sales.branch_id or s.branch_id is null)
        and s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
--  STOCK LOGS
-- ─────────────────────────────────────────────
create table stock_logs (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade not null,
  branch_id   uuid references branches(id) on delete cascade not null,
  qty_added   integer not null,
  note        text,
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now() not null
);

alter table stock_logs enable row level security;

create policy "Branch members can read stock logs"
  on stock_logs for select
  using (
    exists (
      select 1 from branches br
      join businesses b on b.id = br.business_id
      where br.id = stock_logs.branch_id
        and b.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where (s.branch_id = stock_logs.branch_id or s.branch_id is null)
        and s.user_id = auth.uid()
    )
  );

create policy "Stock keepers and up can insert logs"
  on stock_logs for insert
  with check (
    exists (
      select 1 from branches br
      join businesses b on b.id = br.business_id
      where br.id = stock_logs.branch_id
        and b.owner_id = auth.uid()
    )
    or
    exists (
      select 1 from staff s
      where (s.branch_id = stock_logs.branch_id or s.branch_id is null)
        and s.user_id = auth.uid()
        and s.role in ('Admin', 'Manager', 'Stock keeper')
    )
  );

-- ─────────────────────────────────────────────
--  STAFF
-- ─────────────────────────────────────────────
create table staff (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid references businesses(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  role         staff_role not null default 'Cashier',
  branch_id    uuid references branches(id) on delete set null, -- null = all branches
  created_at   timestamptz default now() not null,
  unique (business_id, user_id)
);

alter table staff enable row level security;

create policy "Owner can manage staff"
  on staff for all
  using (
    exists (
      select 1 from businesses b
      where b.id = staff.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "Staff can read their own record"
  on staff for select
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────
--  USEFUL VIEWS
-- ─────────────────────────────────────────────

-- Daily revenue per branch
create view daily_revenue as
  select
    branch_id,
    date_trunc('day', created_at at time zone 'Africa/Nairobi') as day,
    sum(total)                                                   as revenue,
    count(*)                                                     as transactions
  from sales
  group by 1, 2;

-- Low stock products
create view low_stock as
  select * from products
  where stock <= reorder;
