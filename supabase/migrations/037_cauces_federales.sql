-- Agrega campo cauces_federales a proyectos
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS cauces_federales boolean NOT NULL DEFAULT false;
