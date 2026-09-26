-- =============================================
-- 016 — Tres correcciones en una migración:
--
-- 1. Fix document_comments.user_id FK → profiles
--    (PostgREST no puede hacer JOIN a profiles
--    si el FK apunta a auth.users)
--
-- 2. Fix/add documents.uploaded_by FK → profiles
--    (mismo problema para el historial de versiones)
--
-- 3. Agregar frente y project_type a projects
--    (clasificación para proyectos AEC como Frente 12)
-- =============================================

-- ── 1. Arreglar document_comments.user_id ────────────────────────────────────

ALTER TABLE document_comments DROP CONSTRAINT IF EXISTS document_comments_user_id_fkey;
ALTER TABLE document_comments
  ADD CONSTRAINT document_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ── 2. Arreglar / agregar documents.uploaded_by ───────────────────────────────

ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by uuid;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;
ALTER TABLE documents
  ADD CONSTRAINT documents_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- ── 3. Frente y tipo de proyecto ─────────────────────────────────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS frente       text,
  ADD COLUMN IF NOT EXISTS project_type text;

-- Índices para filtrado futuro
CREATE INDEX IF NOT EXISTS idx_projects_frente       ON projects(workspace_id, frente);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(workspace_id, project_type);
