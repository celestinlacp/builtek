-- 002_plan_change_log.sql
-- Audit log for plan changes initiated by admins or super-admin

CREATE TABLE plan_change_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) NOT NULL,
  changed_by    UUID REFERENCES profiles(id) NOT NULL,
  old_plan      TEXT NOT NULL,
  new_plan      TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
