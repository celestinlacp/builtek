-- document_shares: links públicos por documento con vencimiento de 24h
CREATE TABLE document_shares (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  document_id   UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  doc_key       TEXT,
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_by    UUID        REFERENCES auth.users(id),
  access_count  INT         NOT NULL DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON document_shares(token);
CREATE INDEX ON document_shares(document_id);
CREATE INDEX ON document_shares(workspace_id);

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_manage_document_shares" ON document_shares
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
