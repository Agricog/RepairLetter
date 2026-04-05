import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb, writeAuditLog } from '../lib/db';
import { checkRateLimit, PHOTO_RATE_LIMIT } from '../middleware/ratelimit';

export const analyseRoutes = new Hono<{ Bindings: Env }>();

interface AnalysisResult {
  defectType: string;
  severity: number;
  hhsrsCategory: string;
  descriptionEn: string;
  confidence: number;
}

// System prompt is separate from user content — Claude's system prompt
// cannot be overridden by image content
const SYSTEM_PROMPT = `You are a UK housing defect analyst. You classify property defects against the Housing Health and Safety Rating System (HHSRS).

You MUST return a JSON object with exactly these fields and nothing else:
{
  "defectType": one of "damp" | "mould" | "leak" | "heating" | "electrics" | "other",
  "severity": integer 1-5,
  "hhsrsCategory": the most relevant HHSRS hazard category,
  "descriptionEn": a clear 2-3 sentence description suitable for a legal letter,
  "confidence": decimal 0-1
}

Severity guide:
- 5: Immediate danger (exposed live wiring, structural failure, gas leak)
- 4: Serious health risk (black mould >1sqm, active water ingress, no heating in winter)
- 3: Significant (spreading damp, persistent condensation, intermittent heating failure)
- 2: Moderate (small damp patches, minor mould, cosmetic moisture damage)
- 1: Minor (hairline cracks, minor condensation, surface-level)

Return ONLY valid JSON. No markdown. No explanation.`;

const USER_PROMPT = 'Analyse this photo of a residential property defect. Classify the defect type, severity, and HHSRS hazard category.';

// ── POST /api/analyse-photo ─────────────────────────────────

analyseRoutes.post('/analyse-photo', async (c) => {
  const rateCheck = await checkRateLimit(c, PHOTO_RATE_LIMIT);
  if (!rateCheck.allowed) {
    return c.json(
      { error: 'Rate limit exceeded. Max 10 photo analyses per hour.', retryAfter: rateCheck.resetAt },
      429
    );
  }

  const body = await c.req.json<{ r2Key: string; caseId?: string }>();
  const userId = c.get('userId') as string;

  // Security: only own files
  if (!body.r2Key.startsWith(`users/${userId}/`)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Validate r2Key format — prevent path traversal
  if (body.r2Key.includes('..') || body.r2Key.includes('//')) {
    return c.json({ error: 'Invalid file path' }, 400);
  }

  // Fetch image from R2
  const object = await c.env.EVIDENCE_BUCKET.get(body.r2Key);
  if (!object) {
    return c.json({ error: 'Photo not found in storage' }, 404);
  }

  const imageBytes = await object.arrayBuffer();
  const base64Image = arrayBufferToBase64(imageBytes);
  const mediaType = object.httpMetadata?.contentType ?? 'image/jpeg';

  // Validate media type is an image
  if (!mediaType.startsWith('image/')) {
    return c.json({ error: 'File is not an image' }, 400);
  }

  // Call Claude Vision — system prompt separate from user content
  const analysisRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': c.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: USER_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!analysisRes.ok) {
    console.error('Claude API error:', analysisRes.status);
    return c.json({ error: 'Photo analysis failed. Please try again.' }, 502);
  }

  const claudeResponse = await analysisRes.json() as {
    content: Array<{ type: string; text?: string }>;
  };

  const textContent = claudeResponse.content.find((b) => b.type === 'text');
  if (!textContent?.text) {
    return c.json({ error: 'No analysis returned' }, 502);
  }

  // Parse and validate JSON response
  let analysis: AnalysisResult;
  try {
    // Strip any markdown fencing Claude might add despite instructions
    const cleaned = textContent.text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    analysis = JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse Claude response:', textContent.text);
    return c.json({ error: 'Analysis returned invalid format. Please retake the photo.' }, 502);
  }

  // Validate all required fields and ranges
  const validTypes = ['damp', 'mould', 'leak', 'heating', 'electrics', 'other'];
  if (!validTypes.includes(analysis.defectType)) {
    return c.json({ error: 'Invalid analysis result' }, 502);
  }
  if (
    typeof analysis.severity !== 'number' ||
    analysis.severity < 1 ||
    analysis.severity > 5
  ) {
    return c.json({ error: 'Invalid severity in analysis' }, 502);
  }
  if (!analysis.hhsrsCategory || typeof analysis.hhsrsCategory !== 'string') {
    return c.json({ error: 'Missing HHSRS category in analysis' }, 502);
  }
  if (!analysis.descriptionEn || typeof analysis.descriptionEn !== 'string') {
    return c.json({ error: 'Missing description in analysis' }, 502);
  }

  // Sanitise description — strip any HTML/script tags from Claude output
  analysis.descriptionEn = analysis.descriptionEn
    .replace(/<[^>]*>/g, '')
    .slice(0, 500);

  // Store in evidence table if caseId provided
  if (body.caseId) {
    // Validate caseId format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.caseId)) {
      return c.json({ error: 'Invalid case ID' }, 400);
    }

    const db = getDb(c.env, userId);
    await db.query(
      `INSERT INTO evidence (case_id, r2_key, content_type, ai_analysis)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [body.caseId, body.r2Key, mediaType, JSON.stringify(analysis)]
    );

    await writeAuditLog(db, 'photo.analysed', {
      caseId: body.caseId,
      r2Key: body.r2Key,
      severity: analysis.severity,
      hhsrsCategory: analysis.hhsrsCategory,
    });
  }

  return c.json(analysis);
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
