import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const RENDER_SCALE = 5; // 500 DPI for maximum quality

export interface CropRegion {
  top: number;
  bottom: number;
  leftStart: number;
  leftEnd: number;
  rightStart: number;
  rightEnd: number;
}

export const DEFAULT_CROP: CropRegion = {
  top: 72.42,
  bottom: 97.21,
  leftStart: 1.96,
  leftEnd: 50,
  rightStart: 50,
  rightEnd: 98.04,
};

export interface ProcessingResult {
  frontImage: string;
  backImage: string;
  fullPageCanvas: HTMLCanvasElement | null;
}

export interface PrintOptions {
  showBorder: boolean;
  roundedCorners: boolean;
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

export function cropFromCanvas(
  canvas: HTMLCanvasElement,
  side: 'front' | 'back',
  crop: CropRegion,
  roundedCorners: boolean = false
): string {
  const cropCanvas = document.createElement('canvas');
  const ctx = cropCanvas.getContext('2d')!;
  
  const w = canvas.width;
  const h = canvas.height;
  
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
  
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;

  if (roundedCorners) {
    // ID-1 standard corner radius ~3.18mm on an 85.6mm card ≈ 3.7%
    const radius = Math.floor(cropW * 0.037);
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(cropW - radius, 0);
    ctx.quadraticCurveTo(cropW, 0, cropW, radius);
    ctx.lineTo(cropW, cropH - radius);
    ctx.quadraticCurveTo(cropW, cropH, cropW - radius, cropH);
    ctx.lineTo(radius, cropH);
    ctx.quadraticCurveTo(0, cropH, 0, cropH - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();
  }
  
  ctx.drawImage(canvas, sx, cardTop, cropW, cropH, 0, 0, cropW, cropH);
  
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
      frontImage: cropFromCanvas(canvas, 'front', crop, roundedCorners),
      backImage: cropFromCanvas(canvas, 'back', crop, roundedCorners),
      fullPageCanvas: canvas,
    };
  } else {
    const canvas1 = await renderPageToCanvas(pdf, 1);
    const canvas2 = await renderPageToCanvas(pdf, 2);
    return {
      frontImage: canvas1.toDataURL('image/png', 1.0),
      backImage: canvas2.toDataURL('image/png', 1.0),
      fullPageCanvas: null,
    };
  }
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
  backImage: string,
  options: PrintOptions = { showBorder: false, roundedCorners: false }
): Blob {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false,
  });
  
  // Official ID-1 standard: 85.6mm × 53.98mm (ISO/IEC 7810)
  const cardW = 85.6;
  const cardH = 53.98;
  // ID-1 corner radius: 3.18mm
  const cornerR = 3.18;
  
  const pageW = 210;
  
  const gap = 4;
  const totalW = cardW * 2 + gap;
  const startX = (pageW - totalW) / 2;
  const y = 15;
  
  pdf.addImage(frontImage, 'PNG', startX, y, cardW, cardH);
  
  if (options.showBorder) {
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([2, 2], 0);
    if (options.roundedCorners) {
      drawRoundedRect(pdf, startX, y, cardW, cardH, cornerR);
    } else {
      pdf.rect(startX, y, cardW, cardH);
    }
  }
  
  pdf.addImage(backImage, 'PNG', startX + cardW + gap, y, cardW, cardH);
  
  if (options.showBorder) {
    if (options.roundedCorners) {
      drawRoundedRect(pdf, startX + cardW + gap, y, cardW, cardH, cornerR);
    } else {
      pdf.rect(startX + cardW + gap, y, cardW, cardH);
    }
  }
  
  return pdf.output('blob');
}
