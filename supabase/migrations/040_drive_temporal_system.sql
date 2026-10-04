-- Builtek — Migración 040
-- Drive: carpeta sistema "Archivos Temporales" con acceso restringido
-- Tasks: campo completed_at para trigger de auto-borrado a los 10 días

-- ── 1. is_system en drive_folders ─────────────────────────────────────────────
ALTER TABLE drive_folders
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- ── 2. RLS: carpetas sistema solo visibles para manager+ ──────────────────────
DROP POLICY IF EXISTS "drive_folders_select" ON drive_folders;
CREATE POLICY "drive_folders_select" ON drive_folders
  FOR SELECT USING (
    is_workspace_member(workspace_id) AND (
      NOT is_system
      OR get_workspace_role(workspace_id) IN ('owner', 'admin', 'manager')
    )
  );

-- ── 3. completed_at en tasks ───────────────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Trigger: al marcar tarea como 'done', registra el timestamp
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at = now();
  END IF;
  -- Si se reabre la tarea, limpiar completed_at
  IF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_completed_at_trigger ON tasks;
CREATE TRIGGER tasks_completed_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- Backfill: tareas ya marcadas como done sin completed_at
UPDATE tasks SET completed_at = updated_at WHERE status = 'done' AND completed_at IS NULL;

-- ── 4. Marcar carpeta temporal existente como is_system ────────────────────────
-- (se ejecuta si ya existe la carpeta creada por el código)
UPDATE drive_folders
SET is_system = true, name = 'Archivos Temporales'
WHERE LOWER(name) = 'temporal' AND parent_folder_id IS NULL;
