-- =============================================
-- Builtek — Migración 021: Empresas + IDs internos de documentos
-- Dimension table para autores de documentos (empresas externas/internas)
-- ref_code para identificar cada documento con ID interno (DOC000001...)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- ── TABLA MAESTRA DE EMPRESAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  short_name    text,                    -- siglas o nombre corto (ej: "ICA", "CICSA")
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companies_workspace_idx ON companies(workspace_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select" ON companies FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (
  get_workspace_role(workspace_id) IN ('owner','admin','manager')
);
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (
  get_workspace_role(workspace_id) IN ('owner','admin','manager')
);
CREATE POLICY "companies_delete" ON companies FOR DELETE USING (
  get_workspace_role(workspace_id) IN ('owner','admin')
);

-- ── ID INTERNO PARA DOCUMENTOS (ref_code) ────────────────────────────────────
-- Formato: DOC000001, DOC000002... (complementa UP000001 del Drive)
CREATE SEQUENCE IF NOT EXISTS document_ref_seq START 1;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS ref_code    text UNIQUE DEFAULT ('DOC' || LPAD(nextval('document_ref_seq')::text, 6, '0')),
  ADD COLUMN IF NOT EXISTS company_id  uuid REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS documents_company_idx  ON documents(company_id);
CREATE INDEX IF NOT EXISTS documents_ref_code_idx ON documents(ref_code);

-- Backfill ref_code para documentos ya existentes que tengan NULL
-- (los nuevos documentos se generan automáticamente via DEFAULT)
UPDATE documents SET ref_code = 'DOC' || LPAD(nextval('document_ref_seq')::text, 6, '0')
WHERE ref_code IS NULL;
