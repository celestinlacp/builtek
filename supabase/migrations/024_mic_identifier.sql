-- =============================================
-- Builtek — Migración 024: mic_identifier en projects
-- El código IDENTIFICADOR vive en el proyecto — es permanente, nunca se recalcula.
-- Formato: '0001' para proyectos raíz, '0017.01' para subproyectos.
-- Ejecutar en Supabase SQL Editor
-- =============================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS mic_identifier VARCHAR(8);

-- Índice para búsquedas rápidas por identificador
CREATE INDEX IF NOT EXISTS projects_mic_identifier_idx ON projects(workspace_id, mic_identifier);

-- Backfill: asignar identificadores a los proyectos existentes de Frente 12
-- (ordenados alfabéticamente, igual que syncIdentificadoresFromProjects)
-- Los números se asignan una sola vez; si se borra un proyecto, el número queda retirado.

DO $$
DECLARE
  ws_id UUID := '98572f46-87db-4ea6-93bb-ab8e64be9c03'; -- workspace Frente 12
  r RECORD;
  counter INT := 1;
  parent_num INT;
  sub_count INT;
BEGIN
  -- Proyectos raíz en orden alfabético
  FOR r IN
    SELECT id FROM projects
    WHERE workspace_id = ws_id
      AND status = 'active'
      AND parent_project_id IS NULL
    ORDER BY name ASC
  LOOP
    UPDATE projects
    SET mic_identifier = LPAD(counter::TEXT, 4, '0')
    WHERE id = r.id;
    counter := counter + 1;
  END LOOP;

  -- Subproyectos: heredan el número del padre + .01, .02...
  FOR r IN
    SELECT sp.id, sp.parent_project_id
    FROM projects sp
    WHERE sp.workspace_id = ws_id
      AND sp.status = 'active'
      AND sp.parent_project_id IS NOT NULL
    ORDER BY sp.name ASC
  LOOP
    SELECT CAST(mic_identifier AS INT) INTO parent_num
    FROM projects WHERE id = r.parent_project_id;

    SELECT COUNT(*) + 1 INTO sub_count
    FROM projects
    WHERE parent_project_id = r.parent_project_id
      AND mic_identifier IS NOT NULL
      AND id != r.id;

    UPDATE projects
    SET mic_identifier = LPAD(parent_num::TEXT, 4, '0') || '.' || LPAD(sub_count::TEXT, 2, '0')
    WHERE id = r.id;
  END LOOP;
END $$;
