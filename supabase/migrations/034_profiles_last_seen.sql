-- Track last app activity per user (more accurate than auth.users.last_sign_in_at)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
