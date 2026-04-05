-- ============================================================
-- Migration 002: Evidence integrity + delivery tracking + timeline
-- Run AFTER migration-001-consent.sql
-- ============================================================

-- Evidence integrity: SHA-256 hash of file at upload time
-- Proves photo was not tampered with after submission
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS sha256_hash text;

-- Delivery tracking: Resend webhook updates
ALTER TABLE cases ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending'
  CHECK (delivery_status IN ('pending', 'delivered', 'bounced', 'complained'));
ALTER TABLE cases ADD COLUMN IF NOT EXISTS delivery_updated_at timestamptz;

-- Case timeline: every significant event stored for the tenant
CREATE TABLE IF NOT EXISTS case_events (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id    uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'case.created',
    'photo.uploaded',
    'photo.analysed',
    'voice.transcribed',
    'voice.translated',
    'letter.generated',
    'letter.sent',
    'letter.delivered',
    'letter.bounced',
    'deadline.started',
    'deadline.passed',
    'case.escalated',
    'complaint.generated',
    'case.resolved',
    'evidence.exported'
  )),
  detail     jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_created_at ON case_events(created_at);

-- RLS: tenants can only see events for their own cases
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY case_events_own_data ON case_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_events.case_id
      AND cases.user_id::text = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_events.case_id
      AND cases.user_id::text = current_setting('app.current_user_id', true)
    )
  );
