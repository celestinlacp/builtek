-- =============================================
-- Builtek — Migración 018: Drive Upload Logs
-- Trazabilidad completa de uploads: quién subió, cuándo, acción
-- ID interno estructurado (ref_code) para dashboard futuro
-- Ejecutar en Supabase SQL Editor
-- =============================================

CREATE SEQUENCE IF NOT EXISTS upload_ref_seq START 1;

CREATE TABLE IF NOT EXISTS drive_upload_logs (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_code      text        UNIQUE NOT NULL DEFAULT ('UP' || LPAD(nextval('upload_ref_seq')::text, 6, '0')),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  file_id       uuid        REFERENCES drive_files(id) ON DELETE SET NULL,
  file_name     text        NOT NULL,
  storage_key   text,
  uploaded_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  action        text        NOT NULL DEFAULT 'upload' CHECK (action IN ('upload', 'replace'))
);

CREATE INDEX IF NOT EXISTS upload_logs_workspace_idx ON drive_upload_logs(workspace_id);
CREATE INDEX IF NOT EXISTS upload_logs_file_idx      ON drive_upload_logs(file_id);
CREATE INDEX IF NOT EXISTS upload_logs_uploader_idx  ON drive_upload_logs(uploaded_by);
CREATE INDEX IF NOT EXISTS upload_logs_at_idx        ON drive_upload_logs(uploaded_at DESC);

ALTER TABLE drive_upload_logs ENABLE ROW LEVEL SECURITY;

-- Todos los miembros pueden ver los logs de su workspace
CREATE POLICY "upload_logs_select" ON drive_upload_logs FOR SELECT USING (
  is_workspace_member(workspace_id)
);
-- Engineers+ pueden insertar (se inserta server-side via service_role, pero por seguridad)
CREATE POLICY "upload_logs_insert" ON drive_upload_logs FOR INSERT WITH CHECK (
  get_workspace_role(workspace_id) IN ('owner','admin','manager','engineer')
);
