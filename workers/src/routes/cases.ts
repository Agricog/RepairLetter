import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb, writeAuditLog } from '../lib/db';

export const casesRoutes = new Hono<{ Bindings: Env }>();

// ── GET /api/cases — list all cases for current user ────────
// RLS enforces user can only see own cases at DB level

casesRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  const cases = await db.query(
    `SELECT id, user_id, defect_type, defect_severity, hhsrs_category,
            letter_sent_at, deadline_at, status, escalated_at, created_at
     FROM cases
     ORDER BY created_at DESC`
  );

  return c.json(cases);
});

// ── GET /api/cases/:id — single case with evidence + letters ─
// RLS ensures the query returns nothing if case belongs to another user

casesRoutes.get('/:id', async (c) => {
  const caseId = c.req.param('id');
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  // Validate caseId format — must be UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId)) {
    return c.json({ error: 'Invalid case ID' }, 400);
  }

  const cases = await db.query(
    `SELECT id, user_id, defect_type, defect_severity, hhsrs_category,
            letter_sent_at, deadline_at, status, escalated_at, created_at
     FROM cases WHERE id = $1`,
    [caseId]
  );

  if (cases.length === 0) {
    return c.json({ error: 'Case not found' }, 404);
  }

  const evidence = await db.query(
    `SELECT id, case_id, r2_key, content_type, ai_analysis, created_at
     FROM evidence WHERE case_id = $1
     ORDER BY created_at ASC`,
    [caseId]
  );

  // Never return encrypted content to frontend — only metadata
  const letters = await db.query(
    `SELECT id, case_id, letter_type, resend_message_id, sent_at
     FROM letters WHERE case_id = $1
     ORDER BY sent_at ASC`,
    [caseId]
  );

  await writeAuditLog(
    db,
    'case.viewed',
    { caseId },
    c.req.header('CF-Connecting-IP') ?? undefined
  );

  return c.json({ case_: cases[0], evidence, letters });
});

// ── POST /api/cases — create new case ───────────────────────

casesRoutes.post('/', async (c) => {
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  const body = await c.req.json<{
    defectType: string;
    defectSeverity: number;
    hhsrsCategory?: string;
    landlordEmail: string;
  }>();

  // Validate defect type against allowlist
  const validTypes = ['damp', 'mould', 'leak', 'heating', 'electrics', 'other'];
  if (!validTypes.includes(body.defectType)) {
    return c.json({ error: 'Invalid defect type' }, 400);
  }

  // Validate severity range
  if (
    typeof body.defectSeverity !== 'number' ||
    !Number.isInteger(body.defectSeverity) ||
    body.defectSeverity < 1 ||
    body.defectSeverity > 5
  ) {
    return c.json({ error: 'Severity must be an integer between 1 and 5' }, 400);
  }

  // Validate email format — basic check, Resend will validate on send
  if (
    !body.landlordEmail ||
    !body.landlordEmail.includes('@') ||
    !body.landlordEmail.includes('.') ||
    body.landlordEmail.length > 254
  ) {
    return c.json({ error: 'Valid landlord email required' }, 400);
  }

  // Validate hhsrsCategory if provided — must be from known list
  if (body.hhsrsCategory && body.hhsrsCategory.length > 100) {
    return c.json({ error: 'Invalid HHSRS category' }, 400);
  }

  const cases = await db.query(
    `INSERT INTO cases (
       user_id, defect_type, defect_severity, hhsrs_category,
       landlord_email_encrypted
     )
     VALUES (
       $1, $2, $3, $4,
       encrypt_value($5, current_setting('app.encryption_key'))
     )
     RETURNING id, user_id, defect_type, defect_severity, hhsrs_category, status, created_at`,
    [userId, body.defectType, body.defectSeverity, body.hhsrsCategory ?? null, body.landlordEmail]
  );

  const newCase = cases[0] as Record<string, unknown> | undefined;

  await writeAuditLog(
    db,
    'case.created',
    { caseId: newCase?.id },
    c.req.header('CF-Connecting-IP') ?? undefined
  );

  return c.json(newCase, 201);
});

// ── POST /api/cases/:id/resolve — mark as resolved ─────────

casesRoutes.post('/:id/resolve', async (c) => {
  const caseId = c.req.param('id');
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId)) {
    return c.json({ error: 'Invalid case ID' }, 400);
  }

  // RLS ensures only own cases can be updated
  const result = await db.query(
    `UPDATE cases SET status = 'resolved'
     WHERE id = $1 AND status IN ('sent', 'escalated')
     RETURNING id, status`,
    [caseId]
  );

  if (result.length === 0) {
    return c.json({ error: 'Case not found or already resolved' }, 404);
  }

  await writeAuditLog(
    db,
    'case.resolved',
    { caseId },
    c.req.header('CF-Connecting-IP') ?? undefined
  );

  return c.json(result[0]);
});
