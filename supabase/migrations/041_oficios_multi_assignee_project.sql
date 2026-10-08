-- =============================================
-- 041 — Oficios: segundo asignado y segundo proyecto
-- =============================================

ALTER TABLE oficios
  ADD COLUMN IF NOT EXISTS assignee2_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proyecto2_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS oficios_assignee2_id_idx ON oficios(assignee2_id);
CREATE INDEX IF NOT EXISTS oficios_proyecto2_id_idx ON oficios(proyecto2_id);
