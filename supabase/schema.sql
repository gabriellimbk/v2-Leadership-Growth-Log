-- Run this in Supabase Dashboard → SQL Editor
-- Note: PostgreSQL table names are case-insensitive; LEADERSHIP_GROWTH_LOG = leadership_growth_log

-- Drop and recreate the table you already created so columns are correct
DROP TABLE IF EXISTS leadership_growth_log;

-- Student submissions (one row per student, keyed by Firebase UID)
CREATE TABLE leadership_growth_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_uid TEXT NOT NULL UNIQUE,
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  teacher_id TEXT NOT NULL DEFAULT 'Teacher A',
  answers JSONB NOT NULL DEFAULT '{}',
  comments JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leadership_growth_log_student_uid_idx ON leadership_growth_log(student_uid);

-- Form configuration (one row, editable by teachers)
CREATE TABLE IF NOT EXISTS form_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE leadership_growth_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_config ENABLE ROW LEVEL SECURITY;

-- leadership_growth_log: open read/write (student identity enforced via Firebase Auth in the app)
CREATE POLICY "submissions_read_all"   ON leadership_growth_log FOR SELECT USING (true);
CREATE POLICY "submissions_insert_all" ON leadership_growth_log FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update_all" ON leadership_growth_log FOR UPDATE USING (true);

-- form_config: anyone can read; only authenticated Supabase users (teachers) can write
CREATE POLICY "config_read_all"   ON form_config FOR SELECT USING (true);
CREATE POLICY "config_write_auth" ON form_config FOR ALL    USING (auth.role() = 'authenticated');

-- Pre-register teacher emails here (or use Supabase Dashboard → Authentication → Users → Invite user)
-- Teachers must exist before they can request an OTP login
