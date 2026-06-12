import type { PDFDocumentProxy } from 'pdfjs-dist';

export type DocType =
  | 'aadhaar'
  | 'pan'
  | 'jan-aadhaar'
  | 'voter-id'
  | 'driving-license'
  | 'ayushman'
  | 'rc'
  | 'generic';

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
  'voter-id': {
    label: 'Voter ID',
    passwordHint:
      'EPIC PDFs are usually password-free. If asked, try your EPIC number or DOB (DDMMYYYY).',
  },
  'driving-license': {
    label: 'Driving Licence',
    passwordHint:
      'Sarathi / Parivahan PDFs are usually unprotected. If asked, try your DL number or DOB.',
  },
  ayushman: {
    label: 'Ayushman / ABHA',
    passwordHint:
      'Usually no password. If asked, try your ABHA number or registered mobile (10 digits).',
  },
  rc: {
    label: 'Vehicle RC',
    passwordHint: 'Usually no password. If asked, try the chassis number last 5 digits.',
  },
  generic: {
    label: 'Generic ID',
    passwordHint:
      'Unknown document type. If a password is required, try DOB (DDMMYYYY) or the document number.',
  },
};

function detectFromFilename(name: string): DocType | null {
  const n = name.toLowerCase();
  if (/\b(pan|epan|e-pan)\b/.test(n) || /income[\s_-]?tax/.test(n)) return 'pan';
  if (/jan[\s_-]?aadhaar|janaadhar|janadhar|jan[\s_-]?aadhar/.test(n)) return 'jan-aadhaar';
  if (/\bepic\b|voter|election/.test(n)) return 'voter-id';
  if (/driving|sarathi|parivahan|\bdl\b/.test(n)) return 'driving-license';
  if (/ayushman|pmjay|\babha\b/.test(n)) return 'ayushman';
  if (/\brc\b|registration[\s_-]?certificate|vehicle/.test(n)) return 'rc';
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
      text.includes('election commission') ||
      text.includes('elector') ||
      text.includes('epic no') ||
      text.includes('निर्वाचन')
    ) return 'voter-id';

    if (
      text.includes('driving licence') ||
      text.includes('driving license') ||
      text.includes('sarathi') ||
      text.includes('parivahan')
    ) return 'driving-license';

    if (
      text.includes('ayushman') ||
      text.includes('pmjay') ||
      text.includes('abha') ||
      text.includes('आयुष्मान')
    ) return 'ayushman';

    if (
      text.includes('registration certificate') ||
      text.includes('chassis no') ||
      text.includes('vahan')
    ) return 'rc';

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

/** Content-first, filename fallback. Default: generic so the operator gets a manual-crop nudge. */
export async function detectDocType(file: File, pdf: PDFDocumentProxy): Promise<DocType> {
  const byContent = await detectFromContent(pdf);
  if (byContent) return byContent;
  return detectFromFilename(file.name) ?? 'generic';
}
