-- =============================================
-- Builtek — Migración 053: Tipos de Estructura
-- =============================================

CREATE TABLE IF NOT EXISTS structure_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  category     TEXT,
  icon         TEXT,
  kota_schema  JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, code)
);

CREATE INDEX IF NOT EXISTS structure_types_workspace_idx ON structure_types(workspace_id);
CREATE INDEX IF NOT EXISTS structure_types_code_idx      ON structure_types(code);

ALTER TABLE structure_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "structure_types_select" ON structure_types
  FOR SELECT USING (
    workspace_id IS NULL
    OR is_workspace_member(workspace_id)
  );

CREATE POLICY "structure_types_insert" ON structure_types
  FOR INSERT WITH CHECK (
    workspace_id IS NOT NULL
    AND get_workspace_role(workspace_id) = 'owner'
  );

CREATE POLICY "structure_types_update" ON structure_types
  FOR UPDATE USING (
    workspace_id IS NULL
    OR get_workspace_role(workspace_id) = 'owner'
  );

CREATE POLICY "structure_types_delete" ON structure_types
  FOR DELETE USING (
    workspace_id IS NOT NULL
    AND get_workspace_role(workspace_id) = 'owner'
  );

-- Seed: 16 tipos globales
INSERT INTO structure_types (workspace_id, code, name, category, icon) VALUES
  (NULL, 'EST',  'Estación',                 'Estación',  '🏛️'),
  (NULL, 'PF',   'Puente Ferroviario',        'Puente',    '🌉'),
  (NULL, 'PUE',  'Puente Vehicular',          'Puente',    '🚗'),
  (NULL, 'PIF',  'Paso Inferior Ferroviario', 'Paso',      '🚇'),
  (NULL, 'PSF',  'Paso Superior Ferroviario', 'Paso',      '🌁'),
  (NULL, 'PIP',  'Puente Peatonal',           'Puente',    '🚶'),
  (NULL, 'VIAD', 'Viaducto',                 'Viaducto',  '🌉'),
  (NULL, 'TUN',  'Túnel',                    'Túnel',     '🕳️'),
  (NULL, 'MUR',  'Muro',                     'Muro',      '🧱'),
  (NULL, 'CAN',  'Cruce a Nivel',            'Cruce',     '🚂'),
  (NULL, 'ODT',  'Drenaje Transversal',       'Drenaje',   '💧'),
  (NULL, 'VIAF', 'Vía Ferrea',               'Vía',       '🛤️'),
  (NULL, 'VIAL', 'Vialidad',                 'Vialidad',  '🛣️'),
  (NULL, 'CUN',  'Cuneta',                   'Drenaje',   '🏞️'),
  (NULL, 'PAR',  'Parapeto',                 'Muro',      '🛡️'),
  (NULL, 'MESA', 'Mesa',                     'Estructura','🪨')
ON CONFLICT (workspace_id, code) DO NOTHING;

-- Columna en projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS structure_type_id UUID REFERENCES structure_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_structure_type_idx ON projects(structure_type_id);

-- Backfill automático por nombre
UPDATE projects p
SET structure_type_id = st.id
FROM structure_types st
WHERE st.workspace_id IS NULL
  AND p.project_type  = st.name
  AND p.structure_type_id IS NULL;
