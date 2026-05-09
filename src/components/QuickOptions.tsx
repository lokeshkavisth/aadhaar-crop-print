import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sliders, Crop } from 'lucide-react';
import type { PrintLayout } from '@/components/PrintLayoutControls';
import type { CardOutputSize } from '@/components/CardSizeControls';
import { computeAutoHeight } from '@/components/CardSizeControls';

interface QuickOptionsProps {
  showBorder: boolean;
  onBorderToggle: (v: boolean) => void;
  roundedCorners: boolean;
  onRoundedToggle: (v: boolean) => void;
  layout: PrintLayout;
  onLayoutChange: (l: PrintLayout) => void;
  cardSize: CardOutputSize;
  onCardSizeChange: (s: CardOutputSize) => void;
  canManualCrop: boolean;
  onManualCrop: () => void;
  onOpenAdvanced: () => void;
}

export function QuickOptions({
  showBorder,
  onBorderToggle,
  roundedCorners,
  onRoundedToggle,
  layout,
  onLayoutChange,
  cardSize,
  onCardSizeChange,
  canManualCrop,
  onManualCrop,
  onOpenAdvanced,
}: QuickOptionsProps) {
  const updateLayout = (key: keyof PrintLayout, value: number | boolean) =>
    onLayoutChange({ ...layout, [key]: value });

  const updateWidth = (val: string) => {
    const w = Math.max(100, parseInt(val) || 100);
    onCardSizeChange({
      ...cardSize,
      width: w,
      height: cardSize.autoHeight ? computeAutoHeight(w) : cardSize.height,
    });
  };

  return (
    <div className="surface-card p-3 space-y-3">
      {/* Toggle row */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 cursor-pointer">
          <span className="text-xs font-medium">Rounded</span>
          <Switch checked={roundedCorners} onCheckedChange={onRoundedToggle} />
        </label>
        <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 cursor-pointer">
          <span className="text-xs font-medium">Cut border</span>
          <Switch checked={showBorder} onCheckedChange={onBorderToggle} />
        </label>
      </div>

      {/* Numeric grid */}
      <div className="grid grid-cols-3 gap-2">
        <Field label="Width (px)">
          <Input
            type="number"
            value={cardSize.width}
            onChange={(e) => updateWidth(e.target.value)}
            className="h-8 text-xs num-input"
          />
        </Field>
        <Field label="Gap (mm)">
          <Input
            type="number"
            min={0}
            max={20}
            step={0.5}
            value={layout.gap}
            onChange={(e) => updateLayout('gap', parseFloat(e.target.value) || 0)}
            className="h-8 text-xs num-input"
          />
        </Field>
        <Field label="Top (mm)">
          <Input
            type="number"
            min={2}
            max={200}
            step={1}
            value={layout.marginTop}
            onChange={(e) => updateLayout('marginTop', parseFloat(e.target.value) || 2)}
            className="h-8 text-xs num-input"
          />
        </Field>
      </div>

      <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40 cursor-pointer">
        <span className="text-xs text-muted-foreground">Auto-center horizontally</span>
        <Switch
          checked={layout.autoCenter}
          onCheckedChange={(v) => updateLayout('autoCenter', v)}
        />
      </label>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {canManualCrop && (
          <Button variant="outline" size="sm" onClick={onManualCrop} className="flex-1 gap-1.5 text-xs">
            <Crop className="h-3.5 w-3.5" />
            Crop
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onOpenAdvanced} className="flex-1 gap-1.5 text-xs">
          <Sliders className="h-3.5 w-3.5" />
          Advanced
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
