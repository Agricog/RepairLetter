-- ============================================================
-- RentShield Database Schema
-- Neon PostgreSQL · Row-Level Security · pgcrypto
-- Run once against your Neon database before first deploy.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id                   uuid PRIMARY KEY,  -- Clerk user_id
  email_encrypted      text NOT NULL,     -- pgcrypto encrypted
  language_preference  text DEFAULT 'en', -- ISO 639-1
  stripe_customer_id   text,              -- Encrypted at rest
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_own_data ON users
  FOR ALL
  USING (id::text = current_setting('app.current_user_id', true))
  WITH CHECK (id::text = current_setting('app.current_user_id', true));


-- ============================================================
-- TABLE: cases
-- ============================================================
CREATE TABLE cases (
  id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  defect_type              text NOT NULL CHECK (defect_type IN ('damp','mould','leak','heating','electrics','other')),
  defect_severity          int NOT NULL CHECK (defect_severity BETWEEN 1 AND 5),
  hhsrs_category           text,
  landlord_email_encrypted text NOT NULL,
  letter_sent_at           timestamptz,
  deadline_at              timestamptz,
  status                   text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','escalated','resolved')),
  escalated_at             timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_deadline ON cases(deadline_at) WHERE status = 'sent';

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY cases_own_data ON cases
  FOR ALL
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));


-- ============================================================
-- TABLE: evidence
-- ============================================================
CREATE TABLE evidence (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id      uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  r2_key       text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','audio/webm','application/pdf')),
  ai_analysis  jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()  -- Immutable — legal evidence timestamp
);

CREATE INDEX idx_evidence_case_id ON evidence(case_id);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_own_data ON evidence
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = evidence.case_id
      AND cases.user_id::text = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = evidence.case_id
      AND cases.user_id::text = current_setting('app.current_user_id', true)
    )
  );


-- ============================================================
-- TABLE: letters
-- ============================================================
CREATE TABLE letters (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id           uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  letter_type       text NOT NULL CHECK (letter_type IN ('initial_demand','escalation','council_complaint')),
  content_encrypted text NOT NULL,
  sent_to_encrypted text NOT NULL,
  resend_message_id text,
  sent_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_letters_case_id ON letters(case_id);

ALTER TABLE letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY letters_own_data ON letters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = letters.case_id
      AND cases.user_id::text = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = letters.case_id
      AND cases.user_id::text = current_setting('app.current_user_id', true)
    )
  );


-- ============================================================
-- TABLE: audit_log (append-only)
-- ============================================================
CREATE TABLE audit_log (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    text,                -- Nullable for system events. Text not UUID to accept Clerk IDs.
  action     text NOT NULL,
  metadata   jsonb,
  ip_hash    text,               -- SHA-256 hashed, never plain
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);

-- No RLS for regular users — accessed via service role only.
-- INSERT only — no UPDATE or DELETE permitted.
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- Revoke UPDATE and DELETE from the application role
-- Run this after creating your app database role:
-- REVOKE UPDATE, DELETE ON audit_log FROM app_role;


-- ============================================================
-- HELPER: Encrypt/decrypt functions
-- Key passed as parameter, never hardcoded.
-- ============================================================

CREATE OR REPLACE FUNCTION encrypt_value(plain_text text, key text)
RETURNS text AS $$
  SELECT encode(pgp_sym_encrypt(plain_text, key), 'base64');
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION decrypt_value(encrypted_text text, key text)
RETURNS text AS $$
  SELECT pgp_sym_decrypt(decode(encrypted_text, 'base64'), key);
$$ LANGUAGE sql IMMUTABLE;


-- ============================================================
-- TRIGGER: Auto-set updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- TRIGGER: Auto-set deadline_at when letter_sent_at is set
-- ============================================================

CREATE OR REPLACE FUNCTION set_case_deadline()
RETURNS trigger AS $$
BEGIN
  IF NEW.letter_sent_at IS NOT NULL AND OLD.letter_sent_at IS NULL THEN
    NEW.deadline_at = NEW.letter_sent_at + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cases_deadline
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION set_case_deadline();
