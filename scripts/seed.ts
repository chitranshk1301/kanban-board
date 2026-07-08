/**
 * Seeds the Supabase project with demo users, a project, issues and comments.
 *
 * Requires .env with:
 *   VITE_SUPABASE_URL          — your project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key (Dashboard → Settings → API)
 *
 * Run: pnpm seed
 *
 * Demo accounts (password: password123):
 *   demo-admin@example.com   — project admin
 *   demo-member@example.com  — member
 *   demo-viewer@example.com  — viewer
 */
import { createClient } from '@supabase/supabase-js'

try {
  process.loadEnvFile('.env')
} catch {
  // .env may not exist when vars are provided by the environment
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'password123'

const USERS = [
  { email: 'demo-admin@example.com', name: 'Demo Admin', role: 'admin' },
  { email: 'demo-member@example.com', name: 'Demo Member', role: 'member' },
  { email: 'demo-viewer@example.com', name: 'Demo Viewer', role: 'viewer' },
] as const

async function ensureUser(email: string, name: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (!error) return data.user.id

  // Already exists — look it up.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) throw listErr
  const existing = list.users.find((u) => u.email === email)
  if (!existing) throw error
  return existing.id
}

const LABEL_POOL = [
  ['bug'],
  ['feature'],
  ['feature', 'ui'],
  ['backend'],
  ['bug', 'backend'],
  ['docs'],
  [],
]

const ISSUES: {
  title: string
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority: number
}[] = [
  { title: 'Set up CI pipeline for pull requests', status: 'backlog', priority: 2 },
  { title: 'Investigate slow board load on large projects', status: 'backlog', priority: 3 },
  { title: 'Add dark mode support', status: 'backlog', priority: 1 },
  { title: 'Support keyboard shortcuts for board navigation', status: 'backlog', priority: 0 },
  { title: 'Login form should surface rate-limit errors', status: 'todo', priority: 3 },
  { title: 'Add issue due dates and reminders', status: 'todo', priority: 2 },
  { title: 'Export issues to CSV from the list view', status: 'todo', priority: 1 },
  { title: 'Improve empty states across all views', status: 'todo', priority: 0 },
  { title: 'Drag-and-drop reorder occasionally jumps a card', status: 'in_progress', priority: 4 },
  { title: 'Realtime sync for the kanban board', status: 'in_progress', priority: 3 },
  { title: 'Refactor filter bar into shared component', status: 'in_progress', priority: 2 },
  { title: 'Write RLS policy tests', status: 'in_progress', priority: 3 },
  { title: 'Project creation wizard', status: 'done', priority: 2 },
  { title: 'Email/password authentication', status: 'done', priority: 4 },
  { title: 'Issue detail side panel', status: 'done', priority: 3 },
  { title: 'Member role management UI', status: 'done', priority: 2 },
  { title: 'Basic list view with sorting', status: 'done', priority: 1 },
  { title: 'Migrate legacy webpack config', status: 'cancelled', priority: 0 },
  { title: 'Support IE11', status: 'cancelled', priority: 0 },
  { title: 'Self-hosted image uploads', status: 'cancelled', priority: 1 },
]

async function main() {
  console.log('Creating demo users…')
  const ids: Record<string, string> = {}
  for (const user of USERS) {
    ids[user.role] = await ensureUser(user.email, user.name)
    console.log(`  ${user.email} → ${ids[user.role]}`)
  }

  const { data: existing, error: existErr } = await admin
    .from('projects')
    .select('id')
    .eq('key', 'DEMO')
    .maybeSingle()
  if (existErr) throw existErr
  if (existing) {
    console.log('Project DEMO already exists — nothing to seed. Done.')
    return
  }

  console.log('Creating DEMO project…')
  const { data: project, error: projErr } = await admin
    .from('projects')
    .insert({
      name: 'Demo Project',
      key: 'DEMO',
      description: 'A seeded project showing off the kanban board.',
      created_by: ids.admin, // trigger makes them project admin
    })
    .select()
    .single()
  if (projErr) throw projErr

  console.log('Adding members…')
  const { error: memberErr } = await admin.from('project_members').insert([
    { project_id: project.id, user_id: ids.member, role: 'member' },
    { project_id: project.id, user_id: ids.viewer, role: 'viewer' },
  ])
  if (memberErr) throw memberErr

  console.log('Creating issues…')
  const assignees = [ids.admin, ids.member, null]
  const positionByStatus: Record<string, number> = {}
  const rows = ISSUES.map((issue, i) => {
    positionByStatus[issue.status] =
      (positionByStatus[issue.status] ?? 0) + 1024
    return {
      project_id: project.id,
      title: issue.title,
      description: `Seeded demo issue.\n\nStatus: ${issue.status}, priority ${issue.priority}.`,
      status: issue.status,
      priority: issue.priority,
      assignee_id: assignees[i % assignees.length],
      reporter_id: i % 2 === 0 ? ids.admin : ids.member,
      labels: LABEL_POOL[i % LABEL_POOL.length],
      position: positionByStatus[issue.status],
    }
  })
  const { data: issues, error: issueErr } = await admin
    .from('issues')
    .insert(rows)
    .select('id, number, title')
  if (issueErr) throw issueErr

  console.log('Adding comments…')
  const { error: commentErr } = await admin.from('comments').insert([
    {
      issue_id: issues[0].id,
      author_id: ids.member,
      body: 'I can pick this one up next sprint.',
    },
    {
      issue_id: issues[0].id,
      author_id: ids.admin,
      body: 'Sounds good — sync with me before you start.',
    },
    {
      issue_id: issues[8].id,
      author_id: ids.admin,
      body: 'Repro: drag a card quickly between two columns.',
    },
  ])
  if (commentErr) throw commentErr

  console.log(`\nSeeded ${issues.length} issues in project DEMO.`)
  console.log('Sign in with demo-admin@example.com / password123')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
