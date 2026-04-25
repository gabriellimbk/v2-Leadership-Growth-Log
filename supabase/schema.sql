-- Run this in Supabase Dashboard → SQL Editor

-- Form configuration (one row, teacher-editable)
CREATE TABLE IF NOT EXISTS form_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student submissions (one row per student, keyed by Firebase UID)
CREATE TABLE IF NOT EXISTS submissions (
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

CREATE INDEX IF NOT EXISTS submissions_student_uid_idx ON submissions(student_uid);

-- Row Level Security
ALTER TABLE form_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- form_config: anyone can read; only authenticated Supabase users (teachers) can write
CREATE POLICY "config_read_all"   ON form_config FOR SELECT USING (true);
CREATE POLICY "config_write_auth" ON form_config FOR ALL    USING (auth.role() = 'authenticated');

-- submissions: open read/write (student identity enforced via Firebase Auth in the app)
CREATE POLICY "submissions_read_all"   ON submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert_all" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update_all" ON submissions FOR UPDATE USING (true);

-- Teacher accounts: add teacher emails here so OTP login works
-- In Supabase Dashboard → Authentication → Users → Invite user (enter teacher email)
-- Teachers must be pre-created; shouldCreateUser: false in TeacherLogin prevents self-registration
