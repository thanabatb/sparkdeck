-- SparkDeck Phase 1 storage schema for Supabase

create table if not exists public.sparks (
  id text primary key,
  title text not null,
  raw_text text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text not null,
  status text not null,
  source_spark_id text null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.builds (
  id text primary key,
  target_task_id text null,
  target_text text null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.counters (
  name text primary key,
  next_value bigint not null check (next_value > 0)
);

insert into public.counters (name, next_value)
values
  ('spark', 1),
  ('task', 1),
  ('build', 1)
on conflict (name) do nothing;

create or replace function public.reserve_next_counter(counter_name text)
returns bigint
language plpgsql
as $$
declare
  reserved_value bigint;
begin
  insert into public.counters (name, next_value)
  values (counter_name, 1)
  on conflict (name) do nothing;

  update public.counters
  set next_value = next_value + 1
  where name = counter_name
  returning next_value - 1 into reserved_value;

  if reserved_value is null then
    raise exception 'Counter not found: %', counter_name;
  end if;

  return reserved_value;
end;
$$;
