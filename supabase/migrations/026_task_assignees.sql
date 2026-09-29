-- Tabla de múltiples asignados por tarea (max 2 por UI, sin límite en DB)
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- Migrar assignee_id existente a la nueva tabla
INSERT INTO task_assignees (task_id, user_id)
SELECT id, assignee_id FROM tasks WHERE assignee_id IS NOT NULL
ON CONFLICT DO NOTHING;
