-- Migración 048 — Brief técnico de proyecto para Cota
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cota_brief TEXT;
