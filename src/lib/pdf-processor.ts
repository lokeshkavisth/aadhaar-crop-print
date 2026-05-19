import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const RENDER_SCALE = 5; // 500 DPI for maximum quality

import type { DocType } from './doc-detector';

export interface CropRegion {
  top: number;
  bottom: number;
  leftStart: number;
  leftEnd: number;
  rightStart: number;
  rightEnd: number;
}

export const DEFAULT_CROP: CropRegion = {
  top: 71.5,
  bottom: 93.5,
  leftStart: 6.7,
  leftEnd: 50,
  rightStart: 50,
  rightEnd: 93.3,
};

/** Single-card crop defaults — used for PAN and Jan Aadhaar (one card per page). */
export const DEFAULT_SINGLE_CROP: CropRegion = {
  top: 4,
  bottom: 96,
  leftStart: 4,
  leftEnd: 96,
  rightStart: 0,
  rightEnd: 0,
};

export function defaultCropFor(docType: DocType): CropRegion {
  return docType === 'aadhaar' ? DEFAULT_CROP : DEFAULT_SINGLE_CROP;
}

export interface ProcessingResult {
  docType: DocType;
  frontImage: string;
  /** Undefined for single-card docs (PAN, Jan Aadhaar). */
  backImage?: string;
  fullPageCanvas: HTMLCanvasElement | null;
}

export interface PrintOptions {
  showBorder: boolean;
  roundedCorners: boolean;
  gap: number;
  marginTop: number;
  marginLeft: number;
  autoCenter: boolean;
}

export async function loadPdf(file: File, password?: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    password: password || undefined,
  });
  return loadingTask.promise;
}

export async function checkIfPasswordProtected(file: File): Promise<boolean> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    await loadingTask.promise;
    return false;
  } catch (error: any) {
    if (error?.name === 'PasswordException') {
      return true;
    }
    throw error;
  }
}

export async function renderPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  
  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;
  
  return canvas;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  sharpen: number;
  grayscale: boolean;
}

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 1,
  contrast: 1,
  sharpen: 0,
  grayscale: false,
};

