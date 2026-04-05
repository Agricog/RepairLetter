import { Hono } from 'hono';
import type { Env } from '../index';
import { getDb, writeAuditLog } from '../lib/db';
import { generateLetterPdf, generateEvidencePackCover } from '../lib/pdf';
import { PDFDocument } from 'pdf-lib';

export const evidencePackRoutes = new Hono<{ Bindings: Env }>();

// ── POST /api/evidence-pack — generate and return download URL ─

evidencePackRoutes.post('/evidence-pack', async (c) => {
  const body = await c.req.json<{ caseId: string }>();
  const userId = c.get('userId') as string;

  // Validate
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.caseId)) {
    return c.json({ error: 'Invalid case ID' }, 400);
  }

  const db = getDb(c.env, userId);

  // Fetch case (RLS enforced)
  const cases = await db.query<{
    id: string;
    defect_type: string;
    defect_severity: number;
    hhsrs_category: string;
    status: string;
    created_at: string;
    letter_sent_at: string | null;
    deadline_at: string | null;
  }>(
    `SELECT id, defect_type, defect_severity, hhsrs_category, status,
            created_at, letter_sent_at, deadline_at
     FROM cases WHERE id = $1`,
    [body.caseId]
  );

  if (cases.length === 0) {
    return c.json({ error: 'Case not found' }, 404);
  }

  const caseData = cases[0] as Record<string, unknown>;

  // Fetch evidence
  const evidence = await db.query<{
    id: string;
    r2_key: string;
    content_type: string;
    ai_analysis: Record<string, unknown> | null;
    created_at: string;
  }>(
    `SELECT id, r2_key, content_type, ai_analysis, created_at
     FROM evidence WHERE case_id = $1
     ORDER BY created_at ASC`,
    [body.caseId]
  );

  // Fetch letters (decrypt for inclusion in pack)
  const letters = await db.query<{
    id: string;
    letter_type: string;
    sent_at: string;
    content: string;
  }>(
    `SELECT id, letter_type, sent_at,
            decrypt_value(content_encrypted, current_setting('app.encryption_key')) as content
     FROM letters WHERE case_id = $1
     ORDER BY sent_at ASC`,
    [body.caseId]
  );

  // Load photo bytes from R2
  const photoEntries = [];
  for (const ev of evidence) {
    const row = ev as Record<string, unknown>;
    const contentType = row.content_type as string;

    if (!contentType.startsWith('image/')) continue;

    try {
      const obj = await c.env.EVIDENCE_BUCKET.get(row.r2_key as string);
      if (!obj) continue;

      const imageBytes = new Uint8Array(await obj.arrayBuffer());
      const analysis = row.ai_analysis as Record<string, string> | null;

      photoEntries.push({
        imageBytes,
        contentType,
        analysisLabel: analysis
          ? `${analysis.hhsrsCategory ?? 'Unknown'} — Severity ${analysis.severity ?? '?'}/5`
          : 'Unclassified',
        uploadedAt: new Date(row.created_at as string).toISOString(),
      });
    } catch {
      // Skip failed photo loads — don't block the entire pack
    }
  }

  // Generate merged PDF
  const mergedPdf = await PDFDocument.create();

  // 1. Cover page
  const coverBytes = await generateEvidencePackCover(
    (caseData.id as string).slice(0, 8).toUpperCase(),
    caseData.defect_type as string,
    caseData.defect_severity as number,
    (caseData.hhsrs_category as string) ?? 'Not classified',
    new Date(caseData.created_at as string).toLocaleDateString('en-GB'),
    photoEntries.length,
    letters.length
  );

  const coverDoc = await PDFDocument.load(coverBytes);
  const coverPages = await mergedPdf.copyPages(coverDoc, coverDoc.getPageIndices());
  for (const page of coverPages) {
    mergedPdf.addPage(page);
  }

  // 2. Each letter as a PDF page
  for (const letter of letters) {
    const row = letter as Record<string, unknown>;
    const letterContent = row.content as string;

    if (!letterContent) continue;

    try {
      const letterBytes = await generateLetterPdf({
        caseId: body.caseId,
        caseRef: (caseData.id as string).slice(0, 8).toUpperCase(),
        defectType: caseData.defect_type as string,
        severity: caseData.defect_severity as number,
        hhsrsCategory: (caseData.hhsrs_category as string) ?? '',
        letterText: letterContent,
        letterDate: new Date(row.sent_at as string).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        photos: photoEntries,
      });

      const letterDoc = await PDFDocument.load(letterBytes);
      const letterPages = await mergedPdf.copyPages(letterDoc, letterDoc.getPageIndices());
      for (const page of letterPages) {
        mergedPdf.addPage(page);
      }
    } catch (err) {
      console.error('Failed to generate letter PDF:', err);
    }
  }

  const mergedBytes = await mergedPdf.save();

  // Store in R2 with 24hr expiry metadata
  const packKey = `users/${userId}/packs/${body.caseId}-${Date.now()}.pdf`;

  await c.env.EVIDENCE_BUCKET.put(packKey, mergedBytes, {
    httpMetadata: { contentType: 'application/pdf' },
    customMetadata: {
      userId,
      caseId: body.caseId,
      deleteAfter: new Date(Date.now() + 86400000).toISOString(),
      type: 'evidence_pack',
    },
  });

  await writeAuditLog(db, 'evidence_pack.generated', {
    caseId: body.caseId,
    photoCount: photoEntries.length,
    letterCount: letters.length,
    sizeBytes: mergedBytes.length,
  });

  // Return download URL (served via the existing evidence-url endpoint)
  return c.json({
    downloadUrl: `/api/evidence-url/${encodeURIComponent(packKey)}`,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
});
