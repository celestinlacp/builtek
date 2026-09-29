-- Vincular oficio de respuesta (salida) con el oficio original (entrada)
ALTER TABLE oficios ADD COLUMN IF NOT EXISTS responde_a_id uuid REFERENCES oficios(id) ON DELETE SET NULL;
