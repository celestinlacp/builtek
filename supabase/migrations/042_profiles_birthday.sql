-- Add birthday to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;
