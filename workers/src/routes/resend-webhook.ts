import { Hono } from 'hono';
import type { Env } from '../index';
import { getSystemDb, writeSystemAuditLog } from '../lib/db';

export const resendWebhookRoutes = new Hono<{ Bindings: Env }>();

// ── POST /api/resend/webhook ────────────────────────────────
// No auth middleware — uses Resend webhook signature.
// Tracks email delivery status for legal evidence.

resendWebhookRoutes.post('/webhook', async (c) => {
  // Resend sends a webhook-signature header for verification
  const signature = c.req.header('webhook-signature');
  const webhookId = c.req.header('webhook-id');
  const webhookTimestamp = c.req.header('webhook-timestamp');

  if (!signature || !webhookId || !webhookTimestamp) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  // Timestamp tolerance — 5 minutes
  const age = Math.abs(Date.now() / 1000 - parseInt(webhookTimestamp, 10));
  if (age > 300) {
    return c.json({ error: 'Webhook timestamp too old' }, 400);
  }

  const rawBody = await c.req.text();

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      email_id: string;
      to: string[];
      created_at: string;
    };
  };

  const db = getSystemDb(c.env);
  const resendMessageId = event.data.email_id;

  if (!resendMessageId) {
    return c.json({ received: true });
  }

  // Find the case associated with this email
  const letters = await db.query<{ case_id: string; letter_type: string }>(
    `SELECT case_id, letter_type FROM letters WHERE resend_message_id = $1`,
    [resendMessageId]
  );

  if (letters.length === 0) {
    // Not one of our tracked emails — ignore
    return c.json({ received: true });
  }

  const letter = letters[0] as Record<string, string>;
  const caseId = letter.case_id;

  switch (event.type) {
    case 'email.delivered': {
      await db.query(
        `UPDATE cases SET delivery_status = 'delivered', delivery_updated_at = NOW()
         WHERE id = $1 AND delivery_status = 'pending'`,
        [caseId]
      );

      // Timeline event
      await db.query(
        `INSERT INTO case_events (case_id, user_id, event_type, detail)
         SELECT $1, user_id, 'letter.delivered', $2::jsonb
         FROM cases WHERE id = $1`,
        [caseId, JSON.stringify({ resendMessageId, deliveredAt: event.data.created_at })]
      );

      await writeSystemAuditLog(c.env, null, 'email.delivered', { caseId, resendMessageId });
      break;
    }

    case 'email.bounced': {
      await db.query(
        `UPDATE cases SET delivery_status = 'bounced', delivery_updated_at = NOW()
         WHERE id = $1`,
        [caseId]
      );

      // Timeline event
      await db.query(
        `INSERT INTO case_events (case_id, user_id, event_type, detail)
         SELECT $1, user_id, 'letter.bounced', $2::jsonb
         FROM cases WHERE id = $1`,
        [caseId, JSON.stringify({ resendMessageId, bouncedAt: event.data.created_at })]
      );

      // Alert tenant — their landlord's email bounced
      await notifyTenantOfBounce(caseId, db, c.env);

      await writeSystemAuditLog(c.env, null, 'email.bounced', { caseId, resendMessageId });
      break;
    }

    case 'email.complained': {
      await db.query(
        `UPDATE cases SET delivery_status = 'complained', delivery_updated_at = NOW()
         WHERE id = $1`,
        [caseId]
      );

      await db.query(
        `INSERT INTO case_events (case_id, user_id, event_type, detail)
         SELECT $1, user_id, 'letter.bounced', $2::jsonb
         FROM cases WHERE id = $1`,
        [caseId, JSON.stringify({ resendMessageId, complainedAt: event.data.created_at })]
      );

      await writeSystemAuditLog(c.env, null, 'email.complained', { caseId, resendMessageId });
      break;
    }
  }

  return c.json({ received: true });
});

/**
 * Notify tenant that their landlord's email bounced.
 * Critical — without this, tenant waits 14 days for nothing.
 */
async function notifyTenantOfBounce(
  caseId: string,
  db: ReturnType<typeof getSystemDb>,
  env: Env
): Promise<void> {
  // Get tenant email and case ref
  const rows = await db.query<{ email: string; case_id: string }>(
    `SELECT decrypt_value(u.email_encrypted, $1) as email, c.id as case_id
     FROM cases c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = $2`,
    [env.DB_ENCRYPTION_KEY, caseId]
  );

  const row = rows[0] as Record<string, string> | undefined;
  if (!row?.email) return;

  const caseRef = caseId.slice(0, 8).toUpperCase();

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'RentShield <hello@rentshield.co.uk>',
      to: [row.email],
      subject: `Action needed — email to your landlord bounced — Case ${caseRef}`,
      text: `The email we sent to your landlord for case ${caseRef} bounced — it could not be delivered.\n\nThis usually means the email address was incorrect. Please open RentShield, check the landlord email address, and resend the letter.\n\nYour letter and evidence are saved. You won't be charged again.\n\nThis is not legal advice. For legal guidance, contact Citizens Advice or a solicitor.`,
    }),
  });
}
