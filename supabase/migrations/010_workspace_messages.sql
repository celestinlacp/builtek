-- =============================================
-- 010 — Workspace Messages (Chat + Notificaciones)
-- sender_id = null  →  mensaje del sistema (Builtek)
-- =============================================

create table if not exists workspace_messages (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  sender_id    uuid references profiles(id) on delete set null,
  content      text not null,
  type         text not null default 'message'
                 check (type in ('message', 'system')),
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

alter table workspace_messages enable row level security;

-- Todos los miembros pueden leer mensajes de su workspace
create policy "messages_select" on workspace_messages for select using (
  is_workspace_member(workspace_id)
);

-- Miembros pueden enviar mensajes (sender_id = su uid o null para sistema via service role)
create policy "messages_insert" on workspace_messages for insert with check (
  is_workspace_member(workspace_id) and
  (sender_id = auth.uid() or sender_id is null)
);

-- Mensajes son inmutables — sin update ni delete para usuarios

-- Índices
create index if not exists workspace_messages_workspace_id_idx on workspace_messages(workspace_id);
create index if not exists workspace_messages_created_at_idx   on workspace_messages(workspace_id, created_at desc);
create index if not exists workspace_messages_sender_id_idx    on workspace_messages(sender_id);
