-- =============================================
-- Builtek — Migración 004: R2 + Documentos Pro
-- Especialidades, permisos, borrado controlado, RAG
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Extensión vectorial para RAG (embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── ESPECIALIDADES ────────────────────────────────────────────────────────────
-- workspace_id = NULL  → especialidad global del sistema
-- workspace_id = uuid  → especialidad custom creada por el workspace
CREATE TABLE IF NOT EXISTS specialties (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  code          text NOT NULL,
  category      text NOT NULL DEFAULT 'tecnico'
                  CHECK (category IN ('tecnico','administrativo','seguridad','otro')),
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Seed: especialidades del sistema (globales, workspace_id = NULL)
INSERT INTO specialties (workspace_id, name, code, category) VALUES
  -- Técnicas
  (NULL, 'Arquitectura',             'ARQ', 'tecnico'),
  (NULL, 'Estructuras',              'EST', 'tecnico'),
  (NULL, 'Hidráulica',               'HID', 'tecnico'),
  (NULL, 'Sanitario',                'SAN', 'tecnico'),
  (NULL, 'Eléctrico',                'ELE', 'tecnico'),
  (NULL, 'Mecánico',                 'MEC', 'tecnico'),
  (NULL, 'Geotecnia',                'GEO', 'tecnico'),
  (NULL, 'Geofísica',                'GFI', 'tecnico'),
  (NULL, 'Topografía',               'TOP', 'tecnico'),
  (NULL, 'Geométrico',               'GEM', 'tecnico'),
  (NULL, 'Señalética',               'SEN', 'tecnico'),
  (NULL, 'Acabados',                 'ACA', 'tecnico'),
  (NULL, 'Carreteras',               'CAR', 'tecnico'),
  (NULL, 'Vialidad',                 'VIA', 'tecnico'),
  (NULL, 'Urbanización',             'URB', 'tecnico'),
  (NULL, 'Paisaje',                  'PAI', 'tecnico'),
  (NULL, 'Instalaciones Especiales', 'INE', 'tecnico'),
  (NULL, 'Seguridad Estructural',    'SE',  'tecnico'),
  -- Administrativos
  (NULL, 'Oficio',                   'OFI', 'administrativo'),
  (NULL, 'Tarjeta',                  'TAR', 'administrativo'),
  (NULL, 'Cuadernillo',              'CUA', 'administrativo'),
  (NULL, 'Contrato',                 'CON', 'administrativo'),
  (NULL, 'Presupuesto',              'PRE', 'administrativo'),
  (NULL, 'Programa de Obra',         'PRG', 'administrativo'),
  (NULL, 'Acta',                     'ACT', 'administrativo'),
  (NULL, 'Memoria de Cálculo',       'MCA', 'administrativo'),
  (NULL, 'Especificación Técnica',   'ESP', 'administrativo'),
  -- Seguridad
  (NULL, 'Seguridad e Higiene',      'SSH', 'seguridad'),
  (NULL, 'Ambiental',                'AMB', 'seguridad'),
  (NULL, 'Protección Civil',         'PC',  'seguridad'),
  -- Otro
  (NULL, 'Licitación',               'LIC', 'otro'),
  (NULL, 'Normativa',                'NOR', 'otro'),
  (NULL, 'Supervisión',              'SUP', 'otro')
ON CONFLICT DO NOTHING;

-- ── AMPLIAR TABLA documents ───────────────────────────────────────────────────
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS workspace_id      uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS specialty_id      uuid REFERENCES specialties(id) ON DELETE SET NULL,
  -- Títulos (3 niveles)
  ADD COLUMN IF NOT EXISTS file_name         text,        -- nombre original del archivo (auto)
  ADD COLUMN IF NOT EXISTS display_name      text,        -- nombre que pone el usuario (opcional)
  ADD COLUMN IF NOT EXISTS plan_number       text,        -- no. de plano (opcional)
  -- Archivo
  ADD COLUMN IF NOT EXISTS file_size         bigint,      -- tamaño en bytes
  ADD COLUMN IF NOT EXISTS storage_key       text,        -- objeto en R2: ws/proj/specialty/uuid.ext
  -- Fechas
  ADD COLUMN IF NOT EXISTS emission_date     date,        -- fecha de emisión del documento (opcional)
  -- Control de ciclo de vida
  ADD COLUMN IF NOT EXISTS doc_status        text NOT NULL DEFAULT 'active'
                              CHECK (doc_status IN ('active','pending_delete','deleted','archived')),
  -- Pipeline AI
  ADD COLUMN IF NOT EXISTS embedding_status  text NOT NULL DEFAULT 'pending'
                              CHECK (embedding_status IN ('pending','processing','processed','failed')),
  ADD COLUMN IF NOT EXISTS ai_metadata       jsonb DEFAULT '{}'; -- extracción Gemini: título, no. plano, especialidad sugerida

-- Backfill workspace_id desde projects (para registros existentes)
UPDATE documents d
  SET workspace_id = p.workspace_id
  FROM projects p
  WHERE d.project_id = p.id
  AND d.workspace_id IS NULL;

-- ── PERMISOS DE DOCUMENTO POR USUARIO ────────────────────────────────────────
-- project_id = NULL → aplica a todos los proyectos del workspace
CREATE TABLE IF NOT EXISTS document_permissions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_upload    boolean NOT NULL DEFAULT false,
  can_download  boolean NOT NULL DEFAULT false,
  can_approve   boolean NOT NULL DEFAULT false,
  can_manage    boolean NOT NULL DEFAULT false,  -- autorizar borrados + gestionar categorías
  granted_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at    timestamptz NOT NULL DEFAULT now()
);

-- Un registro por usuario por workspace (global) o por proyecto
CREATE UNIQUE INDEX IF NOT EXISTS document_permissions_unique_idx
  ON document_permissions (workspace_id, user_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ── SOLICITUDES DE BORRADO (Two-Person Rule) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS delete_requests (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  requested_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  reason        text,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  review_note   text
);

-- ── CHUNKS PARA RAG (pgvector) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content       text NOT NULL,
  embedding     vector(768),   -- Gemini text-embedding-004 produce 768 dims
  page_number   integer,
  chunk_index   integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE specialties          ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delete_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks      ENABLE ROW LEVEL SECURITY;

-- Specialties: todos ven las globales + las de su workspace
CREATE POLICY "specialties_select" ON specialties FOR SELECT USING (
  workspace_id IS NULL OR is_workspace_member(workspace_id)
);
-- Solo owner/admin pueden crear especialidades custom para su workspace
CREATE POLICY "specialties_insert" ON specialties FOR INSERT WITH CHECK (
  workspace_id IS NOT NULL
  AND get_workspace_role(workspace_id) IN ('owner','admin')
);
CREATE POLICY "specialties_update" ON specialties FOR UPDATE USING (
  workspace_id IS NOT NULL
  AND get_workspace_role(workspace_id) IN ('owner','admin')
);

-- Document permissions: admins gestionan, miembros pueden leer sus permisos
CREATE POLICY "docperm_select" ON document_permissions FOR SELECT USING (
  user_id = auth.uid() OR get_workspace_role(workspace_id) IN ('owner','admin')
);
CREATE POLICY "docperm_insert" ON document_permissions FOR INSERT WITH CHECK (
  get_workspace_role(workspace_id) IN ('owner','admin')
);
CREATE POLICY "docperm_update" ON document_permissions FOR UPDATE USING (
  get_workspace_role(workspace_id) IN ('owner','admin')
);
CREATE POLICY "docperm_delete" ON document_permissions FOR DELETE USING (
  get_workspace_role(workspace_id) IN ('owner','admin')
);

-- Delete requests: miembros del workspace pueden ver y crear; admins aprueban
CREATE POLICY "delreq_select" ON delete_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN projects p ON p.id = d.project_id
    WHERE d.id = document_id
    AND is_workspace_member(p.workspace_id)
  )
);
CREATE POLICY "delreq_insert" ON delete_requests FOR INSERT WITH CHECK (
  requested_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN projects p ON p.id = d.project_id
    WHERE d.id = document_id
    AND is_workspace_member(p.workspace_id)
  )
);
CREATE POLICY "delreq_update" ON delete_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN projects p ON p.id = d.project_id
    WHERE d.id = document_id
    AND get_workspace_role(p.workspace_id) IN ('owner','admin')
  )
);

-- Document chunks: solo el workspace propietario
CREATE POLICY "chunks_select" ON document_chunks FOR SELECT USING (
  is_workspace_member(workspace_id)
);
CREATE POLICY "chunks_insert" ON document_chunks FOR INSERT WITH CHECK (
  is_workspace_member(workspace_id)
);

-- ── FUNCIÓN RAG: búsqueda semántica por workspace ─────────────────────────────
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding  vector(768),
  ws_id            uuid,
  match_count      int DEFAULT 5
)
RETURNS TABLE (
  document_id    uuid,
  document_name  text,
  specialty_code text,
  content        text,
  page_number    integer,
  similarity     float
) AS $$
  SELECT
    dc.document_id,
    d.name           AS document_name,
    s.code           AS specialty_code,
    dc.content,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d  ON d.id  = dc.document_id
  LEFT JOIN specialties s ON s.id = d.specialty_id
  WHERE dc.workspace_id = ws_id
    AND d.doc_status = 'active'
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql SECURITY DEFINER;
