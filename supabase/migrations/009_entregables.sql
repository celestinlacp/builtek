-- =============================================
-- 009 — Entregables
-- Archivos subidos como entregables de tareas
-- =============================================

create table if not exists entregables (
  id           uuid primary key default uuid_generate_v4(),
  task_id      uuid not null references tasks(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  uploaded_by  uuid not null references profiles(id),
  file_url     text not null,
  file_name    text not null,
  file_type    text,
  file_size    bigint,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  reviewed_by  uuid references profiles(id),
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz not null default now()
);

alter table entregables enable row level security;

-- Todos los miembros pueden ver entregables del workspace
create policy "entregables_select" on entregables for select using (
  is_workspace_member(workspace_id)
);

-- El uploader debe ser el usuario actual y miembro del workspace
create policy "entregables_insert" on entregables for insert with check (
  uploaded_by = auth.uid() and is_workspace_member(workspace_id)
);

-- Solo owner/admin/manager pueden aprobar o rechazar
create policy "entregables_update" on entregables for update using (
  get_workspace_role(workspace_id) in ('owner', 'admin', 'manager')
);

-- El uploader o admins pueden eliminar
create policy "entregables_delete" on entregables for delete using (
  uploaded_by = auth.uid() or
  get_workspace_role(workspace_id) in ('owner', 'admin')
);

-- Índices
create index if not exists entregables_task_id_idx       on entregables(task_id);
create index if not exists entregables_workspace_id_idx  on entregables(workspace_id);
create index if not exists entregables_uploaded_by_idx   on entregables(uploaded_by);
create index if not exists entregables_status_idx        on entregables(status);
