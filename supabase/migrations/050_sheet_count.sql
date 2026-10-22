-- Número de láminas/planos por archivo subido (default 1)
-- Un PDF puede contener múltiples planos; este campo permite corrección manual
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sheet_count INTEGER NOT NULL DEFAULT 1;
