import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const RENDER_SCALE = 4; // 400 DPI for maximum quality

export interface CropRegion {
  top: number;    // percentage 0-100
  bottom: number; // percentage 0-100
  leftStart: number;  // percentage 0-100
  leftEnd: number;    // percentage 0-100
  rightStart: number; // percentage 0-100
  rightEnd: number;   // percentage 0-100
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
  crop: CropRegion
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
  
  // Render at exact ID-1 ratio (85.6 / 53.98 ≈ 1.586) at high res
  // Output canvas at native crop resolution for max quality
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  
  ctx.drawImage(canvas, sx, cardTop, cropW, cropH, 0, 0, cropW, cropH);
  
  return cropCanvas.toDataURL('image/png', 1.0);
}

export async function processAadhaarPdf(
  pdf: pdfjsLib.PDFDocumentProxy,
  crop: CropRegion = DEFAULT_CROP
): Promise<ProcessingResult> {
  const numPages = pdf.numPages;
  
  if (numPages === 1) {
    const canvas = await renderPageToCanvas(pdf, 1);
    return {
      frontImage: cropFromCanvas(canvas, 'front', crop),
      backImage: cropFromCanvas(canvas, 'back', crop),
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

export function generatePrintPdf(
  frontImage: string,
  backImage: string,
  options: PrintOptions = { showBorder: false }
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
  
  const pageW = 210;
  
  // Side-by-side layout
  const gap = 4;
  const totalW = cardW * 2 + gap;
  const startX = (pageW - totalW) / 2;
  const y = 15;
  
  // Use JPEG format in jsPDF for better quality handling with addImage
  pdf.addImage(frontImage, 'PNG', startX, y, cardW, cardH);
  
  if (options.showBorder) {
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.2);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.rect(startX, y, cardW, cardH);
  }
  
  pdf.addImage(backImage, 'PNG', startX + cardW + gap, y, cardW, cardH);
  
  if (options.showBorder) {
    pdf.rect(startX + cardW + gap, y, cardW, cardH);
  }
  
  return pdf.output('blob');
}
