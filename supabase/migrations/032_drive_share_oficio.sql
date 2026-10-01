-- Vincular links de Drive a oficios de salida
ALTER TABLE drive_shares ADD COLUMN IF NOT EXISTS oficio_id uuid REFERENCES oficios(id) ON DELETE SET NULL;
