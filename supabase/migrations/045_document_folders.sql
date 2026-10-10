-- 045_document_folders.sql
-- Carpetas para organizar documentos dentro de una disciplina (por proyecto)

CREATE TABLE document_folders (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  specialty_code TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  created_by     UUID        REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier miembro del workspace
CREATE POLICY "members_read_document_folders"
  ON document_folders FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Escritura: owner / admin / manager
CREATE POLICY "managers_write_document_folders"
  ON document_folders FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    )
  );

-- folder_id en documents (nullable — NULL = sin carpeta, raíz de la disciplina)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL;

-- Índice para filtrar rápido por carpeta
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
