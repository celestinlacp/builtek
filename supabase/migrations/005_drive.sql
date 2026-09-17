-- =============================================
-- Builtek — Migración 005: Módulo Drive
-- Carpetas, archivos y links públicos con QR
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- ── CARPETAS ──────────────────────────────────────────────────────────────────
-- parent_folder_id = NULL → carpeta raíz del workspace
CREATE TABLE IF NOT EXISTS drive_folders (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_folder_id  uuid REFERENCES drive_folders(id) ON DELETE CASCADE,
  name              text NOT NULL,
  created_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drive_folders_workspace_idx ON drive_folders(workspace_id);
CREATE INDEX IF NOT EXISTS drive_folders_parent_idx    ON drive_folders(parent_folder_id);

-- ── ARCHIVOS DEL DRIVE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drive_files (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id     uuid REFERENCES drive_folders(id) ON DELETE SET NULL,  -- NULL = raíz del workspace
  name          text NOT NULL,         -- nombre que muestra el usuario
  file_name     text NOT NULL,         -- nombre original del archivo
  storage_key   text NOT NULL,         -- objeto en R2
  file_type     text NOT NULL DEFAULT 'other'
                  CHECK (file_type IN ('pdf','dwg','dxf','xlsx','docx','img','other')),
  file_size     bigint NOT NULL DEFAULT 0,
  uploaded_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drive_files_workspace_idx ON drive_files(workspace_id);
CREATE INDEX IF NOT EXISTS drive_files_folder_idx    ON drive_files(folder_id);

-- ── LINKS PÚBLICOS (para compartir con terceros) ──────────────────────────────
CREATE TABLE IF NOT EXISTS drive_shares (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  file_id       uuid NOT NULL REFERENCES drive_files(id) ON DELETE CASCADE,
  token         uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4(),  -- va en la URL pública
  label         text,                 -- nombre descriptivo del link (opcional)
  expires_at    timestamptz,          -- NULL = sin expiración
  is_active     boolean NOT NULL DEFAULT true,
  access_count  integer NOT NULL DEFAULT 0,
  last_accessed timestamptz,
  created_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drive_shares_token_idx      ON drive_shares(token);
CREATE INDEX IF NOT EXISTS drive_shares_workspace_idx  ON drive_shares(workspace_id);
CREATE INDEX IF NOT EXISTS drive_shares_file_idx       ON drive_shares(file_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_files   ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_shares  ENABLE ROW LEVEL SECURITY;

-- drive_folders: todos los miembros ven; engineers+ crean; admins borran
CREATE POLICY "drive_folders_select" ON drive_folders FOR SELECT USING (
  is_workspace_member(workspace_id)
);
CREATE POLICY "drive_folders_insert" ON drive_folders FOR INSERT WITH CHECK (
  get_workspace_role(workspace_id) IN ('owner','admin','manager','engineer')
);
CREATE POLICY "drive_folders_update" ON drive_folders FOR UPDATE USING (
  get_workspace_role(workspace_id) IN ('owner','admin','manager')
);
CREATE POLICY "drive_folders_delete" ON drive_folders FOR DELETE USING (
  get_workspace_role(workspace_id) IN ('owner','admin')
);

-- drive_files: todos los miembros ven; engineers+ suben; admins borran
CREATE POLICY "drive_files_select" ON drive_files FOR SELECT USING (
  is_workspace_member(workspace_id)
);
CREATE POLICY "drive_files_insert" ON drive_files FOR INSERT WITH CHECK (
  get_workspace_role(workspace_id) IN ('owner','admin','manager','engineer')
);
CREATE POLICY "drive_files_update" ON drive_files FOR UPDATE USING (
  get_workspace_role(workspace_id) IN ('owner','admin','manager')
);
CREATE POLICY "drive_files_delete" ON drive_files FOR DELETE USING (
  get_workspace_role(workspace_id) IN ('owner','admin')
);

-- drive_shares: miembros ven; managers+ crean y revocan
CREATE POLICY "drive_shares_select" ON drive_shares FOR SELECT USING (
  is_workspace_member(workspace_id)
);
CREATE POLICY "drive_shares_insert" ON drive_shares FOR INSERT WITH CHECK (
  get_workspace_role(workspace_id) IN ('owner','admin','manager')
);
CREATE POLICY "drive_shares_update" ON drive_shares FOR UPDATE USING (
  get_workspace_role(workspace_id) IN ('owner','admin','manager')
);
CREATE POLICY "drive_shares_delete" ON drive_shares FOR DELETE USING (
  get_workspace_role(workspace_id) IN ('owner','admin')
);
