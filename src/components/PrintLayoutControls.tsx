import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface PrintLayout {
  gap: number;        // mm between cards
  marginTop: number;  // mm from top
  marginLeft: number; // mm from left (auto-center if 0)
  autoCenter: boolean;
}

export const DEFAULT_LAYOUT: PrintLayout = {
  gap: 6,
  marginTop: 6,
  marginLeft: 6,
  autoCenter: true,
};

const PRESETS: { label: string; layout: PrintLayout }[] = [
  { label: 'Top Center', layout: { gap: 6, marginTop: 6, marginLeft: 6, autoCenter: true } },
  { label: 'Center Page', layout: { gap: 6, marginTop: 120, marginLeft: 6, autoCenter: true } },
  { label: 'Top Left', layout: { gap: 6, marginTop: 6, marginLeft: 6, autoCenter: false } },
  { label: 'Compact', layout: { gap: 0, marginTop: 5, marginLeft: 0, autoCenter: true } },
];

interface PrintLayoutControlsProps {
  layout: PrintLayout;
  onChange: (layout: PrintLayout) => void;
}

export function PrintLayoutControls({ layout, onChange }: PrintLayoutControlsProps) {
  const update = (key: keyof PrintLayout, value: number | boolean) => {
    onChange({ ...layout, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onChange(p.layout)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Card Gap ({layout.gap}mm)</Label>
          <Slider
            value={[layout.gap]}
            min={0}
            max={20}
            step={0.5}
            onValueChange={(v) => update('gap', v[0])}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Top Margin ({layout.marginTop}mm)</Label>
          <Slider
            value={[layout.marginTop]}
            min={2}
            max={200}
            step={1}
            onValueChange={(v) => update('marginTop', v[0])}
          />
        </div>

        {!layout.autoCenter && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Left Margin ({layout.marginLeft}mm)</Label>
            <Slider
              value={[layout.marginLeft]}
              min={2}
              max={100}
              step={1}
              onValueChange={(v) => update('marginLeft', v[0])}
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="auto-center"
            checked={layout.autoCenter}
            onChange={(e) => update('autoCenter', e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary accent-primary"
          />
          <Label htmlFor="auto-center" className="text-xs text-muted-foreground cursor-pointer">
            Auto-center horizontally
          </Label>
        </div>
      </div>
    </div>
  );
}
