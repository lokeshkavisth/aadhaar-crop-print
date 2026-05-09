import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ImageFilterControls, type ImageFilters, DEFAULT_FILTERS } from '@/components/ImageFilterControls';
import { CardSizeControls, type CardOutputSize } from '@/components/CardSizeControls';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PrintLayout } from '@/components/PrintLayoutControls';
import { DEFAULT_LAYOUT } from '@/components/PrintLayoutControls';
import { Separator } from '@/components/ui/separator';
import { Palette, Layout, Maximize2, RotateCcw } from 'lucide-react';

interface AdvancedDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: ImageFilters;
  onFiltersChange: (f: ImageFilters) => void;
  layout: PrintLayout;
  onLayoutChange: (l: PrintLayout) => void;
  cardSize: CardOutputSize;
  onCardSizeChange: (s: CardOutputSize) => void;
  onResetAll: () => void;
}

const PRESETS: { label: string; layout: PrintLayout }[] = [
  { label: 'Top Center', layout: { gap: 4, marginTop: 6, marginLeft: 6, autoCenter: true } },
  { label: 'Center Page', layout: { gap: 6, marginTop: 120, marginLeft: 6, autoCenter: true } },
  { label: 'Top Left', layout: { gap: 6, marginTop: 6, marginLeft: 6, autoCenter: false } },
  { label: 'Compact', layout: { gap: 0, marginTop: 5, marginLeft: 0, autoCenter: true } },
];

export function AdvancedDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  layout,
  onLayoutChange,
  cardSize,
  onCardSizeChange,
  onResetAll,
}: AdvancedDrawerProps) {
  const updateLayout = (key: keyof PrintLayout, value: number | boolean) =>
    onLayoutChange({ ...layout, [key]: value });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced settings</SheetTitle>
          <SheetDescription>Filters, output size and fine layout controls.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Filters */}
          <Section icon={Palette} title="Image filters">
            <ImageFilterControls filters={filters} onChange={onFiltersChange} />
          </Section>

          <Separator />

          {/* Output size */}
          <Section icon={Maximize2} title="Output card size">
            <CardSizeControls size={cardSize} onChange={onCardSizeChange} />
          </Section>

          <Separator />

          {/* Layout */}
          <Section icon={Layout} title="Print layout">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onLayoutChange(p.layout)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Gap (mm)</Label>
                <Input
                  type="number" min={0} max={20} step={0.5}
                  value={layout.gap}
                  onChange={(e) => updateLayout('gap', parseFloat(e.target.value) || 0)}
                  className="h-9 num-input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Top margin (mm)</Label>
                <Input
                  type="number" min={2} max={200} step={1}
                  value={layout.marginTop}
                  onChange={(e) => updateLayout('marginTop', parseFloat(e.target.value) || 2)}
                  className="h-9 num-input"
                />
              </div>
              {!layout.autoCenter && (
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Left margin (mm)</Label>
                  <Input
                    type="number" min={2} max={100} step={1}
                    value={layout.marginLeft}
                    onChange={(e) => updateLayout('marginLeft', parseFloat(e.target.value) || 2)}
                    className="h-9 num-input"
                  />
                </div>
              )}
            </div>
          </Section>

          <Separator />

          <Button variant="outline" size="sm" onClick={onResetAll} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset all settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}
