-- =============================================
-- Builtek — Migración 022: Sistema MIC de Nomenclatura
-- Metodología de Información para la Construcción
-- Código MIC: [TRONCAL]-[IDENTIFICADOR]-[TIPO_DOC]-[ESPECIALIDAD]-[TIPO_PLANO]-[CONSECUTIVO]
-- Ejemplo: TQM-F012-PLA-EEST-COR-0004
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- ── CATÁLOGO MIC POR WORKSPACE ────────────────────────────────────────────────
-- Permite que cada workspace defina sus propios valores para cada segmento MIC.
-- segment: TRONCAL | IDENTIFICADOR | TIPO_DOC | ESPECIALIDAD | TIPO_PLANO
CREATE TABLE IF NOT EXISTS mic_nomenclatures (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  segment      text NOT NULL CHECK (segment IN ('TRONCAL','IDENTIFICADOR','TIPO_DOC','ESPECIALIDAD','TIPO_PLANO')),
  code         text NOT NULL,
  name         text NOT NULL,
  description  text,
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, segment, code)
);

CREATE INDEX IF NOT EXISTS mic_nomenclatures_workspace_idx ON mic_nomenclatures(workspace_id);
CREATE INDEX IF NOT EXISTS mic_nomenclatures_segment_idx  ON mic_nomenclatures(workspace_id, segment);

ALTER TABLE mic_nomenclatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mic_nomenclatures_select" ON mic_nomenclatures
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "mic_nomenclatures_insert" ON mic_nomenclatures
  FOR INSERT WITH CHECK (get_workspace_role(workspace_id) IN ('owner','admin'));

CREATE POLICY "mic_nomenclatures_update" ON mic_nomenclatures
  FOR UPDATE USING (get_workspace_role(workspace_id) IN ('owner','admin'));

CREATE POLICY "mic_nomenclatures_delete" ON mic_nomenclatures
  FOR DELETE USING (get_workspace_role(workspace_id) IN ('owner','admin'));

-- ── NUEVOS CAMPOS EN DOCUMENTS ────────────────────────────────────────────────
-- doc_view    → TIPO_PLANO del código MIC (PLT, COR, ALZ, PER, DET, ISO, DIA, CUA)
-- doc_element → Elemento estructural documentado (Zapata, Pilote, Trabe, Losa, etc.)
--               Campo de metadato libre — NO forma parte del código MIC
-- mic_version → V0 = Proyecto (análisis/diseño), V1 = Para Construcción (APC liberado)
--               Sistema paralelo e independiente al flujo ELAB→REV→APR→APC

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS doc_view    text,
  ADD COLUMN IF NOT EXISTS doc_element text,
  ADD COLUMN IF NOT EXISTS mic_version text CHECK (mic_version IN ('V0', 'V1'));

CREATE INDEX IF NOT EXISTS documents_doc_view_idx    ON documents(doc_view);
CREATE INDEX IF NOT EXISTS documents_mic_version_idx ON documents(mic_version);

-- ── ESTADO APC EN WORKFLOW DE APROBACIÓN ─────────────────────────────────────
-- APC = Aprobado Para Construcción
-- Estado final del flujo: ELAB → REV → APR → APC
-- Solo Owner/Admin pueden promover a APC.
-- NOTA: APC en el flujo ≠ mic_version V1. Son sistemas paralelos con distinto
-- propósito. APC es el estado de aprobación; V1 es la clasificación MIC del
-- documento. Un doc puede estar APC con mic_version V0 o V1.

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'apc'));
