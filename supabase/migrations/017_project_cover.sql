-- Foto de portada por proyecto
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url text;
