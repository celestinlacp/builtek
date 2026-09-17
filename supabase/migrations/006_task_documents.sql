-- =============================================
-- Builtek — Migración 006: Documentos vinculados a tareas
-- =============================================

CREATE TABLE IF NOT EXISTS task_documents (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id       uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  document_id   uuid REFERENCES documents(id) ON DELETE CASCADE,
  drive_file_id uuid REFERENCES drive_files(id) ON DELETE CASCADE,
  linked_by     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT task_documents_has_file CHECK (
    document_id IS NOT NULL OR drive_file_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS task_documents_task_idx ON task_documents(task_id);

ALTER TABLE task_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_docs_select" ON task_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_id AND is_workspace_member(p.workspace_id)
  )
);

CREATE POLICY "task_docs_insert" ON task_documents FOR INSERT WITH CHECK (
  linked_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_id AND is_workspace_member(p.workspace_id)
  )
);

CREATE POLICY "task_docs_delete" ON task_documents FOR DELETE USING (
  linked_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = task_id
    AND get_workspace_role(p.workspace_id) IN ('owner','admin','manager')
  )
);
