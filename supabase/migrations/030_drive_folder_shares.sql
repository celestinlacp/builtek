-- Soporte para compartir carpetas completas desde Drive
-- drive_shares ahora puede apuntar a un archivo (file_id) o a una carpeta (folder_id)

ALTER TABLE drive_shares ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES drive_folders(id) ON DELETE CASCADE;
ALTER TABLE drive_shares ALTER COLUMN file_id DROP NOT NULL;
