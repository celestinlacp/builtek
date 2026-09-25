-- =============================================
-- 013 — Entregables: campo is_archived
-- =============================================

ALTER TABLE entregables ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_entregables_is_archived ON entregables(workspace_id, is_archived);
