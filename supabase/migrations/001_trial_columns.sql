-- 001_trial_columns.sql
-- Adds trial tracking columns and email flag columns to workspaces table
-- Also adds last_seen_at to users/profiles table for super-admin panel

ALTER TABLE workspaces
  ADD COLUMN trial_ends_at    TIMESTAMPTZ,
  ADD COLUMN trial_plan       TEXT,
  ADD COLUMN intended_plan    TEXT,
  ADD COLUMN status           TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trial_expired', 'suspended')),
  ADD COLUMN email_day10_sent TIMESTAMPTZ,
  ADD COLUMN email_day13_sent TIMESTAMPTZ,
  ADD COLUMN email_day14_sent TIMESTAMPTZ,
  ADD COLUMN email_day21_sent TIMESTAMPTZ;

CREATE INDEX idx_workspaces_trial_ends_at
  ON workspaces (trial_ends_at)
  WHERE status = 'active';

-- Add last_seen_at to profiles table (used in super-admin panel and middleware)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
