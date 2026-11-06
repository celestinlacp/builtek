-- ═══════════════════════════════════════════════════════
-- MIGRACIÓN: bitacora_visual_fase1
-- ═══════════════════════════════════════════════════════

CREATE TABLE photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  name             TEXT,
  captured_at      TIMESTAMPTZ NOT NULL,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by      UUID REFERENCES auth.users(id),
  storage_key_hot  TEXT NOT NULL,
  storage_key_cold TEXT NOT NULL,
  file_size        BIGINT,
  width            INT,
  height           INT,
  is_favorite      BOOLEAN NOT NULL DEFAULT FALSE,
  tier_storage     TEXT NOT NULL DEFAULT 'hot' CHECK (tier_storage IN ('hot','cold')),
  annotations_json JSONB,
  exif_data        JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_workspace_captured ON photos(workspace_id, captured_at DESC);
CREATE INDEX idx_photos_workspace_project  ON photos(workspace_id, project_id);
CREATE INDEX idx_photos_favorite           ON photos(workspace_id, is_favorite) WHERE is_favorite = TRUE;

CREATE TABLE photo_tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#6366f1',
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

CREATE TABLE photo_tag_assignments (
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES photo_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, tag_id)
);

-- RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select" ON photos FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photos_insert" ON photos FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photos_update" ON photos FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photos_delete" ON photos FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "photo_tags_select" ON photo_tags FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photo_tags_insert" ON photo_tags FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));
CREATE POLICY "photo_tags_update" ON photo_tags FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));
CREATE POLICY "photo_tags_delete" ON photo_tags FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

CREATE POLICY "pta_select" ON photo_tag_assignments FOR SELECT
  USING (photo_id IN (
    SELECT id FROM photos WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "pta_insert" ON photo_tag_assignments FOR INSERT
  WITH CHECK (photo_id IN (
    SELECT id FROM photos WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "pta_delete" ON photo_tag_assignments FOR DELETE
  USING (photo_id IN (
    SELECT id FROM photos WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
