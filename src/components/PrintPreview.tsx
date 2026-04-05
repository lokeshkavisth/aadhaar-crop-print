import { useEffect, useRef } from 'react';
import type { PrintLayout } from '@/components/PrintLayoutControls';

interface PrintPreviewProps {
  frontImage: string;
  backImage: string;
  showBorder: boolean;
  roundedCorners: boolean;
  layout: PrintLayout;
}

const A4_W = 210; // mm
const A4_H = 297;
const PREVIEW_H = 100; // mm – only show top portion of A4
const CARD_W = 85.6;
const CARD_H = 53.98;
const CORNER_R = 3.18;
const RULER_SIZE = 14; // px at 1x – ruler gutter width

export function PrintPreview({
  frontImage,
  backImage,
  showBorder,
  roundedCorners,
  layout,
}: PrintPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontImgRef = useRef<HTMLImageElement | null>(null);
  const backImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const fi = new Image();
    fi.src = frontImage;
    fi.onload = () => {
      frontImgRef.current = fi;
      draw();
    };
    const bi = new Image();
    bi.src = backImage;
    bi.onload = () => {
      backImgRef.current = bi;
      draw();
    };
  }, [frontImage, backImage]);

  useEffect(() => {
    draw();
  }, [showBorder, roundedCorners, layout]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !frontImgRef.current || !backImgRef.current) return;

    const container = canvas.parentElement;
    if (!container) return;

    const maxW = container.clientWidth;
    const scale = maxW / A4_W;
    const w = maxW;
    const h = PREVIEW_H * scale;

    canvas.width = w * 2; // 2x for sharpness
    canvas.height = h * 2;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    const s = scale * 2;

    const rulerPx = RULER_SIZE * 2; // 2x for retina

    // Full background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // A4 paper area (offset by ruler)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rulerPx, rulerPx, canvas.width - rulerPx, canvas.height - rulerPx);

    // Grid lines (subtle) inside paper
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= A4_W; x += 10) {
      ctx.beginPath();
      ctx.moveTo(rulerPx + x * s, rulerPx);
      ctx.lineTo(rulerPx + x * s, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= PREVIEW_H; y += 10) {
      ctx.beginPath();
      ctx.moveTo(rulerPx, rulerPx + y * s);
      ctx.lineTo(canvas.width, rulerPx + y * s);
      ctx.stroke();
    }

    // ---- Horizontal ruler (top) ----
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(rulerPx, 0, canvas.width - rulerPx, rulerPx);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerPx, rulerPx);
    ctx.lineTo(canvas.width, rulerPx);
    ctx.stroke();

    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const rulerFont = Math.max(8, 9 * (s / 2));
    ctx.font = `${rulerFont}px Inter, sans-serif`;

    for (let mm = 0; mm <= A4_W; mm += 5) {
      const xPos = rulerPx + mm * s;
      const isMajor = mm % 10 === 0;
      const tickH = isMajor ? rulerPx * 0.55 : rulerPx * 0.3;
      ctx.strokeStyle = isMajor ? '#9ca3af' : '#d1d5db';
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(xPos, rulerPx);
      ctx.lineTo(xPos, rulerPx - tickH);
      ctx.stroke();
      if (isMajor && mm > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`${mm}`, xPos, rulerPx - tickH - 1);
      }
    }
    // "mm" label
    ctx.fillStyle = '#9ca3af';
    ctx.font = `italic ${rulerFont * 0.85}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('mm', rulerPx + 3, rulerPx - 3);

    // ---- Vertical ruler (left) ----
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, rulerPx, rulerPx, canvas.height - rulerPx);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rulerPx, rulerPx);
    ctx.lineTo(rulerPx, canvas.height);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `${rulerFont}px Inter, sans-serif`;

    for (let mm = 0; mm <= PREVIEW_H; mm += 5) {
      const yPos = rulerPx + mm * s;
      const isMajor = mm % 10 === 0;
      const tickW = isMajor ? rulerPx * 0.55 : rulerPx * 0.3;
      ctx.strokeStyle = isMajor ? '#9ca3af' : '#d1d5db';
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(rulerPx, yPos);
      ctx.lineTo(rulerPx - tickW, yPos);
      ctx.stroke();
      if (isMajor && mm > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`${mm}`, rulerPx - tickW - 2, yPos);
      }
    }

    // Corner box
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, 0, rulerPx, rulerPx);

    // Card positions
    const gap = layout.gap;
    const totalW = CARD_W * 2 + gap;
    const startX = layout.autoCenter ? (A4_W - totalW) / 2 : layout.marginLeft;
    const y = layout.marginTop;

    // Draw cards (offset by ruler)
    const drawCard = (img: HTMLImageElement, cx: number, cy: number) => {
      const x1 = rulerPx + cx * s;
      const y1 = rulerPx + cy * s;
      const cw = CARD_W * s;
      const ch = CARD_H * s;
      const r = CORNER_R * s;

      ctx.save();
      if (roundedCorners) {
        ctx.beginPath();
        ctx.moveTo(x1 + r, y1);
        ctx.lineTo(x1 + cw - r, y1);
        ctx.quadraticCurveTo(x1 + cw, y1, x1 + cw, y1 + r);
        ctx.lineTo(x1 + cw, y1 + ch - r);
        ctx.quadraticCurveTo(x1 + cw, y1 + ch, x1 + cw - r, y1 + ch);
        ctx.lineTo(x1 + r, y1 + ch);
        ctx.quadraticCurveTo(x1, y1 + ch, x1, y1 + ch - r);
        ctx.lineTo(x1, y1 + r);
        ctx.quadraticCurveTo(x1, y1, x1 + r, y1);
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(img, x1, y1, cw, ch);
      ctx.restore();

      if (showBorder) {
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        if (roundedCorners) {
          ctx.beginPath();
          ctx.moveTo(x1 + r, y1);
          ctx.lineTo(x1 + cw - r, y1);
          ctx.quadraticCurveTo(x1 + cw, y1, x1 + cw, y1 + r);
          ctx.lineTo(x1 + cw, y1 + ch - r);
          ctx.quadraticCurveTo(x1 + cw, y1 + ch, x1 + cw - r, y1 + ch);
          ctx.lineTo(x1 + r, y1 + ch);
          ctx.quadraticCurveTo(x1, y1 + ch, x1, y1 + ch - r);
          ctx.lineTo(x1, y1 + r);
          ctx.quadraticCurveTo(x1, y1, x1 + r, y1);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(x1, y1, cw, ch);
        }
        ctx.setLineDash([]);
      }
    };

    drawCard(frontImgRef.current, startX, y);
    drawCard(backImgRef.current, startX + CARD_W + gap, y);

    // Card dimension labels (offset by ruler)
    ctx.font = `${8 * (s / 2)}px Inter, sans-serif`;
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const frontCx = rulerPx + (startX + CARD_W / 2) * s;
    const backCx = rulerPx + (startX + CARD_W + gap + CARD_W / 2) * s;
    const labelY = rulerPx + (y + CARD_H + 3) * s;
    ctx.fillText('Front — 85.6 × 54 mm', frontCx, labelY);
    ctx.fillText('Back — 85.6 × 54 mm', backCx, labelY);

    // Paper border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(rulerPx, rulerPx, canvas.width - rulerPx, canvas.height - rulerPx);
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Print Layout Preview</p>
      <div className="w-full shadow-sm rounded overflow-hidden">
        <canvas ref={canvasRef} className="w-full" />
      </div>
    </div>
  );
}
