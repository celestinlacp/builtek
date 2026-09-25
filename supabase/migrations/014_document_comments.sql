-- =============================================
-- 014 — Comentarios de control de cambios
--        para documentos (slide-over Fase 2)
-- =============================================

create table if not exists document_comments (
  id           uuid primary key default uuid_generate_v4(),
  document_id  uuid not null references documents(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  content      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_doc_comments_document on document_comments(document_id);

alter table document_comments enable row level security;

create policy "doc_comments_select" on document_comments for select using (
  workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
);
create policy "doc_comments_insert" on document_comments for insert with check (
  workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
);
create policy "doc_comments_delete" on document_comments for delete using (user_id = auth.uid());
