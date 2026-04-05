import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb, writeAuditLog } from '../lib/db';

export const uploadRoutes = new Hono<{ Bindings: Env }>();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'audio/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

// ── POST /api/upload-url ────────────────────────────────────

uploadRoutes.post('/upload-url', async (c) => {
  const body = await c.req.json<{ contentType: string; caseId?: string }>();

  if (!ALLOWED_TYPES.includes(body.contentType)) {
    return c.json({ error: 'Unsupported file type. Only JPEG, PNG, and WebM accepted.' }, 400);
  }

  const userId = c.get('userId') as string;
  const ext = body.contentType === 'image/jpeg' ? 'jpg'
    : body.contentType === 'image/png' ? 'png'
    : 'webm';

  const r2Key = `users/${userId}/evidence/${crypto.randomUUID()}.${ext}`;
  const expiresAt = new Date(Date.now() + 3600000).toISOString();

  const db = getDb(c.env, userId);
  await writeAuditLog(db, 'upload.url_generated', {
    r2Key,
    contentType: body.contentType,
    caseId: body.caseId ?? null,
  });

  return c.json({
    uploadUrl: `${new URL(c.req.url).origin}/api/upload/${encodeURIComponent(r2Key)}`,
    r2Key,
    expiresAt,
  });
});

// ── PUT /api/upload/:key — proxy upload to R2 ───────────────
// Now computes SHA-256 hash of every file at upload time.

uploadRoutes.put('/upload/:key{.+}', async (c) => {
  const r2Key = decodeURIComponent(c.req.param('key'));
  const userId = c.get('userId') as string;

  if (!r2Key.startsWith(`users/${userId}/`)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const contentType = c.req.header('Content-Type');
  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return c.json({ error: 'Invalid content type' }, 400);
  }

  const maxSize = contentType.startsWith('audio/') ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
  const contentLength = parseInt(c.req.header('Content-Length') ?? '0', 10);
  if (contentLength > maxSize) {
    return c.json({ error: `File too large. Max ${maxSize / (1024 * 1024)}MB.` }, 413);
  }

  const body = await c.req.arrayBuffer();

  if (body.byteLength > maxSize) {
    return c.json({ error: 'File too large' }, 413);
  }

  if (!validateMagicBytes(new Uint8Array(body), contentType)) {
    return c.json({ error: 'File content does not match declared type' }, 400);
  }

  // ── Compute SHA-256 hash — evidence integrity proof ───────
  const hashBuffer = await crypto.subtle.digest('SHA-256', body);
  const sha256Hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Upload to R2
  await c.env.EVIDENCE_BUCKET.put(r2Key, body, {
    httpMetadata: { contentType },
    customMetadata: {
      userId,
      uploadedAt: new Date().toISOString(),
      sha256: sha256Hash,
    },
  });

  const db = getDb(c.env, userId);
  await writeAuditLog(db, 'upload.completed', {
    r2Key,
    contentType,
    size: body.byteLength,
    sha256: sha256Hash,
  });

  // Return hash so it can be stored in the evidence record
  return c.json({ success: true, r2Key, sha256Hash });
});

// ── GET /api/evidence-url/:key ──────────────────────────────

uploadRoutes.get('/evidence-url/:key{.+}', async (c) => {
  const r2Key = decodeURIComponent(c.req.param('key'));
  const userId = c.get('userId') as string;

  if (!r2Key.startsWith(`users/${userId}/`)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const file = await c.env.EVIDENCE_BUCKET.get(r2Key);
  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  });
});

function validateMagicBytes(bytes: Uint8Array, contentType: string): boolean {
  if (bytes.length < 4) return false;

  switch (contentType) {
    case 'image/jpeg':
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    case 'image/png':
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    case 'audio/webm':
      return bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3;
    default:
      return false;
  }
}
