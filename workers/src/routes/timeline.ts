import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb } from '../lib/db';

export const timelineRoutes = new Hono<{ Bindings: Env }>();

// ── GET /api/cases/:id/timeline ─────────────────────────────
// Returns all events for a case in chronological order.
// RLS enforced — tenants can only see events for their own cases.

timelineRoutes.get('/cases/:id/timeline', async (c) => {
  const caseId = c.req.param('id');
  const userId = c.get('userId') as string;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId)) {
    return c.json({ error: 'Invalid case ID' }, 400);
  }

  const db = getDb(c.env, userId);

  // Verify case exists and belongs to user (RLS handles this)
  const cases = await db.query(
    `SELECT id FROM cases WHERE id = $1`,
    [caseId]
  );

  if (cases.length === 0) {
    return c.json({ error: 'Case not found' }, 404);
  }

  // Fetch timeline events
  const events = await db.query<{
    id: string;
    event_type: string;
    detail: Record<string, unknown> | null;
    created_at: string;
  }>(
    `SELECT id, event_type, detail, created_at
     FROM case_events
     WHERE case_id = $1
     ORDER BY created_at ASC`,
    [caseId]
  );

  // Map event types to human-readable labels
  const timeline = events.map((ev) => {
    const row = ev as Record<string, unknown>;
    return {
      id: row.id,
      type: row.event_type,
      label: getEventLabel(row.event_type as string),
      detail: row.detail,
      timestamp: row.created_at,
    };
  });

  return c.json({ caseId, events: timeline });
});

/**
 * Human-readable labels for timeline events.
 * These are English — the frontend translates them via i18n if needed.
 */
function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'case.created': 'Case created',
    'photo.uploaded': 'Photo uploaded',
    'photo.analysed': 'Photo analysed by AI',
    'voice.transcribed': 'Voice note transcribed',
    'voice.translated': 'Transcription translated to English',
    'letter.generated': 'Legal letter generated',
    'letter.sent': 'Letter sent to landlord',
    'letter.delivered': 'Letter delivered to landlord',
    'letter.bounced': 'Letter delivery failed',
    'deadline.started': '14-day deadline started',
    'deadline.passed': 'Landlord deadline passed',
    'case.escalated': 'Case escalated — council complaint prepared',
    'complaint.generated': 'Environmental health complaint generated',
    'case.resolved': 'Case marked as resolved',
    'evidence.exported': 'Evidence pack downloaded',
  };

  return labels[eventType] ?? eventType;
}