function applyFilters(
  canvas: HTMLCanvasElement,
  filters: ImageFilters
): HTMLCanvasElement {
  if (
    filters.brightness === 1 &&
    filters.contrast === 1 &&
    filters.sharpen === 0 &&
    !filters.grayscale
  ) {
    return canvas;
  }

  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;

  // Build CSS filter string
  const parts: string[] = [];
  if (filters.brightness !== 1) parts.push(`brightness(${filters.brightness})`);
  if (filters.contrast !== 1) parts.push(`contrast(${filters.contrast})`);
  if (filters.grayscale) parts.push('grayscale(1)');
  ctx.filter = parts.length > 0 ? parts.join(' ') : 'none';

  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';

  // Sharpen via unsharp mask
  if (filters.sharpen > 0) {
    const strength = filters.sharpen;
    const imgData = ctx.getImageData(0, 0, out.width, out.height);
    const d = imgData.data;
    const w = out.width;
    const h = out.height;
    const copy = new Uint8ClampedArray(d);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = copy[idx + c] * 5;
          const neighbors =
            copy[((y - 1) * w + x) * 4 + c] +
            copy[((y + 1) * w + x) * 4 + c] +
            copy[(y * w + (x - 1)) * 4 + c] +
            copy[(y * w + (x + 1)) * 4 + c];
          const sharpened = copy[idx + c] + (center - neighbors - copy[idx + c]) * strength;
          d[idx + c] = Math.max(0, Math.min(255, sharpened));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return out;
}

export function cropFromCanvas(
  canvas: HTMLCanvasElement,
  side: 'front' | 'back',
  crop: CropRegion,
  roundedCorners: boolean = false,
  filters: ImageFilters = DEFAULT_FILTERS,
  outputSize?: { width: number; height: number }
): string {
  const filtered = applyFilters(canvas, filters);
  const cropCanvas = document.createElement('canvas');
  const ctx = cropCanvas.getContext('2d')!;
  
  const w = filtered.width;
  const h = filtered.height;
  
  const cardTop = Math.floor(h * (crop.top / 100));
  const cardBottom = Math.floor(h * (crop.bottom / 100));
  
  let sx: number;
  let sxEnd: number;
  
  if (side === 'front') {
    sx = Math.floor(w * (crop.leftStart / 100));
    sxEnd = Math.floor(w * (crop.leftEnd / 100));
  } else {
    sx = Math.floor(w * (crop.rightStart / 100));
    sxEnd = Math.floor(w * (crop.rightEnd / 100));
  }
  
  const cropW = sxEnd - sx;
  const cropH = cardBottom - cardTop;

  const outW = outputSize?.width ?? cropW;
  const outH = outputSize?.height ?? cropH;
  
  cropCanvas.width = outW;
  cropCanvas.height = outH;

  if (roundedCorners) {
    const radius = Math.floor(outW * 0.037);
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(outW - radius, 0);
    ctx.quadraticCurveTo(outW, 0, outW, radius);
    ctx.lineTo(outW, outH - radius);
    ctx.quadraticCurveTo(outW, outH, outW - radius, outH);
    ctx.lineTo(radius, outH);
    ctx.quadraticCurveTo(0, outH, 0, outH - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();
  }
  
  ctx.drawImage(filtered, sx, cardTop, cropW, cropH, 0, 0, outW, outH);
  
  return cropCanvas.toDataURL('image/png', 1.0);
}

export async function processAadhaarPdf(
  pdf: pdfjsLib.PDFDocumentProxy,
  crop: CropRegion = DEFAULT_CROP,
  roundedCorners: boolean = false
): Promise<ProcessingResult> {
  const numPages = pdf.numPages;

  if (numPages === 1) {
    const canvas = await renderPageToCanvas(pdf, 1);
    return {
      docType: 'aadhaar',
      frontImage: cropFromCanvas(canvas, 'front', crop, roundedCorners),
      backImage: cropFromCanvas(canvas, 'back', crop, roundedCorners),
      fullPageCanvas: canvas,
    };
  } else {
    const canvas1 = await renderPageToCanvas(pdf, 1);
    const canvas2 = await renderPageToCanvas(pdf, 2);
    return {
      docType: 'aadhaar',
      frontImage: canvas1.toDataURL('image/png', 1.0),
      backImage: canvas2.toDataURL('image/png', 1.0),
      fullPageCanvas: null,
    };
  }
}

/** Single-card processor (PAN, Jan Aadhaar). Crops one card region from page 1. */
export async function processSingleCardPdf(
  pdf: pdfjsLib.PDFDocumentProxy,
  docType: DocType,
  crop: CropRegion = DEFAULT_SINGLE_CROP,
  roundedCorners: boolean = false
): Promise<ProcessingResult> {
  const canvas = await renderPageToCanvas(pdf, 1);
  return {
    docType,
    frontImage: cropFromCanvas(canvas, 'front', crop, roundedCorners),
    fullPageCanvas: canvas,
  };
}

/** Dispatcher — pick the right processor based on detected doc type. */
export async function processPdf(
  pdf: pdfjsLib.PDFDocumentProxy,
  docType: DocType,
  crop?: CropRegion,
  roundedCorners: boolean = false
): Promise<ProcessingResult> {
  if (docType === 'aadhaar') {
    return processAadhaarPdf(pdf, crop ?? DEFAULT_CROP, roundedCorners);
  }
  return processSingleCardPdf(pdf, docType, crop ?? DEFAULT_SINGLE_CROP, roundedCorners);
}

function drawRoundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number) {
  pdf.lines(
    [
      [w - 2 * r, 0],
      [r, 0, r, r, 0],
      [0, h - 2 * r],
      [0, r, -r, r, 0],
      [-(w - 2 * r), 0],
      [-r, 0, -r, -r, 0],
      [0, -(h - 2 * r)],
      [0, -r, r, -r, 0],
    ],
    x + r,
    y,
    [1, 1],
    'S'
  );
}

export function generatePrintPdf(
  frontImage: string,
  backImage: string | undefined,
  options: PrintOptions = {
    showBorder: false,
    roundedCorners: false,
    gap: 4,
    marginTop: 15,
    marginLeft: 0,
    autoCenter: true,
  }
): Blob {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false,
  });

  const cardW = 90.6;
  const cardH = 58.98;
  const cornerR = 3.37;

  const pageW = 210;
  const gap = options.gap;
  const hasBack = !!backImage;
  const totalW = hasBack ? cardW * 2 + gap : cardW;
  const startX = options.autoCenter
    ? (pageW - totalW) / 2
    : options.marginLeft;
  const y = options.marginTop;

  const stroke = (x: number) => {
    if (!options.showBorder) return;
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([2, 2], 0);
    if (options.roundedCorners) drawRoundedRect(pdf, x, y, cardW, cardH, cornerR);
    else pdf.rect(x, y, cardW, cardH);
  };

  pdf.addImage(frontImage, 'PNG', startX, y, cardW, cardH);
  stroke(startX);

  if (hasBack && backImage) {
    pdf.addImage(backImage, 'PNG', startX + cardW + gap, y, cardW, cardH);
    stroke(startX + cardW + gap);
  }

  return pdf.output('blob');
}
