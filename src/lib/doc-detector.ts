import type { PDFDocumentProxy } from 'pdfjs-dist';

export type DocType = 'aadhaar' | 'pan' | 'jan-aadhaar';

export const DOC_META: Record<DocType, { label: string; passwordHint: string }> = {
  aadhaar: {
    label: 'e-Aadhaar',
    passwordHint: 'First 4 letters of your name in CAPS + DOB year (YYYY). Example: RAHU1995',
  },
  pan: {
    label: 'e-PAN',
    passwordHint: 'Your Date of Birth in DDMMYYYY format. Example: 15081995',
  },
  'jan-aadhaar': {
    label: 'Jan Aadhaar',
    passwordHint: 'Usually no password. If asked, try your DOB (DDMMYYYY) or registered mobile.',
  },
};

function detectFromFilename(name: string): DocType | null {
  const n = name.toLowerCase();
  if (/\b(pan|epan|e-pan)\b/.test(n) || /income[\s_-]?tax/.test(n)) return 'pan';
  if (/jan[\s_-]?aadhaar|janaadhar|janadhar|jan[\s_-]?aadhar/.test(n)) return 'jan-aadhaar';
  if (/aadhaar|aadhar|uidai/.test(n)) return 'aadhaar';
  return null;
}

async function detectFromContent(pdf: PDFDocumentProxy): Promise<DocType | null> {
  try {
    const page = await pdf.getPage(1);
    const tc = await page.getTextContent();
    const text = tc.items.map((it: any) => it.str ?? '').join(' ').toLowerCase();

    if (
      text.includes('income tax') ||
      text.includes('permanent account') ||
      text.includes('e-pan') ||
      text.includes('आयकर')
    ) return 'pan';

    if (
      text.includes('jan aadhaar') ||
      text.includes('jan-aadhaar') ||
      text.includes('janaadhaar') ||
      text.includes('jan aadhar') ||
      text.includes('जन आधार') ||
      text.includes('जन-आधार')
    ) return 'jan-aadhaar';

    if (
      text.includes('uidai') ||
      text.includes('unique identification') ||
      text.includes('aadhaar') ||
      text.includes('आधार')
    ) return 'aadhaar';
  } catch {
    /* ignore */
  }
  return null;
}

/** Detect by filename only (used before unlocking a protected PDF). */
export function detectDocTypeByFilename(file: File): DocType {
  return detectFromFilename(file.name) ?? 'aadhaar';
}

/** Content-first, filename fallback. Default: aadhaar. */
export async function detectDocType(file: File, pdf: PDFDocumentProxy): Promise<DocType> {
  const byContent = await detectFromContent(pdf);
  if (byContent) return byContent;
  return detectFromFilename(file.name) ?? 'aadhaar';
}
