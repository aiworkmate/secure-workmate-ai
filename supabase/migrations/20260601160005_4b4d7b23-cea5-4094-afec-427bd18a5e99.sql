-- Supplemental schema for app code references

-- profiles additions (app uses user_id + display_name)
alter table public.profiles add column if not exists user_id uuid;
update public.profiles set user_id = id where user_id is null;
alter table public.profiles add column if not exists display_name text;
update public.profiles set display_name = full_name where display_name is null;
create unique index if not exists profiles_user_id_unique on public.profiles(user_id);

-- app_role enum + user_roles table
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'member');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

drop policy if exists "Users view own roles" on public.user_roles;
create policy "Users view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- memories adaptive columns + pinned/confidence/category for app
alter table public.memories
  add column if not exists frequency integer not null default 1,
  add column if not exists usefulness real not null default 0.5,
  add column if not exists last_used_at timestamptz not null default now(),
  add column if not exists pinned boolean not null default false,
  add column if not exists confidence numeric(3,2) not null default 0.80,
  add column if not exists category text not null default 'general';

create index if not exists memories_user_score_idx
  on public.memories (user_id, pinned desc, usefulness desc, frequency desc, last_used_at desc);

-- routing_stats
create table if not exists public.routing_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  intent text not null,
  live_used boolean not null default false,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  avg_latency_ms integer not null default 0,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, intent, live_used)
);
grant select, insert, update, delete on public.routing_stats to authenticated;
grant all on public.routing_stats to service_role;
alter table public.routing_stats enable row level security;
drop policy if exists "Users read own routing stats" on public.routing_stats;
create policy "Users read own routing stats" on public.routing_stats for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users manage own routing stats" on public.routing_stats;
create policy "Users manage own routing stats" on public.routing_stats for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- response_outcomes
create table if not exists public.response_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  conversation_id uuid not null,
  intent text not null,
  live_used boolean not null default false,
  memory_hits integer not null default 0,
  latency_ms integer not null default 0,
  chars integer not null default 0,
  was_fallback boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.response_outcomes to authenticated;
grant all on public.response_outcomes to service_role;
alter table public.response_outcomes enable row level security;
drop policy if exists "Users read own response outcomes" on public.response_outcomes;
create policy "Users read own response outcomes" on public.response_outcomes for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own response outcomes" on public.response_outcomes;
create policy "Users insert own response outcomes" on public.response_outcomes for insert to authenticated with check (auth.uid() = user_id);
create index if not exists response_outcomes_user_idx on public.response_outcomes (user_id, created_at desc);

-- memory_feedback
create table if not exists public.memory_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message_id uuid,
  conversation_id uuid,
  memory_ids uuid[] not null default '{}',
  helpful boolean not null,
  impact real not null default 0.5,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert on public.memory_feedback to authenticated;
grant all on public.memory_feedback to service_role;
alter table public.memory_feedback enable row level security;
drop policy if exists "Users read own memory feedback" on public.memory_feedback;
create policy "Users read own memory feedback" on public.memory_feedback for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users insert own memory feedback" on public.memory_feedback;
create policy "Users insert own memory feedback" on public.memory_feedback for insert to authenticated with check (auth.uid() = user_id);
create index if not exists idx_memory_feedback_user on public.memory_feedback(user_id, created_at desc);

-- user_memory (lightweight memory layer)
create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null default 'note',
  content text not null,
  weight real not null default 1.0,
  source_conversation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_user_memory_user_created on public.user_memory(user_id, created_at desc);
grant select, insert, update, delete on public.user_memory to authenticated;
grant all on public.user_memory to service_role;
alter table public.user_memory enable row level security;
drop policy if exists "Users can view their own memory" on public.user_memory;
create policy "Users can view their own memory" on public.user_memory for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own memory" on public.user_memory;
create policy "Users can insert their own memory" on public.user_memory for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own memory" on public.user_memory;
create policy "Users can update their own memory" on public.user_memory for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own memory" on public.user_memory;
create policy "Users can delete their own memory" on public.user_memory for delete using (auth.uid() = user_id);
drop trigger if exists user_memory_set_updated_at on public.user_memory;
create trigger user_memory_set_updated_at before update on public.user_memory for each row execute function app_private.set_updated_at();