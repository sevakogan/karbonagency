-- Baseline Project - Supabase Schema

-- Contact form submissions
CREATE TABLE IF NOT EXISTS karbon_contact_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
