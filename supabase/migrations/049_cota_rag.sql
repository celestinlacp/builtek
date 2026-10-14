-- Cota Capa 3: historial de consultas RAG
CREATE TABLE IF NOT EXISTS cota_queries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id)  ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  sources       JSONB,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cota_queries_project_idx ON cota_queries(project_id);
CREATE INDEX IF NOT EXISTS cota_queries_created_idx ON cota_queries(created_at DESC);

ALTER TABLE cota_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can select cota_queries"
  ON cota_queries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = cota_queries.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace members can insert cota_queries"
  ON cota_queries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = cota_queries.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );
