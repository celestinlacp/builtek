-- =============================================
-- Builtek — Migración 020: Cadenamiento de proyectos
-- Rango de cadenamiento (km + metro) donde se ubica el proyecto
-- Almacenado en metros totales: 208+800 → 208800
-- Ejecutar en Supabase SQL Editor
-- =============================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS chainage_start integer,
  ADD COLUMN IF NOT EXISTS chainage_end   integer;

-- Restricción: si hay rango, el fin debe ser mayor al inicio
ALTER TABLE projects
  ADD CONSTRAINT chainage_range_valid
  CHECK (chainage_end IS NULL OR chainage_start IS NULL OR chainage_end >= chainage_start);
