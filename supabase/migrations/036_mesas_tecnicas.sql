-- ── Migración 036: Mesas Técnicas + campos adicionales en oficios ─────────────

-- 1. Tabla mesas_tecnicas (catálogo BD Oficios)
CREATE TABLE IF NOT EXISTS mesas_tecnicas (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  nombre         text NOT NULL,   -- nombre literal: "Mesa de Arquitectura e Imagen Urbana"
  codigo         text,            -- código corto: "MESA-ARQ"
  especialidad   text,            -- código de mic_nomenclatures (ARQ, EST, CIV…)
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mesas_tecnicas_ws ON mesas_tecnicas(workspace_id);

ALTER TABLE mesas_tecnicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace read mesas"   ON mesas_tecnicas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = mesas_tecnicas.workspace_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "workspace write mesas"  ON mesas_tecnicas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = mesas_tecnicas.workspace_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "workspace update mesas" ON mesas_tecnicas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = mesas_tecnicas.workspace_id AND wm.user_id = auth.uid()
  ));
CREATE POLICY "workspace delete mesas" ON mesas_tecnicas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = mesas_tecnicas.workspace_id AND wm.user_id = auth.uid()
  ));

-- 2. Campos adicionales en oficios
ALTER TABLE oficios ADD COLUMN IF NOT EXISTS mesa_id          uuid REFERENCES mesas_tecnicas(id) ON DELETE SET NULL;
ALTER TABLE oficios ADD COLUMN IF NOT EXISTS copia_a          text;   -- "Con copia a: ..." extraído por AI
ALTER TABLE oficios ADD COLUMN IF NOT EXISTS para_conocimiento text;  -- "Para efectos y conocimiento de: ..."

CREATE INDEX IF NOT EXISTS idx_oficios_mesa ON oficios(mesa_id);
