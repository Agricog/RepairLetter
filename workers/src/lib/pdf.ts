import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface LetterPdfOptions {
  caseId: string;
  caseRef: string;
  defectType: string;
  severity: number;
  hhsrsCategory: string;
  letterText: string;
  letterDate: string;
  photos: Array<{
    imageBytes: Uint8Array;
    contentType: string;
    analysisLabel: string;
    uploadedAt: string;
  }>;
}

/**
 * Generates a branded PDF letter with:
 * - RepairLetter header with case reference
 * - Full letter text with proper paragraph formatting
 * - Evidence photo thumbnails with HHSRS labels
 * - Timestamp chain (evidence integrity)
 * - Legal disclaimer footer
 *
 * Uses pdf-lib — works natively in CF Workers, no DOM required.
 */
export async function generateLetterPdf(options: LetterPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  const GREEN = rgb(0.086, 0.639, 0.290); // #16A34A
  const NAVY = rgb(0.059, 0.090, 0.165); // #0F172A
  const SLATE = rgb(0.392, 0.455, 0.545); // #64748B
  const LIGHT_GREY = rgb(0.886, 0.910, 0.941); // #E2E8F0

  let currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPos = PAGE_HEIGHT - MARGIN;

  // ── Helper: add new page if needed ────────────────────────

  function ensureSpace(needed: number) {
    if (yPos - needed < MARGIN + 40) {
      currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPos = PAGE_HEIGHT - MARGIN;
    }
  }

  // ── Helper: draw wrapped text ─────────────────────────────

  function drawWrappedText(
    text: string,
    font: typeof helvetica,
    size: number,
    color: typeof NAVY,
    lineHeight: number,
    maxWidth: number
  ): void {
    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > maxWidth && line) {
        ensureSpace(lineHeight);
        currentPage.drawText(line, {
          x: MARGIN,
          y: yPos,
          size,
          font,
          color,
        });
        yPos -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ensureSpace(lineHeight);
      currentPage.drawText(line, {
        x: MARGIN,
        y: yPos,
        size,
        font,
        color,
      });
      yPos -= lineHeight;
    }
  }

  // ── Header ────────────────────────────────────────────────

  // Green bar at top
  currentPage.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 6,
    width: PAGE_WIDTH,
    height: 6,
    color: GREEN,
  });

  // Logo text
  currentPage.drawText('RepairLetter', {
    x: MARGIN,
    y: yPos - 10,
    size: 18,
    font: helveticaBold,
    color: NAVY,
  });

  // Case reference — right aligned
  const refText = `Case Ref: ${options.caseRef}`;
  const refWidth = helvetica.widthOfTextAtSize(refText, 9);
  currentPage.drawText(refText, {
    x: PAGE_WIDTH - MARGIN - refWidth,
    y: yPos - 10,
    size: 9,
    font: helvetica,
    color: SLATE,
  });

  yPos -= 30;

  // Date
  currentPage.drawText(options.letterDate, {
    x: MARGIN,
    y: yPos,
    size: 9,
    font: helvetica,
    color: SLATE,
  });

  yPos -= 10;

  // Separator line
  currentPage.drawLine({
    start: { x: MARGIN, y: yPos },
    end: { x: PAGE_WIDTH - MARGIN, y: yPos },
    thickness: 0.5,
    color: LIGHT_GREY,
  });

  yPos -= 20;

  // ── Case summary bar ─────────────────────────────────────

  // Defect type badge
  currentPage.drawText(`${options.defectType.toUpperCase()}`, {
    x: MARGIN,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: GREEN,
  });

  const severityText = `Severity: ${options.severity}/5`;
  currentPage.drawText(severityText, {
    x: MARGIN + 120,
    y: yPos,
    size: 10,
    font: helvetica,
    color: NAVY,
  });

  const hhsrsText = `HHSRS: ${options.hhsrsCategory}`;
  currentPage.drawText(hhsrsText, {
    x: MARGIN + 240,
    y: yPos,
    size: 9,
    font: helvetica,
    color: SLATE,
  });

  yPos -= 25;

  // ── Letter body ───────────────────────────────────────────

  const paragraphs = options.letterText.split('\n').filter((p) => p.trim());

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    // Detect headings (ALL CAPS lines)
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 80 && trimmed.length > 5) {
      yPos -= 8;
      drawWrappedText(trimmed, helveticaBold, 11, NAVY, 16, CONTENT_WIDTH);
      yPos -= 4;
    } else {
      drawWrappedText(trimmed, helvetica, 10, NAVY, 14, CONTENT_WIDTH);
      yPos -= 6;
    }
  }

  // ── Evidence photos ───────────────────────────────────────

  if (options.photos.length > 0) {
    yPos -= 20;
    ensureSpace(180);

    currentPage.drawText('EVIDENCE PHOTOGRAPHS', {
      x: MARGIN,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: NAVY,
    });
    yPos -= 20;

    const THUMB_SIZE = 120;
    const THUMB_GAP = 12;
    const THUMBS_PER_ROW = Math.floor(CONTENT_WIDTH / (THUMB_SIZE + THUMB_GAP));

    for (let i = 0; i < options.photos.length; i++) {
      const photo = options.photos[i]!;
      const col = i % THUMBS_PER_ROW;

      if (col === 0 && i > 0) {
        yPos -= THUMB_SIZE + 30;
      }

      ensureSpace(THUMB_SIZE + 30);

      const xPos = MARGIN + col * (THUMB_SIZE + THUMB_GAP);

      try {
        let image;
        if (photo.contentType === 'image/png') {
          image = await doc.embedPng(photo.imageBytes);
        } else {
          image = await doc.embedJpg(photo.imageBytes);
        }

        const scaled = image.scaleToFit(THUMB_SIZE, THUMB_SIZE);

        currentPage.drawImage(image, {
          x: xPos,
          y: yPos - scaled.height,
          width: scaled.width,
          height: scaled.height,
        });

        // Label below photo
        currentPage.drawText(photo.analysisLabel, {
          x: xPos,
          y: yPos - scaled.height - 12,
          size: 7,
          font: helvetica,
          color: SLATE,
        });

        // Timestamp below label
        currentPage.drawText(photo.uploadedAt, {
          x: xPos,
          y: yPos - scaled.height - 22,
          size: 6,
          font: helvetica,
          color: SLATE,
        });
      } catch {
        // If image embedding fails, show placeholder text
        currentPage.drawText(`[Photo ${i + 1}]`, {
          x: xPos,
          y: yPos - 12,
          size: 9,
          font: helvetica,
          color: SLATE,
        });
      }
    }

    yPos -= THUMB_SIZE + 40;
  }

  // ── Evidence chain ────────────────────────────────────────

  yPos -= 10;
  ensureSpace(60);

  currentPage.drawLine({
    start: { x: MARGIN, y: yPos },
    end: { x: PAGE_WIDTH - MARGIN, y: yPos },
    thickness: 0.5,
    color: LIGHT_GREY,
  });

  yPos -= 15;

  currentPage.drawText('EVIDENCE CHAIN', {
    x: MARGIN,
    y: yPos,
    size: 8,
    font: helveticaBold,
    color: SLATE,
  });
  yPos -= 12;

  currentPage.drawText(`Case created: ${options.letterDate}`, {
    x: MARGIN,
    y: yPos,
    size: 7,
    font: helvetica,
    color: SLATE,
  });
  yPos -= 10;

  currentPage.drawText(`Photos uploaded: ${options.photos.length} file(s) with EXIF data stripped`, {
    x: MARGIN,
    y: yPos,
    size: 7,
    font: helvetica,
    color: SLATE,
  });
  yPos -= 10;

  currentPage.drawText('All timestamps are server-generated (UTC) and immutable.', {
    x: MARGIN,
    y: yPos,
    size: 7,
    font: helvetica,
    color: SLATE,
  });
  yPos -= 10;

  currentPage.drawText(`Document generated: ${new Date().toISOString()}`, {
    x: MARGIN,
    y: yPos,
    size: 7,
    font: helvetica,
    color: SLATE,
  });

  // ── Footer on every page ──────────────────────────────────

  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;

    // Disclaimer
    const disclaimer = 'This letter was generated by RepairLetter and does not constitute legal advice.';
    const disclaimerWidth = helvetica.widthOfTextAtSize(disclaimer, 7);
    page.drawText(disclaimer, {
      x: (PAGE_WIDTH - disclaimerWidth) / 2,
      y: 25,
      size: 7,
      font: helvetica,
      color: SLATE,
    });

    // Page number
    const pageNum = `Page ${i + 1} of ${pages.length}`;
    const pageNumWidth = helvetica.widthOfTextAtSize(pageNum, 7);
    page.drawText(pageNum, {
      x: PAGE_WIDTH - MARGIN - pageNumWidth,
      y: 25,
      size: 7,
      font: helvetica,
      color: SLATE,
    });

    // Bottom green line
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: 3,
      color: GREEN,
    });
  }

  return doc.save();
}

