-- Kaaya Farms Database Schema
-- Run this in the Supabase SQL Editor for project coxkkqylmaarpaqepcoc

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- CATTLE
-- ============================================================
create table if not exists cattle (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null,
  name        text not null,
  tag         text,
  breed       text,
  dob         date,
  status      text not null default 'active' check (status in ('active','sold','deceased')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cattle_farm_id_idx on cattle (farm_id);

-- ============================================================
-- MILK YIELD LOGS
-- ============================================================
create table if not exists milk_yield_logs (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null,
  cattle_id   uuid references cattle (id) on delete set null,
  session     text not null check (session in ('morning','evening')),
  qty_liters  numeric(6,2) not null,
  yield_date  date not null default current_date,
  logged_by   text,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists milk_yield_farm_idx   on milk_yield_logs (farm_id);
create index if not exists milk_yield_date_idx   on milk_yield_logs (yield_date desc);
create index if not exists milk_yield_cattle_idx on milk_yield_logs (cattle_id);

-- ============================================================
-- CATTLE HEALTH LOGS
-- ============================================================
create table if not exists cattle_health_logs (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null,
  cattle_id   uuid references cattle (id) on delete set null,
  event_type  text not null check (event_type in ('vaccination','illness','deworming','injury','checkup','calving')),
  description text not null,
  vet_name    text,
  log_date    date not null default current_date,
  next_due    date,
  created_at  timestamptz not null default now()
);

create index if not exists health_logs_farm_idx   on cattle_health_logs (farm_id);
create index if not exists health_logs_date_idx   on cattle_health_logs (log_date desc);
create index if not exists health_logs_cattle_idx on cattle_health_logs (cattle_id);

-- ============================================================
-- FEED INVENTORY
-- ============================================================
create table if not exists feed_inventory (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null,
  item_name   text not null,
  unit        text not null default 'kg',
  stock       numeric(10,2) not null default 0,
  reorder_at  numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists feed_inventory_farm_idx on feed_inventory (farm_id);

-- ============================================================
-- LEDGER ENTRIES
-- ============================================================
create table if not exists ledger_entries (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null,
  type          text not null check (type in ('income','expense')),
  category      text not null default 'other',
  amount        numeric(12,2) not null,
  description   text,
  payment_mode  text default 'cash' check (payment_mode in ('cash','upi','bank','credit')),
  entry_date    date not null default current_date,
  logged_by     text,
  receipt_url   text,
  created_at    timestamptz not null default now()
);

create index if not exists ledger_farm_idx on ledger_entries (farm_id);
create index if not exists ledger_date_idx on ledger_entries (entry_date desc);

-- ============================================================
-- TODOS
-- ============================================================
create table if not exists todos (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null,
  title        text not null,
  due_date     date,
  priority     text not null default 'medium' check (priority in ('high','medium','low')),
  assigned_to  text,
  created_by   text,
  status       text not null default 'pending' check (status in ('pending','done')),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists todos_farm_idx     on todos (farm_id);
create index if not exists todos_status_idx   on todos (status);
create index if not exists todos_priority_idx on todos (priority);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table cattle              enable row level security;
alter table milk_yield_logs     enable row level security;
alter table cattle_health_logs  enable row level security;
alter table feed_inventory      enable row level security;
alter table ledger_entries      enable row level security;
alter table todos               enable row level security;

-- Allow authenticated users to manage their farm's data
create policy "auth users can manage cattle"
  on cattle for all
  to authenticated
  using (true)
  with check (true);

create policy "auth users can manage milk logs"
  on milk_yield_logs for all
  to authenticated
  using (true)
  with check (true);

create policy "auth users can manage health logs"
  on cattle_health_logs for all
  to authenticated
  using (true)
  with check (true);

create policy "auth users can manage feed"
  on feed_inventory for all
  to authenticated
  using (true)
  with check (true);

create policy "auth users can manage ledger"
  on ledger_entries for all
  to authenticated
  using (true)
  with check (true);

create policy "auth users can manage todos"
  on todos for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- STORAGE BUCKET FOR RECEIPTS
-- ============================================================
-- Run these separately if the bucket doesn't exist:
-- insert into storage.buckets (id, name, public)
-- values ('farm-media', 'farm-media', true)
-- on conflict do nothing;
