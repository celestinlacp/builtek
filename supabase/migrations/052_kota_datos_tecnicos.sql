-- 1. Agregar columna kota_data en projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS kota_data JSONB DEFAULT '{}';

-- 2. Migrar datos existentes: pasar cota_brief → kota_data.notas
UPDATE projects
SET kota_data = jsonb_build_object(
  'campos_comunes',    '{}'::jsonb,
  'campos_disciplina', '{}'::jsonb,
  'notas',             COALESCE(cota_brief, ''),
  'ultima_actualizacion', NOW()::text,
  'actualizado_por',   'migration'
)
WHERE cota_brief IS NOT NULL AND cota_brief != '';

-- 3. No eliminar cota_brief aún (mantener como fallback durante transición)
-- Se elimina en una migración posterior una vez validado en producción.
