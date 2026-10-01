-- Trazabilidad: link de entrega por oficio
ALTER TABLE oficios ADD COLUMN IF NOT EXISTS link_entrega text;
