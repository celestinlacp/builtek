-- ============================================================
-- Migración 046 — Cota: evolucionar tabla extractions
-- Motor RAG de conocimiento técnico por proyecto
-- ============================================================

-- 1. Renombrar data_json → raw_extraction
ALTER TABLE extractions RENAME COLUMN data_json TO raw_extraction;

-- 2. Hacer document_id nullable (extracción puede existir sin doc vinculado)
ALTER TABLE extractions ALTER COLUMN document_id DROP NOT NULL;

-- 3. Agregar columnas Cota
ALTER TABLE extractions
  ADD COLUMN workspace_id         uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN project_id           uuid REFERENCES projects(id)   ON DELETE CASCADE,
  ADD COLUMN doc_hints            jsonb        NOT NULL DEFAULT '{}',
  ADD COLUMN status               text         NOT NULL DEFAULT 'raw'
    CHECK (status IN ('raw', 'reviewed', 'approved')),
  ADD COLUMN confidence           text
    CHECK (confidence IN ('alta', 'media', 'baja')),
  ADD COLUMN corrected_extraction jsonb,
  ADD COLUMN correction_notes     text,
  ADD COLUMN corrected_by         uuid REFERENCES auth.users(id),
  ADD COLUMN corrected_at         timestamptz,
  ADD COLUMN created_by           uuid REFERENCES auth.users(id);

-- 4. Índices para queries por proyecto
CREATE INDEX ON extractions (project_id);
CREATE INDEX ON extractions (workspace_id, status);

-- 5. Reemplazar RLS policies (la anterior dependía de document_id → project → workspace)
DROP POLICY IF EXISTS "extractions_select" ON extractions;
DROP POLICY IF EXISTS "extractions_insert" ON extractions;

CREATE POLICY "extractions_select" ON extractions FOR SELECT
  USING (workspace_id IS NOT NULL AND is_workspace_member(workspace_id));

CREATE POLICY "extractions_insert" ON extractions FOR INSERT
  WITH CHECK (workspace_id IS NOT NULL AND is_workspace_member(workspace_id));

CREATE POLICY "extractions_update" ON extractions FOR UPDATE
  USING (workspace_id IS NOT NULL AND is_workspace_member(workspace_id));

CREATE POLICY "extractions_delete" ON extractions FOR DELETE
  USING (workspace_id IS NOT NULL AND is_workspace_member(workspace_id));
