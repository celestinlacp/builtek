-- Agregar 'vigente' al enum de estados de oficios
ALTER TABLE oficios DROP CONSTRAINT IF EXISTS oficios_estado_check;
ALTER TABLE oficios ADD CONSTRAINT oficios_estado_check
  CHECK (estado IN ('pendiente', 'en_atencion', 'respondido', 'archivado', 'vigente'));
