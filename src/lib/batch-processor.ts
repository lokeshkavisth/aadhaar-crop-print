import { jsPDF } from 'jspdf';
import {
  loadPdf,
  checkIfPasswordProtected,
  processPdf,
  defaultCropFor,
} from './pdf-processor';
import { detectDocType, type DocType, DOC_META } from './doc-detector';

export interface BatchCard {
  file: string;
  docType: DocType;
  side: 'front' | 'back' | 'card';
  image: string; // data URL
}

export interface BatchFileResult {
  file: string;
  status: 'ok' | 'password-required' | 'error';
  docType?: DocType;
  cards: BatchCard[];
  error?: string;
}

export async function processBatchFile(
  file: File,
  password?: string,
): Promise<BatchFileResult> {
  try {
    const isProtected = await checkIfPasswordProtected(file);
    if (isProtected && !password) {
      return { file: file.name, status: 'password-required', cards: [] };
    }
    const pdf = await loadPdf(file, password);
    const docType = await detectDocType(file, pdf);
    const crop = defaultCropFor(docType);
    const res = await processPdf(pdf, docType, crop, false);

    const cards: BatchCard[] = [];
    if (docType === 'aadhaar') {
      cards.push({ file: file.name, docType, side: 'front', image: res.frontImage });
      if (res.backImage) cards.push({ file: file.name, docType, side: 'back', image: res.backImage });
    } else {
      cards.push({ file: file.name, docType, side: 'card', image: res.frontImage });
    }
    return { file: file.name, status: 'ok', docType, cards };
  } catch (e: any) {
    if (e?.name === 'PasswordException') {
      return { file: file.name, status: 'password-required', cards: [] };
    }
    return { file: file.name, status: 'error', cards: [], error: e?.message ?? 'Failed to process' };
  }
}

/** Generate a multi-page A4 PDF with all cards in a 2-column grid. */
export function generateBatchPdf(
  cards: BatchCard[],
  options: { showBorder?: boolean; roundedCorners?: boolean; labels?: boolean } = {},
): Blob {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });

  const pageW = 210;
  const pageH = 297;
  const cardW = 90.6;
  const cardH = 58.98;
  const cornerR = 3.37;
  const cols = 2;
  const gapX = 5;
  const gapY = 8;
  const marginTop = 12;
  const totalW = cols * cardW + (cols - 1) * gapX;
  const startX = (pageW - totalW) / 2;

  const rows = Math.floor((pageH - marginTop - 12) / (cardH + gapY));
  const perPage = cols * rows;

  cards.forEach((card, idx) => {
    const pageIdx = Math.floor(idx / perPage);
    const inPage = idx % perPage;
    const row = Math.floor(inPage / cols);
    const col = inPage % cols;
    if (inPage === 0 && pageIdx > 0) pdf.addPage();

    const x = startX + col * (cardW + gapX);
    const y = marginTop + row * (cardH + gapY);

    pdf.addImage(card.image, 'PNG', x, y, cardW, cardH);

    if (options.showBorder) {
      pdf.setDrawColor(150);
      pdf.setLineWidth(0.2);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(x, y, cardW, cardH);
      pdf.setLineDashPattern([], 0);
    }

    if (options.labels) {
      pdf.setFontSize(7);
      pdf.setTextColor(120);
      const label = `${DOC_META[card.docType].label} · ${card.side} · ${card.file}`;
      pdf.text(label.slice(0, 60), x, y + cardH + 3);
    }
  });

  return pdf.output('blob');
}

/** Convert a PNG data URL to a JPG data URL via canvas re-encoding. */
export async function pngToJpg(dataUrl: string, quality = 0.95, bg = '#ffffff'): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
