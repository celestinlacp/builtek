-- =============================================
-- Builtek — Migración 019: Subproyectos
-- Permite anidar proyectos dentro de proyectos (máx 2 niveles: proyecto → subproyecto)
-- Ejecutar en Supabase SQL Editor
-- =============================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS parent_project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS projects_parent_idx ON projects(parent_project_id);

-- Los proyectos raíz son los que tienen parent_project_id IS NULL
-- Los subproyectos heredan el workspace_id de su padre (lo maneja la app)