/**
 * Generates a simple cover page for evidence pack PDFs.
 */
export async function generateEvidencePackCover(
  caseRef: string,
  defectType: string,
  severity: number,
  hhsrsCategory: string,
  caseCreated: string,
  totalPhotos: number,
  totalLetters: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const GREEN = rgb(0.086, 0.639, 0.290);
  const NAVY = rgb(0.059, 0.090, 0.165);
  const SLATE = rgb(0.392, 0.455, 0.545);

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Green bar
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, color: GREEN });

  // Title
  page.drawText('RepairLetter', { x: 50, y: 700, size: 28, font: helveticaBold, color: NAVY });
  page.drawText('Evidence Pack', { x: 50, y: 670, size: 20, font: helvetica, color: GREEN });

  // Case details
  const details = [
    ['Case Reference', caseRef],
    ['Defect Type', defectType],
    ['Severity', `${severity}/5`],
    ['HHSRS Category', hhsrsCategory],
    ['Case Created', caseCreated],
    ['Evidence Photos', `${totalPhotos}`],
    ['Letters Sent', `${totalLetters}`],
    ['Pack Generated', new Date().toISOString().split('T')[0] ?? ''],
  ];

  let y = 610;
  for (const [label, value] of details) {
    page.drawText(`${label}:`, { x: 50, y, size: 10, font: helveticaBold, color: NAVY });
    page.drawText(value ?? '', { x: 200, y, size: 10, font: helvetica, color: SLATE });
    y -= 22;
  }

  // Disclaimer
  page.drawText(
    'This evidence pack is compiled from records stored securely by RepairLetter.',
    { x: 50, y: 100, size: 8, font: helvetica, color: SLATE }
  );
  page.drawText(
    'All timestamps are server-generated and immutable. This document does not constitute legal advice.',
    { x: 50, y: 88, size: 8, font: helvetica, color: SLATE }
  );

  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: 3, color: GREEN });

  return doc.save();
}
