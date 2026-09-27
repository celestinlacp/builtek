-- =============================================
-- Builtek — Migración 024: specialty_code en design_specs
-- Vincula specs con la nomenclatura de especialidad del workspace
-- Ejecutar en Supabase SQL Editor
-- =============================================

ALTER TABLE design_specs ADD COLUMN IF NOT EXISTS specialty_code text;

CREATE INDEX IF NOT EXISTS design_specs_specialty_code_idx ON design_specs(specialty_code);
