-- =============================================
-- 015 — Flujo de aprobación documental
--        ELAB → REV → APR (Fase 3)
-- =============================================

-- Trazabilidad de revisión
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_at           timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_requested_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_requested_at   timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rejection_note        text;
