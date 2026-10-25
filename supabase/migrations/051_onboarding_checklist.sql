CREATE TABLE onboarding_checklist (
  workspace_id     UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  ai_agent_tried   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read own checklist"
  ON onboarding_checklist FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can upsert own checklist"
  ON onboarding_checklist FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can update own checklist"
  ON onboarding_checklist FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
