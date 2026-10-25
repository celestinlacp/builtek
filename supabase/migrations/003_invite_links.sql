-- 003_invite_links.sql
-- Personalized invitation links with extended trial periods

CREATE TABLE invite_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token             TEXT UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  recipient_name    TEXT NOT NULL,
  recipient_company TEXT,
  trial_days        INTEGER NOT NULL DEFAULT 30,
  created_by        UUID REFERENCES profiles(id),
  status            TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'used', 'expired')),
  opened_at         TIMESTAMPTZ,
  open_count        INTEGER DEFAULT 0,
  used_by_workspace UUID REFERENCES workspaces(id),
  used_at           TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ DEFAULT now() + INTERVAL '90 days',
  created_at        TIMESTAMPTZ DEFAULT now(),
  email_invite_day7_sent TIMESTAMPTZ
);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
-- Sin policy pública — acceso solo via service_role key desde endpoints de super-admin
