import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { type CropRegion, DEFAULT_CROP } from '@/lib/pdf-processor';

interface ManualCropControlsProps {
  fullPageCanvas: HTMLCanvasElement;
  crop: CropRegion;
  onChange: (crop: CropRegion) => void;
  onApply: () => void;
  onReset: () => void;
}

export function ManualCropControls({
  fullPageCanvas,
  crop,
  onChange,
  onApply,
  onReset,
}: ManualCropControlsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fullPageCanvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const maxW = container.clientWidth;
    const aspect = fullPageCanvas.height / fullPageCanvas.width;
    const w = Math.min(maxW, 500);
    const h = w * aspect;

    canvas.width = w;
    canvas.height = h;
    setPreviewWidth(w);

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    
    // Draw full page dimmed
    ctx.globalAlpha = 0.3;
    ctx.drawImage(fullPageCanvas, 0, 0, w, h);
    ctx.globalAlpha = 1.0;

    // Draw crop regions highlighted
    const top = h * (crop.top / 100);
    const bottom = h * (crop.bottom / 100);
    const ls = w * (crop.leftStart / 100);
    const le = w * (crop.leftEnd / 100);
    const rs = w * (crop.rightStart / 100);
    const re = w * (crop.rightEnd / 100);

    // Front card
    ctx.drawImage(
      fullPageCanvas,
      fullPageCanvas.width * (crop.leftStart / 100),
      fullPageCanvas.height * (crop.top / 100),
      fullPageCanvas.width * ((crop.leftEnd - crop.leftStart) / 100),
      fullPageCanvas.height * ((crop.bottom - crop.top) / 100),
      ls, top, le - ls, bottom - top
    );

    // Back card
    ctx.drawImage(
      fullPageCanvas,
      fullPageCanvas.width * (crop.rightStart / 100),
      fullPageCanvas.height * (crop.top / 100),
      fullPageCanvas.width * ((crop.rightEnd - crop.rightStart) / 100),
      fullPageCanvas.height * ((crop.bottom - crop.top) / 100),
      rs, top, re - rs, bottom - top
    );

    // Draw borders around crop regions
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(ls, top, le - ls, bottom - top);
    ctx.strokeRect(rs, top, re - rs, bottom - top);

    // Labels
    ctx.setLineDash([]);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('Front', ls + 4, top - 4);
    ctx.fillText('Back', rs + 4, top - 4);
  }, [fullPageCanvas, crop, previewWidth]);

  const handleSlider = (key: keyof CropRegion, value: number[]) => {
    onChange({ ...crop, [key]: value[0] });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <h3 className="font-semibold text-foreground">Manual Crop Adjustment</h3>
      
      <div className="overflow-hidden rounded-lg border border-border">
        <canvas ref={canvasRef} className="w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Top Edge (%)</label>
          <Slider
            value={[crop.top]}
            min={50}
            max={90}
            step={0.1}
            onValueChange={(v) => handleSlider('top', v)}
          />
          <span className="text-xs text-muted-foreground">{crop.top.toFixed(1)}%</span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Bottom Edge (%)</label>
          <Slider
            value={[crop.bottom]}
            min={80}
            max={100}
            step={0.1}
            onValueChange={(v) => handleSlider('bottom', v)}
          />
          <span className="text-xs text-muted-foreground">{crop.bottom.toFixed(1)}%</span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Left Margin (%)</label>
          <Slider
            value={[crop.leftStart]}
            min={0}
            max={10}
            step={0.1}
            onValueChange={(v) => handleSlider('leftStart', v)}
          />
          <span className="text-xs text-muted-foreground">{crop.leftStart.toFixed(1)}%</span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Right Margin (%)</label>
          <Slider
            value={[crop.rightEnd]}
            min={90}
            max={100}
            step={0.1}
            onValueChange={(v) => handleSlider('rightEnd', v)}
          />
          <span className="text-xs text-muted-foreground">{crop.rightEnd.toFixed(1)}%</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onApply} className="flex-1">Apply Crop</Button>
        <Button variant="outline" onClick={onReset}>Reset to Default</Button>
      </div>
    </div>
  );
}
