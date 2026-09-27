-- =============================================
-- Builtek — Migración 023: Especificaciones de Diseño
-- Documentos técnicos emitidos por mesas de especialistas
-- Ejecutar en Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS design_specs (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  specialty_id  uuid        REFERENCES specialties(id) ON DELETE SET NULL,
  title         text        NOT NULL,
  spec_code     text,                   -- Ej: ET-EST-001
  version       text        NOT NULL DEFAULT 'V1',
  issued_by     text,                   -- Nombre libre de la mesa / empresa
  company_id    uuid        REFERENCES companies(id) ON DELETE SET NULL,
  oficio_id     uuid        REFERENCES oficios(id) ON DELETE SET NULL,
  issued_date   date,
  status        text        NOT NULL DEFAULT 'vigente'
                  CHECK (status IN ('vigente', 'en_revision', 'supersedida')),
  storage_key   text,
  file_name     text,
  file_type     text,
  file_size     integer,
  notes         text,
  created_by    uuid        NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS design_specs_workspace_idx  ON design_specs(workspace_id);
CREATE INDEX IF NOT EXISTS design_specs_specialty_idx  ON design_specs(specialty_id);
CREATE INDEX IF NOT EXISTS design_specs_status_idx     ON design_specs(status);

ALTER TABLE design_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "design_specs_select" ON design_specs
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "design_specs_insert" ON design_specs
  FOR INSERT WITH CHECK (
    is_workspace_member(workspace_id) AND created_by = auth.uid()
  );

CREATE POLICY "design_specs_update" ON design_specs
  FOR UPDATE USING (
    get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
    OR created_by = auth.uid()
  );

CREATE POLICY "design_specs_delete" ON design_specs
  FOR DELETE USING (
    get_workspace_role(workspace_id) IN ('owner', 'admin')
  );

CREATE TRIGGER design_specs_updated_at
  BEFORE UPDATE ON design_specs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
