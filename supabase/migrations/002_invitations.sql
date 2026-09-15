-- =============================================
-- Builtek — Tabla de invitaciones
-- =============================================

create table workspace_invitations (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  email         text not null,
  role          text not null default 'engineer' check (role in ('admin','manager','engineer','viewer')),
  invited_by    uuid references auth.users(id) on delete set null,
  token         uuid not null default uuid_generate_v4(),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique(workspace_id, email)
);

alter table workspace_invitations enable row level security;

-- Solo miembros del workspace pueden ver las invitaciones
create policy "invitations_select" on workspace_invitations for select using (
  is_workspace_member(workspace_id)
);

-- Solo owner/admin pueden crear invitaciones
create policy "invitations_insert" on workspace_invitations for insert with check (
  get_workspace_role(workspace_id) in ('owner', 'admin')
);

-- Solo owner/admin pueden eliminar invitaciones
create policy "invitations_delete" on workspace_invitations for delete using (
  get_workspace_role(workspace_id) in ('owner', 'admin')
);
