-- Registrar quién generó cada link de compartir proyecto
ALTER TABLE project_shares ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
