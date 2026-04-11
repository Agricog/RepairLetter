import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb, getSystemDb, writeSystemAuditLog } from '../lib/db';

export const usersRoutes = new Hono<{ Bindings: Env }>();

// ── POST /api/users/webhook — Clerk webhook (user.created) ──
// No auth middleware — uses Svix signature verification.

usersRoutes.post('/webhook', async (c) => {
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  const rawBody = await c.req.text();

  // Verify Svix signature
  const isValid = await verifySvixSignature(
    rawBody,
    svixId,
    svixTimestamp,
    svixSignature,
    c.env.CLERK_WEBHOOK_SECRET
  );

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      id: string;
      email_addresses: Array<{ email_address: string }>;
    };
  };

  if (event.type === 'user.created') {
    const userId = event.data.id;
    const email = event.data.email_addresses[0]?.email_address;

    if (!userId || !email) {
      console.error('Clerk webhook: missing user data');
      return c.json({ received: true });
    }

    const db = getSystemDb(c.env);

    // Idempotency — check if user already exists
    const existing = await db.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    );

    if (existing.length === 0) {
      await db.query(
        `INSERT INTO users (id, email_encrypted)
         VALUES ($1, encrypt_value($2, $3))`,
        [userId, email, c.env.DB_ENCRYPTION_KEY]
      );

      await writeSystemAuditLog(c.env, userId, 'user.created');
    }
  }

  if (event.type === 'user.deleted') {
    const userId = event.data.id;
    if (userId) {
      const db = getSystemDb(c.env);

      // CASCADE deletes cases, evidence, letters
      await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
      await writeSystemAuditLog(c.env, userId, 'user.deleted_via_clerk');
    }
  }

  return c.json({ received: true });
});

// ── GET /api/users/consent — check consent status ───────────

usersRoutes.get('/consent', async (c) => {
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  const rows = await db.query<{
    consented_at: string | null;
    consent_data_processing: boolean;
    consent_voice: boolean;
    consent_photos: boolean;
  }>(
    `SELECT consented_at, consent_data_processing, consent_voice, consent_photos
     FROM users WHERE id = $1`,
    [userId]
  );

  const user = rows[0] as Record<string, unknown> | undefined;

  if (!user) {
    return c.json({ consented: false });
  }

  return c.json({
    consented: !!user.consented_at,
    dataProcessing: !!user.consent_data_processing,
    voiceRecording: !!user.consent_voice,
    photoEvidence: !!user.consent_photos,
    consentedAt: user.consented_at ?? null,
  });
});

// ── POST /api/users/consent — record consent ────────────────

usersRoutes.post('/consent', async (c) => {
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  const body = await c.req.json<{
    dataProcessing: boolean;
    voiceRecording: boolean;
    photoEvidence: boolean;
    consentedAt: string;
  }>();

  if (!body.dataProcessing || !body.voiceRecording || !body.photoEvidence) {
    return c.json({ error: 'All consent items must be accepted' }, 400);
  }

  await db.query(
    `UPDATE users SET
       consent_data_processing = $1,
       consent_voice = $2,
       consent_photos = $3,
       consented_at = $4
     WHERE id = $5`,
    [body.dataProcessing, body.voiceRecording, body.photoEvidence, body.consentedAt, userId]
  );

  await writeSystemAuditLog(c.env, userId, 'user.consent_given', {
    dataProcessing: body.dataProcessing,
    voiceRecording: body.voiceRecording,
    photoEvidence: body.photoEvidence,
  });

  return c.json({ success: true });
});

// ── GET /api/users/export — GDPR data export ────────────────

usersRoutes.get('/export', async (c) => {
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  // Gather all user data
  const users = await db.query(
    `SELECT id, language_preference, created_at, consented_at
     FROM users WHERE id = $1`,
    [userId]
  );

  const cases = await db.query(
    `SELECT id, defect_type, defect_severity, hhsrs_category,
            status, created_at, letter_sent_at, deadline_at, escalated_at
     FROM cases ORDER BY created_at DESC`
  );

  const evidence = await db.query(
    `SELECT e.id, e.case_id, e.content_type, e.ai_analysis, e.created_at
     FROM evidence e
     JOIN cases c ON c.id = e.case_id
     ORDER BY e.created_at DESC`
  );

  const letters = await db.query(
    `SELECT l.id, l.case_id, l.letter_type, l.sent_at
     FROM letters l
     JOIN cases c ON c.id = l.case_id
     ORDER BY l.sent_at DESC`
  );

  await writeSystemAuditLog(c.env, userId, 'user.data_exported');

  return c.json({
    exportedAt: new Date().toISOString(),
    user: users[0] ?? null,
    cases,
    evidence,
    letters,
  });
});

// ── DELETE /api/users/account — GDPR right to erasure ───────

usersRoutes.delete('/account', async (c) => {
  const userId = c.get('userId') as string;
  const db = getDb(c.env, userId);

  // Delete all evidence files from R2
  const evidenceRows = await db.query<{ r2_key: string }>(
    `SELECT e.r2_key FROM evidence e
     JOIN cases c ON c.id = e.case_id`
  );

  for (const row of evidenceRows) {
    const r2Key = (row as Record<string, string>).r2_key;
    if (r2Key) {
      try {
        await c.env.EVIDENCE_BUCKET.delete(r2Key);
      } catch {
        // Non-fatal — continue deleting other data
      }
    }
  }

  // CASCADE delete: users → cases → evidence, letters
  await db.query(`DELETE FROM users WHERE id = $1`, [userId]);

  await writeSystemAuditLog(c.env, userId, 'user.account_deleted');

  return c.json({ success: true, message: 'Account and all data deleted.' });
});

// ── Svix Signature Verification ─────────────────────────────

async function verifySvixSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  _secret: string
): Promise<boolean> {
  try {
    // Check timestamp tolerance (5 minutes)
    const age = Math.abs(Date.now() / 1000 - parseInt(svixTimestamp, 10));
    if (age > 300) return false;

    // Svix sends signatures as "v1,<base64-signature>"
    const signatures = svixSignature.split(' ');
    const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
    const encoder = new TextEncoder();

    // The webhook signing secret from Clerk starts with "whsec_"
    // Need to base64-decode the part after the prefix
    const secretBytes = Uint8Array.from(
      atob(_secret.startsWith('whsec_') ? _secret.slice(6) : _secret),
      (ch) => ch.charCodeAt(0)
    );

    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedContent)
    );

    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

    // Check against all provided signatures
    for (const sig of signatures) {
      const [version, sigValue] = sig.split(',');
      if (version === 'v1' && sigValue === expectedSig) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
