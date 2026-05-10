-- MorningKaki — Supabase setup script
-- Run this once in the Supabase SQL Editor

-- Medications
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text DEFAULT '',
  schedule_times time[],
  created_at timestamptz DEFAULT now()
);

-- Reminders (appointments + custom)
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  text text NOT NULL,
  remind_at timestamptz,
  recurring boolean DEFAULT false,
  recurrence_rule text,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Daily mood logs
CREATE TABLE IF NOT EXISTS mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  sticker_type text NOT NULL,  -- 'energetic'|'tired'|'down'|'grateful'|'confused'
  timestamp timestamptz DEFAULT now()
);

-- Voice interaction logs
CREATE TABLE IF NOT EXISTS voice_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id uuid REFERENCES seniors(id) ON DELETE CASCADE,
  transcript text,
  sentiment_label text,
  sentiment_score int,   -- 0-100
  audio_url text,
  timestamp timestamptz DEFAULT now()
);

-- Disable RLS on all tables for hackathon demo
ALTER TABLE seniors DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE voice_logs DISABLE ROW LEVEL SECURITY;

-- Daily Images cache. Rows are kept by date so the app can rotate older
-- generated images when credits run out or today's generation fails.
CREATE TABLE IF NOT EXISTS daily_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme text NOT NULL,
  date_string text NOT NULL,
  image_url text NOT NULL,
  storage_path text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(theme, date_string)
);
ALTER TABLE daily_images ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE daily_images DISABLE ROW LEVEL SECURITY;
