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
const CARD_W = 85.6;
const CARD_H = 53.98;
const CORNER_R = 3.18;

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
    const h = A4_H * scale;

    canvas.width = w * 2; // 2x for sharpness
    canvas.height = h * 2;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    const s = scale * 2;

    // A4 background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (subtle)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= A4_W; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x * s, 0);
      ctx.lineTo(x * s, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= A4_H; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y * s);
      ctx.lineTo(canvas.width, y * s);
      ctx.stroke();
    }

    // Card positions
    const gap = layout.gap;
    const totalW = CARD_W * 2 + gap;
    const startX = layout.autoCenter ? (A4_W - totalW) / 2 : layout.marginLeft;
    const y = layout.marginTop;

    // Draw cards
    const drawCard = (img: HTMLImageElement, cx: number, cy: number) => {
      const x1 = cx * s;
      const y1 = cy * s;
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

    // Page border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Dimension labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = `${10 * (s / 2)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('A4 (210 × 297 mm)', canvas.width / 2, canvas.height - 8 * (s / 2));

    // Card dimension labels
    ctx.font = `${8 * (s / 2)}px Inter, sans-serif`;
    ctx.fillStyle = '#6b7280';
    const frontCx = (startX + CARD_W / 2) * s;
    const backCx = (startX + CARD_W + gap + CARD_W / 2) * s;
    const labelY = (y + CARD_H + 5) * s;
    ctx.fillText('Front (85.6×54mm)', frontCx, labelY);
    ctx.fillText('Back (85.6×54mm)', backCx, labelY);
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
