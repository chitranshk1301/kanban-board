# Kanban Board

A full-stack, JIRA-style project management app: multiple projects, a drag-and-drop
kanban **Board** view, a sortable **List** view, JIRA-like stacked filters, and
**project-scoped RBAC** — all backed by [Supabase](https://supabase.com)
(Postgres + Auth + Row Level Security).

**Stack:** Vite · React 19 · TypeScript · TanStack Query · @dnd-kit · react-router 7 · Supabase

## Features

- **Projects** with short keys (`DEMO-12` style issue numbering)
- **Board view** — columns per status, drag-and-drop across and within columns
  (fractional positioning, optimistic updates), group by status / assignee / priority
- **List view** — sortable table (key, title, status, priority, assignee, updated)
- **Filters** — text search + multi-select status / priority / assignee / labels;
  the URL is the source of truth, so filtered views are shareable links
- **Issue panel** — inline editing, labels, comments; deep-linkable via `?issue=N`
- **RBAC (per project)** enforced by Postgres RLS, not just the UI:

  | Action | viewer | member | manager | admin |
  |---|:-:|:-:|:-:|:-:|
  | Read project, issues, comments | ✔ | ✔ | ✔ | ✔ |
  | Create issues, comment | | ✔ | ✔ | ✔ |
  | Edit/move/delete **own** issues | | ✔ | ✔ | ✔ |
  | Edit/move/delete **any** issue | | | ✔ | ✔ |
  | Manage members & roles, edit/delete project | | | | ✔ |

  Any signed-in user can create a project and becomes its admin.

## Setup

### 1. Supabase

Create (or reuse) a project at [supabase.com](https://supabase.com), then apply the
migrations in `supabase/migrations/`:

```sh
pnpm exec supabase login
pnpm exec supabase link --project-ref <your-project-ref>
pnpm exec supabase db push
```

(Alternatively paste the two SQL files into the Dashboard's SQL editor, in order.)

> **Dev tip:** disable *Authentication → Sign In/Up → Confirm email* while
> developing, or new sign-ups will have to go through email confirmation.

### 2. Environment

```sh
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
(Dashboard → Settings → API). `SUPABASE_SERVICE_ROLE_KEY` is only needed for
seeding — never commit it or ship it to the client.

### 3. Run

```sh
pnpm install
pnpm dev
```

### 4. Demo data (optional)

```sh
pnpm seed
```

Creates a `DEMO` project with ~20 issues and three users
(password `password123`):

- `demo-admin@example.com` — admin
- `demo-member@example.com` — member
- `demo-viewer@example.com` — viewer

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Typecheck + production build |
| `pnpm preview` | Preview the production build |
| `pnpm typecheck` | TypeScript only |
| `pnpm gen:types` | Regenerate `src/lib/database.types.ts` from the linked project |
| `pnpm seed` | Seed demo users/project/issues (needs service role key) |

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production Docker image (nginx)
and step-by-step AWS deployment via ECR + App Runner (or ECS Fargate).

## Architecture notes

- **No custom backend** — the client talks to Supabase directly; every table has
  RLS enabled and the policies in
  `supabase/migrations/20260708000002_rls_policies.sql` are the actual
  permission enforcement. The `usePermissions` hook only mirrors them for UX.
- Membership lookups inside policies go through `SECURITY DEFINER` helper
  functions (`has_project_role`, `is_project_member`) to avoid infinite RLS
  recursion on `project_members`.
- Kanban ordering uses a float `position` column with midpoint insertion —
  one row updated per move. If a gap degenerates, the
  `normalize_column_positions` RPC re-spaces the column.
- Issue numbers (`DEMO-42`) come from a `BEFORE INSERT` trigger that
  atomically increments `projects.next_issue_number`.
