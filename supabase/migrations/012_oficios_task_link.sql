-- =============================================
-- 012 — Vincular oficios a tareas
-- =============================================

-- Campo opcional: un oficio puede estar vinculado a una tarea específica
alter table oficios add column if not exists task_id uuid references tasks(id) on delete set null;

-- Índice para queries desde el slide-over de tarea
create index if not exists oficios_task_id_idx on oficios(task_id);
