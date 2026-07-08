-- ============================================================
-- RLS: project-scoped RBAC
--
-- Permission matrix:
--   viewer   read everything in the project, nothing else
--   member   + create issues/comments; edit/move/delete OWN issues
--              (own = reporter or assignee; delete = reporter only)
--   manager  + edit/move/delete ANY issue; delete any comment
--   admin    + manage members/roles; edit/delete the project
--   (any authenticated user may create a project; a trigger makes
--    the creator its admin)
-- ============================================================

-- Helpers ------------------------------------------------------
-- SECURITY DEFINER is load-bearing: a policy on project_members that
-- queried project_members directly would recurse infinitely. These
-- helpers bypass RLS for the membership lookup only.

create function public.role_rank(r public.project_role)
returns int
immutable
language sql
as $$
  select case r
    when 'viewer'  then 1
    when 'member'  then 2
    when 'manager' then 3
    when 'admin'   then 4
  end
$$;

create function public.has_project_role(p_project uuid, min_role public.project_role)
returns boolean
stable
language sql
security definer
set search_path = public
as $$
  select coalesce(
    public.role_rank((
      select role from public.project_members
      where project_id = p_project and user_id = auth.uid()
    )) >= public.role_rank(min_role),
    false
  )
$$;

create function public.is_project_member(p_project uuid)
returns boolean
stable
language sql
security definer
set search_path = public
as $$
  select public.has_project_role(p_project, 'viewer')
$$;

-- Enable RLS ---------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.issues enable row level security;
alter table public.comments enable row level security;

-- profiles -----------------------------------------------------
-- Any signed-in user can read profiles (needed for assignee pickers
-- and add-member-by-email). Acceptable exposure for this app.
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (true);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- projects -----------------------------------------------------
create policy projects_select_member on public.projects
  for select to authenticated
  using (public.is_project_member(id) or created_by = auth.uid());

create policy projects_insert_authenticated on public.projects
  for insert to authenticated
  with check (created_by = auth.uid());

create policy projects_update_admin on public.projects
  for update to authenticated
  using (public.has_project_role(id, 'admin'))
  with check (public.has_project_role(id, 'admin'));

create policy projects_delete_admin on public.projects
  for delete to authenticated
  using (public.has_project_role(id, 'admin'));

-- project_members ----------------------------------------------
create policy pm_select_member on public.project_members
  for select to authenticated
  using (public.is_project_member(project_id));

create policy pm_insert_admin on public.project_members
  for insert to authenticated
  with check (public.has_project_role(project_id, 'admin'));

create policy pm_update_admin on public.project_members
  for update to authenticated
  using (public.has_project_role(project_id, 'admin'))
  with check (public.has_project_role(project_id, 'admin'));

-- Admins can remove anyone; anyone can remove themselves (leave).
create policy pm_delete_admin_or_self on public.project_members
  for delete to authenticated
  using (public.has_project_role(project_id, 'admin') or user_id = auth.uid());

-- issues -------------------------------------------------------
create policy issues_select_member on public.issues
  for select to authenticated
  using (public.is_project_member(project_id));

create policy issues_insert_member on public.issues
  for insert to authenticated
  with check (
    public.has_project_role(project_id, 'member')
    and reporter_id = auth.uid()
  );

create policy issues_update_by_role on public.issues
  for update to authenticated
  using (
    public.has_project_role(project_id, 'manager')
    or (
      public.has_project_role(project_id, 'member')
      and (reporter_id = auth.uid() or assignee_id = auth.uid())
    )
  )
  with check (
    public.has_project_role(project_id, 'manager')
    or (
      public.has_project_role(project_id, 'member')
      and (reporter_id = auth.uid() or assignee_id = auth.uid())
    )
  );

create policy issues_delete_by_role on public.issues
  for delete to authenticated
  using (
    public.has_project_role(project_id, 'manager')
    or (
      public.has_project_role(project_id, 'member')
      and reporter_id = auth.uid()
    )
  );

-- comments -----------------------------------------------------
create policy comments_select_member on public.comments
  for select to authenticated
  using (public.is_project_member(project_id));

create policy comments_insert_member on public.comments
  for insert to authenticated
  with check (
    public.has_project_role(project_id, 'member')
    and author_id = auth.uid()
  );

create policy comments_update_own on public.comments
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy comments_delete_own_or_manager on public.comments
  for delete to authenticated
  using (author_id = auth.uid() or public.has_project_role(project_id, 'manager'));

-- Maintenance RPC ----------------------------------------------
-- Rewrites a column's positions to evenly spaced integers when float
-- midpoint insertion degenerates (~50 consecutive drops in one gap).
create function public.normalize_column_positions(p_project uuid, p_status public.issue_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_project_role(p_project, 'member') then
    raise exception 'insufficient permissions to normalize positions';
  end if;

  with ranked as (
    select id, row_number() over (order by position, created_at) as rn
      from public.issues
     where project_id = p_project and status = p_status
  )
  update public.issues i
     set position = ranked.rn * 1024
    from ranked
   where i.id = ranked.id;
end;
$$;
