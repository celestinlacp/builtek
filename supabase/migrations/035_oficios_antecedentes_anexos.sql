-- ── Migración 035: Oficios — tema, antecedentes y anexos ─────────────────────

-- 1. Campo "tema" en oficios (diferencia docs de la misma especialidad)
ALTER TABLE oficios ADD COLUMN IF NOT EXISTS tema text;

-- 2. Tabla de antecedentes (N antecedentes por oficio)
CREATE TABLE IF NOT EXISTS oficio_antecedentes (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  oficio_id             uuid NOT NULL REFERENCES oficios(id) ON DELETE CASCADE,
  antecedente_oficio_id uuid REFERENCES oficios(id) ON DELETE SET NULL,  -- nullable: ref externa
  ref_texto             text NOT NULL,                                     -- texto libre siempre presente
  created_at            timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oficio_ant_oficio  ON oficio_antecedentes(oficio_id);
CREATE INDEX IF NOT EXISTS idx_oficio_ant_linked  ON oficio_antecedentes(antecedente_oficio_id);

ALTER TABLE oficio_antecedentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace read antecedentes"  ON oficio_antecedentes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM oficios o JOIN workspace_members wm ON wm.workspace_id = o.workspace_id
    WHERE o.id = oficio_antecedentes.oficio_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "workspace write antecedentes" ON oficio_antecedentes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM oficios o JOIN workspace_members wm ON wm.workspace_id = o.workspace_id
    WHERE o.id = oficio_antecedentes.oficio_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "workspace delete antecedentes" ON oficio_antecedentes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM oficios o JOIN workspace_members wm ON wm.workspace_id = o.workspace_id
    WHERE o.id = oficio_antecedentes.oficio_id AND wm.user_id = auth.uid()
  ));

-- 3. Tabla de anexos por oficio (links o archivos)
CREATE TABLE IF NOT EXISTS oficio_anexos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  oficio_id    uuid NOT NULL REFERENCES oficios(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tipo         text NOT NULL CHECK (tipo IN ('archivo', 'link')),
  nombre       text NOT NULL,
  url          text,          -- para links
  storage_key  text,          -- para archivos en R2
  file_name    text,
  file_size    bigint,
  created_at   timestamptz DEFAULT now(),
  created_by   uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_oficio_anexos_oficio ON oficio_anexos(oficio_id);
CREATE INDEX IF NOT EXISTS idx_oficio_anexos_ws     ON oficio_anexos(workspace_id);

ALTER TABLE oficio_anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace read anexos"  ON oficio_anexos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = oficio_anexos.workspace_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "workspace write anexos" ON oficio_anexos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = oficio_anexos.workspace_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "workspace delete anexos" ON oficio_anexos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = oficio_anexos.workspace_id AND wm.user_id = auth.uid()
  ));
