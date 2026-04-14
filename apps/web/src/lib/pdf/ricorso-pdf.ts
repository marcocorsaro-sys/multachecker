import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

type RenderInput = {
  testo: string;
  numeroVerbale?: string | null;
};

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 60;
const MARGIN_TOP = 70;
const MARGIN_BOTTOM = 60;
const LINE_HEIGHT = 14;
const FONT_SIZE = 11;
const TITLE_SIZE = 13;

/**
 * Genera un PDF A4 formattato dal testo del ricorso.
 * Il testo viene suddiviso in paragrafi (doppio newline) e poi
 * word-wrapped sulla larghezza utile della pagina.
 */
export async function renderRicorsoPdf(input: RenderInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const maxWidth = PAGE_WIDTH - MARGIN_X * 2;

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;

  // Footer con numero di pagina (lo riempiremo alla fine)
  const pages: PDFPage[] = [page];

  function newPage() {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    y = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(lines: number) {
    const needed = lines * LINE_HEIGHT;
    if (y - needed < MARGIN_BOTTOM) newPage();
  }

  function drawLine(text: string, opts?: { bold?: boolean; size?: number; center?: boolean }) {
    const size = opts?.size ?? FONT_SIZE;
    const f: PDFFont = opts?.bold ? fontBold : font;
    let x = MARGIN_X;
    if (opts?.center) {
      const w = f.widthOfTextAtSize(text, size);
      x = (PAGE_WIDTH - w) / 2;
    }
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) });
    y -= LINE_HEIGHT;
  }

  function wrapText(text: string, f: PDFFont, size: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const w = f.widthOfTextAtSize(candidate, size);
      if (w > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawParagraph(text: string, opts?: { bold?: boolean; size?: number; center?: boolean }) {
    const size = opts?.size ?? FONT_SIZE;
    const f: PDFFont = opts?.bold ? fontBold : font;
    const lines = wrapText(text, f, size);
    for (const ln of lines) {
      ensureSpace(1);
      let x = MARGIN_X;
      if (opts?.center) {
        const w = f.widthOfTextAtSize(ln, size);
        x = (PAGE_WIDTH - w) / 2;
      }
      page.drawText(ln, { x, y, size, font: f, color: rgb(0, 0, 0) });
      y -= LINE_HEIGHT;
    }
  }

  // Intestazione titolo
  drawLine("RICORSO AL PREFETTO", { bold: true, size: TITLE_SIZE, center: true });
  if (input.numeroVerbale) {
    drawLine(`Avverso verbale n. ${input.numeroVerbale}`, { center: true });
  }
  y -= LINE_HEIGHT; // spazio extra

  // Corpo — suddividiamo in paragrafi
  const paragraphs = input.testo.split(/\n{2,}/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Se inizia con parole chiave maiuscole → titolo sezione
    const isSectionTitle = /^(PREMESSO|CONSIDERATO|P\.Q\.M\.|PER QUESTI MOTIVI|MOTIVI|ALLEGATI|CONCLUSIONI|OGGETTO|AL SIGNOR PREFETTO)/i.test(
      trimmed
    );

    if (isSectionTitle && trimmed.length < 100) {
      ensureSpace(2);
      y -= LINE_HEIGHT / 2;
      drawParagraph(trimmed, { bold: true });
      y -= LINE_HEIGHT / 2;
    } else {
      // Gestione righe singole con \n (es. indirizzo su più righe)
      const subLines = trimmed.split("\n");
      for (const sub of subLines) {
        drawParagraph(sub);
      }
      y -= LINE_HEIGHT / 2; // spazio tra paragrafi
    }
  }

  // Footer numerazione pagine
  const total = pages.length;
  pages.forEach((p, i) => {
    const label = `Pagina ${i + 1} di ${total}`;
    const w = font.widthOfTextAtSize(label, 9);
    p.drawText(label, {
      x: (PAGE_WIDTH - w) / 2,
      y: 30,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  return pdf.save();
}
