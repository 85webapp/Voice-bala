CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^[0-9]{10}$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS account_payload TEXT;

CREATE INDEX IF NOT EXISTS form_submissions_user_submitted_at_idx
  ON form_submissions (user_id, submitted_at DESC);