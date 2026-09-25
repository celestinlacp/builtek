-- =============================================
-- 012 — Control de versiones de documentos
-- Detección automática por nomenclatura AEC
-- =============================================

-- doc_key: nombre normalizado sin versión (ej: TQM-0000-PLA-AARQ-PLT)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_key text;

-- version_number: entero extraído del filename (ej: 4 de "0004")
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_number integer;

-- is_current: true = versión vigente del documento, false = versión archivada
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT true;

-- superseded_by: apunta al documento que reemplazó a este (para trazabilidad)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES documents(id) ON DELETE SET NULL;

-- Índice para búsqueda rápida por doc_key dentro de un workspace
CREATE INDEX IF NOT EXISTS idx_documents_doc_key ON documents(workspace_id, doc_key) WHERE doc_key IS NOT NULL;

-- Índice para filtrar versión vigente
CREATE INDEX IF NOT EXISTS idx_documents_is_current ON documents(workspace_id, is_current);

-- Backfill: documentos existentes mantienen is_current=true (ya está por default)
-- doc_key y version_number quedan null hasta que se re-suban con la nueva nomenclatura
