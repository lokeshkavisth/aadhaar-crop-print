import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const RENDER_SCALE = 3; // High quality rendering (300 DPI equivalent)

export interface ProcessingResult {
  frontImage: string;
  backImage: string;
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

async function renderPageToCanvas(
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

function cropAadhaarRegion(
  canvas: HTMLCanvasElement,
  side: 'front' | 'back'
): string {
  // Standard Aadhaar PDF layout: page is divided into top (front) and bottom (back)
  // or it may be two separate pages. We handle both cases.
  const cropCanvas = document.createElement('canvas');
  const ctx = cropCanvas.getContext('2d')!;
  
  const w = canvas.width;
  const h = canvas.height;
  
  // Aadhaar card aspect ratio is roughly 3.37 x 2.13 inches (credit card size)
  // In the PDF, front is typically top half, back is bottom half
  const halfH = Math.floor(h / 2);
  
  // Add small margins to avoid edge artifacts
  const margin = Math.floor(w * 0.02);
  const cropW = w - margin * 2;
  const cropH = halfH - margin;
  
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  
  const sy = side === 'front' ? margin : halfH;
  
  ctx.drawImage(canvas, margin, sy, cropW, cropH, 0, 0, cropW, cropH);
  
  return cropCanvas.toDataURL('image/png', 1.0);
}

export async function processAadhaarPdf(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<ProcessingResult> {
  const numPages = pdf.numPages;
  
  if (numPages === 1) {
    // Single page: front on top half, back on bottom half
    const canvas = await renderPageToCanvas(pdf, 1);
    return {
      frontImage: cropAadhaarRegion(canvas, 'front'),
      backImage: cropAadhaarRegion(canvas, 'back'),
    };
  } else {
    // Multi-page: page 1 = front, page 2 = back
    const canvas1 = await renderPageToCanvas(pdf, 1);
    const canvas2 = await renderPageToCanvas(pdf, 2);
    return {
      frontImage: canvas1.toDataURL('image/png', 1.0),
      backImage: canvas2.toDataURL('image/png', 1.0),
    };
  }
}

export function generatePrintPdf(frontImage: string, backImage: string): Blob {
  // A4 size in mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false, // No compression for max quality
  });
  
  // Aadhaar card standard size: 85.6mm x 53.98mm (credit card)
  const cardW = 85.6;
  const cardH = 54;
  
  // Center on page
  const pageW = 210;
  const pageH = 297;
  const x = (pageW - cardW) / 2;
  
  // Front side
  const frontY = 30;
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text('Aadhaar Card - Front', pageW / 2, frontY - 5, { align: 'center' });
  pdf.addImage(frontImage, 'PNG', x, frontY, cardW, cardH);
  
  // Draw border
  pdf.setDrawColor(200);
  pdf.setLineWidth(0.3);
  pdf.rect(x, frontY, cardW, cardH);
  
  // Back side
  const backY = frontY + cardH + 20;
  pdf.text('Aadhaar Card - Back', pageW / 2, backY - 5, { align: 'center' });
  pdf.addImage(backImage, 'PNG', x, backY, cardW, cardH);
  pdf.rect(x, backY, cardW, cardH);
  
  // Cut line instructions
  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text('Cut along the border lines', pageW / 2, backY + cardH + 10, { align: 'center' });
  
  return pdf.output('blob');
}
