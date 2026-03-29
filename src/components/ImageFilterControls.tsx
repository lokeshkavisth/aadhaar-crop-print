import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface ImageFilters {
  brightness: number;  // 0.5 – 2.0 (1 = normal)
  contrast: number;    // 0.5 – 2.0 (1 = normal)
  sharpen: number;     // 0 – 2 (0 = off)
  grayscale: boolean;
}

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 1,
  contrast: 1,
  sharpen: 0,
  grayscale: false,
};

interface ImageFilterControlsProps {
  filters: ImageFilters;
  onChange: (filters: ImageFilters) => void;
}

export function ImageFilterControls({ filters, onChange }: ImageFilterControlsProps) {
  const update = (key: keyof ImageFilters, value: number | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const isDefault =
    filters.brightness === 1 &&
    filters.contrast === 1 &&
    filters.sharpen === 0 &&
    !filters.grayscale;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Brightness ({Math.round(filters.brightness * 100)}%)
          </Label>
          <Slider
            value={[filters.brightness]}
            min={0.5}
            max={2}
            step={0.05}
            onValueChange={(v) => update('brightness', v[0])}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Contrast ({Math.round(filters.contrast * 100)}%)
          </Label>
          <Slider
            value={[filters.contrast]}
            min={0.5}
            max={2}
            step={0.05}
            onValueChange={(v) => update('contrast', v[0])}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Sharpen ({filters.sharpen.toFixed(1)})
          </Label>
          <Slider
            value={[filters.sharpen]}
            min={0}
            max={2}
            step={0.1}
            onValueChange={(v) => update('sharpen', v[0])}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Switch
            id="grayscale-toggle"
            checked={filters.grayscale}
            onCheckedChange={(v) => update('grayscale', v)}
          />
          <Label htmlFor="grayscale-toggle" className="text-xs text-muted-foreground cursor-pointer">
            Grayscale
          </Label>
        </div>
      </div>

      {!isDefault && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onChange(DEFAULT_FILTERS)}
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
}
