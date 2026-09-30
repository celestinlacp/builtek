-- Soporte para imágenes en comentarios de tareas
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url text;
