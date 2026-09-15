-- =============================================
-- Builtek — Schema inicial
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Reset (limpia todo si ya existe)
drop table if exists comments       cascade;
drop table if exists extractions    cascade;
drop table if exists documents      cascade;
drop table if exists tasks          cascade;
drop table if exists projects       cascade;
drop table if exists workspace_members cascade;
drop table if exists profiles       cascade;
drop table if exists workspaces     cascade;
drop function if exists handle_new_user()        cascade;
drop function if exists is_workspace_member(uuid) cascade;
drop function if exists get_workspace_role(uuid)  cascade;

-- Extensiones
create extension if not exists "uuid-ossp";

-- ── WORKSPACES ────────────────────────────────────────────────────────────────
create table workspaces (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  plan        text not null default 'free' check (plan in ('free','pro','enterprise')),
  created_at  timestamptz not null default now()
);

-- ── PROFILES (extiende auth.users) ───────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  updated_at  timestamptz default now()
);

-- Trigger: crear profile al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── WORKSPACE MEMBERS ─────────────────────────────────────────────────────────
create table workspace_members (
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'engineer' check (role in ('owner','admin','manager','engineer','viewer')),
  joined_at     timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ── PROJECTS ──────────────────────────────────────────────────────────────────
create table projects (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  status        text not null default 'active' check (status in ('active','paused','completed','archived')),
  start_date    date,
  end_date      date,
  created_at    timestamptz not null default now()
);

-- ── TASKS ─────────────────────────────────────────────────────────────────────
create table tasks (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null,
  description   text,
  specialty     text,
  assignee_id   uuid references auth.users(id) on delete set null,
  status        text not null default 'pending' check (status in ('pending','in_progress','review','done','blocked')),
  priority      text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date      date,
  created_at    timestamptz not null default now()
);

-- ── DOCUMENTS ─────────────────────────────────────────────────────────────────
create table documents (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null,
  version       integer not null default 1,
  file_url      text not null,
  file_type     text not null default 'pdf',
  status        text not null default 'draft' check (status in ('draft','review','approved','rejected')),
  uploaded_by   uuid not null references auth.users(id),
  approved_by   uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- ── EXTRACTIONS (AI outputs) ──────────────────────────────────────────────────
create table extractions (
  id            uuid primary key default uuid_generate_v4(),
  document_id   uuid not null references documents(id) on delete cascade,
  data_json     jsonb not null default '{}',
  created_by_ai boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── COMMENTS ──────────────────────────────────────────────────────────────────
create table comments (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table workspaces        enable row level security;
alter table profiles          enable row level security;
alter table workspace_members enable row level security;
alter table projects          enable row level security;
alter table tasks             enable row level security;
alter table documents         enable row level security;
alter table extractions       enable row level security;
alter table comments          enable row level security;

-- Helper: verifica si el usuario es miembro del workspace
create or replace function is_workspace_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$ language sql security definer;

-- Helper: obtiene el rol del usuario en el workspace
create or replace function get_workspace_role(ws_id uuid)
returns text as $$
  select role from workspace_members
  where workspace_id = ws_id and user_id = auth.uid()
  limit 1;
$$ language sql security definer;

-- Profiles: solo el propio usuario puede ver/editar su perfil
create policy "profiles_select" on profiles for select using (id = auth.uid());
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- Workspaces: miembros pueden leer, owner puede modificar
create policy "workspaces_select" on workspaces for select using (is_workspace_member(id));
create policy "workspaces_insert" on workspaces for insert with check (owner_id = auth.uid());
create policy "workspaces_update" on workspaces for update using (owner_id = auth.uid());
create policy "workspaces_delete" on workspaces for delete using (owner_id = auth.uid());

-- Workspace members: miembros pueden ver, admins/owners pueden gestionar
create policy "wm_select" on workspace_members for select using (is_workspace_member(workspace_id));
create policy "wm_insert" on workspace_members for insert with check (
  get_workspace_role(workspace_id) in ('owner','admin')
);
create policy "wm_delete" on workspace_members for delete using (
  get_workspace_role(workspace_id) in ('owner','admin') or user_id = auth.uid()
);

-- Projects: miembros del workspace pueden leer, managers+ pueden escribir
create policy "projects_select" on projects for select using (is_workspace_member(workspace_id));
create policy "projects_insert" on projects for insert with check (
  get_workspace_role(workspace_id) in ('owner','admin','manager')
);
create policy "projects_update" on projects for update using (
  get_workspace_role(workspace_id) in ('owner','admin','manager')
);
create policy "projects_delete" on projects for delete using (
  get_workspace_role(workspace_id) in ('owner','admin')
);

-- Tasks: heredan permisos del proyecto via workspace
create policy "tasks_select" on tasks for select using (
  exists (select 1 from projects p where p.id = project_id and is_workspace_member(p.workspace_id))
);
create policy "tasks_insert" on tasks for insert with check (
  exists (select 1 from projects p where p.id = project_id
    and get_workspace_role(p.workspace_id) in ('owner','admin','manager','engineer'))
);
create policy "tasks_update" on tasks for update using (
  exists (select 1 from projects p where p.id = project_id
    and get_workspace_role(p.workspace_id) in ('owner','admin','manager','engineer'))
);
create policy "tasks_delete" on tasks for delete using (
  exists (select 1 from projects p where p.id = project_id
    and get_workspace_role(p.workspace_id) in ('owner','admin','manager'))
);

-- Documents: misma lógica que tasks
create policy "docs_select" on documents for select using (
  exists (select 1 from projects p where p.id = project_id and is_workspace_member(p.workspace_id))
);
create policy "docs_insert" on documents for insert with check (
  exists (select 1 from projects p where p.id = project_id
    and get_workspace_role(p.workspace_id) in ('owner','admin','manager','engineer'))
);
create policy "docs_update" on documents for update using (
  exists (select 1 from projects p where p.id = project_id
    and get_workspace_role(p.workspace_id) in ('owner','admin','manager'))
);

-- Extractions y comments: misma lógica
create policy "extractions_select" on extractions for select using (
  exists (select 1 from documents d join projects p on p.id = d.project_id
    where d.id = document_id and is_workspace_member(p.workspace_id))
);
create policy "extractions_insert" on extractions for insert with check (
  exists (select 1 from documents d join projects p on p.id = d.project_id
    where d.id = document_id and is_workspace_member(p.workspace_id))
);

create policy "comments_select" on comments for select using (
  exists (select 1 from tasks t join projects p on p.id = t.project_id
    where t.id = task_id and is_workspace_member(p.workspace_id))
);
create policy "comments_insert" on comments for insert with check (
  user_id = auth.uid() and
  exists (select 1 from tasks t join projects p on p.id = t.project_id
    where t.id = task_id and is_workspace_member(p.workspace_id))
);
create policy "comments_delete" on comments for delete using (user_id = auth.uid());
