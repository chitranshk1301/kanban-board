-- ============================================================
-- Schema: profiles, projects, project_members (RBAC), issues, comments
-- ============================================================

-- Enums -------------------------------------------------------
create type public.project_role as enum ('viewer', 'member', 'manager', 'admin');
create type public.issue_status as enum ('backlog', 'todo', 'in_progress', 'done', 'cancelled');

-- profiles ----------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- projects ----------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  key text not null unique check (key ~ '^[A-Z]{2,6}$'),
  description text not null default '',
  created_by uuid not null default auth.uid() references public.profiles (id),
  next_issue_number int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- project_members: the RBAC table -----------------------------
create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.project_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx on public.project_members (user_id);

-- issues ------------------------------------------------------
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  number int not null,
  title text not null check (length(title) between 1 and 300),
  description text not null default '',
  status public.issue_status not null default 'todo',
  priority smallint not null default 0 check (priority between 0 and 4),
  assignee_id uuid references public.profiles (id) on delete set null,
  reporter_id uuid not null default auth.uid() references public.profiles (id),
  labels text[] not null default '{}',
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

create index issues_board_idx on public.issues (project_id, status, position);
create index issues_labels_idx on public.issues using gin (labels);

-- comments ----------------------------------------------------
-- project_id is denormalized from issues so comment RLS policies
-- never need to subquery the issues table.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  body text not null check (length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_issue_id_idx on public.comments (issue_id);

-- updated_at maintenance --------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger set_issues_updated_at before update on public.issues
  for each row execute function public.set_updated_at();
create trigger set_comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- Bootstrap: project creator automatically becomes its admin.
-- (SECURITY DEFINER: the creator is not a member yet, so they could
-- not insert their own membership under RLS.)
create function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- Sequential per-project issue numbers (KAN-1, KAN-2, ...).
-- The UPDATE row-locks the project row, making concurrent inserts safe.
-- (SECURITY DEFINER: members may insert issues but cannot UPDATE projects.)
create function public.assign_issue_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.projects
     set next_issue_number = next_issue_number + 1
   where id = new.project_id
   returning next_issue_number - 1 into new.number;
  return new;
end;
$$;

create trigger on_issue_created
  before insert on public.issues
  for each row execute function public.assign_issue_number();

-- Copy project_id onto comments from their issue.
create function public.set_comment_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select project_id into new.project_id
    from public.issues
   where id = new.issue_id;
  return new;
end;
$$;

create trigger on_comment_created
  before insert on public.comments
  for each row execute function public.set_comment_project();
