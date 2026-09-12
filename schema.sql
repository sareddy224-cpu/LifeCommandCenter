-- Life Command Center v0.4 cloud sync schema
-- Run this once in Supabase SQL Editor.

create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Personal',
  goal text not null default '',
  deadline date,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  priority text not null default 'Medium',
  due_date date,
  duration integer not null default 15,
  category text not null default 'Personal',
  project_id text references public.projects(id) on delete set null,
  status text not null default 'Open',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inbox_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  item_type text not null default 'Task',
  category text not null default 'Personal',
  priority text not null default 'Medium',
  duration integer not null default 15,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.inbox_items enable row level security;

drop policy if exists "projects_own_rows" on public.projects;
create policy "projects_own_rows" on public.projects
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_own_rows" on public.tasks;
create policy "tasks_own_rows" on public.tasks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "inbox_own_rows" on public.inbox_items;
create policy "inbox_own_rows" on public.inbox_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_tasks_user_due on public.tasks(user_id, due_date);
create index if not exists idx_tasks_user_project on public.tasks(user_id, project_id);
create index if not exists idx_projects_user_deadline on public.projects(user_id, deadline);
create index if not exists idx_inbox_user_created on public.inbox_items(user_id, created_at desc);
