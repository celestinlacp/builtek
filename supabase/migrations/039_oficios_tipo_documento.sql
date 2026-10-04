-- Builtek — Migración 039
-- Agrega campo tipo_documento a oficios: 'oficio' | 'tarjeta'

ALTER TABLE oficios
  ADD COLUMN IF NOT EXISTS tipo_documento text
    NOT NULL DEFAULT 'oficio'
    CHECK (tipo_documento IN ('oficio', 'tarjeta'));
