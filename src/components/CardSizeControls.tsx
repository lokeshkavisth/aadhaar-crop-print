import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export interface CardOutputSize {
  width: number;
  height: number;
  autoHeight: boolean;
}

// Standard Aadhaar card aspect ratio (85.6 × 53.98 mm)
const CARD_ASPECT = 53.98 / 85.6;

export const DEFAULT_CARD_SIZE: CardOutputSize = {
  width: 1012,
  height: 638,
  autoHeight: true,
};

export function computeAutoHeight(width: number): number {
  return Math.round(width * CARD_ASPECT);
}

interface CardSizeControlsProps {
  size: CardOutputSize;
  onChange: (size: CardOutputSize) => void;
}

export function CardSizeControls({ size, onChange }: CardSizeControlsProps) {
  const handleWidthChange = (val: string) => {
    const w = Math.max(1, parseInt(val) || 1);
    onChange({
      ...size,
      width: w,
      height: size.autoHeight ? computeAutoHeight(w) : size.height,
    });
  };

  const handleHeightChange = (val: string) => {
    if (size.autoHeight) return;
    const h = Math.max(1, parseInt(val) || 1);
    onChange({ ...size, height: h });
  };

  const handleAutoToggle = (enabled: boolean) => {
    onChange({
      ...size,
      autoHeight: enabled,
      height: enabled ? computeAutoHeight(size.width) : size.height,
    });
  };

  const handlePreset = (w: number) => {
    onChange({
      width: w,
      height: computeAutoHeight(w),
      autoHeight: true,
    });
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground font-medium">Output Card Size (px)</Label>

      <div className="flex flex-wrap gap-1.5">
        {[640, 800, 1012, 1280].map((w) => (
          <Button
            key={w}
            variant={size.width === w && size.autoHeight ? 'default' : 'outline'}
            size="sm"
            className="text-[11px] h-7 px-2.5"
            onClick={() => handlePreset(w)}
          >
            {w}px
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="card-w" className="text-[11px] text-muted-foreground">Width</Label>
          <Input
            id="card-w"
            type="number"
            min={100}
            max={4000}
            value={size.width}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="card-h" className="text-[11px] text-muted-foreground">Height</Label>
          <Input
            id="card-h"
            type="number"
            min={100}
            max={4000}
            value={size.height}
            onChange={(e) => handleHeightChange(e.target.value)}
            disabled={size.autoHeight}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
        <Label htmlFor="auto-h" className="text-xs text-foreground cursor-pointer">
          Auto height (maintain ratio)
        </Label>
        <Switch
          id="auto-h"
          checked={size.autoHeight}
          onCheckedChange={handleAutoToggle}
        />
      </div>
    </div>
  );
}
