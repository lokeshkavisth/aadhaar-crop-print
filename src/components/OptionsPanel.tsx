import { Settings2, Palette, Layout, Crop, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageFilterControls, type ImageFilters } from '@/components/ImageFilterControls';
import { type PrintLayout } from '@/components/PrintLayoutControls';
import { CardSizeControls, type CardOutputSize } from '@/components/CardSizeControls';
import { useState } from 'react';

interface OptionsPanelProps {
  showBorder: boolean;
  onBorderToggle: (v: boolean) => void;
  roundedCorners: boolean;
  onRoundedToggle: (v: boolean) => void;
  filters: ImageFilters;
  onFiltersChange: (f: ImageFilters) => void;
  layout: PrintLayout;
  onLayoutChange: (l: PrintLayout) => void;
  canManualCrop: boolean;
  onManualCrop: () => void;
  cardSize: CardOutputSize;
  onCardSizeChange: (s: CardOutputSize) => void;
}

function SectionCollapsible({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border/50 rounded-lg overflow-hidden">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OptionsPanel({
  showBorder,
  onBorderToggle,
  roundedCorners,
  onRoundedToggle,
  filters,
  onFiltersChange,
  layout,
  onLayoutChange,
  canManualCrop,
  onManualCrop,
  cardSize,
  onCardSizeChange,
}: OptionsPanelProps) {
  const updateLayout = (key: keyof PrintLayout, value: number | boolean) => {
    onLayoutChange({ ...layout, [key]: value });
  };

  return (
    <div className="space-y-3">
      {/* General */}
      <SectionCollapsible icon={Settings2} title="General" defaultOpen>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
          <Label htmlFor="rounded-opt" className="text-sm text-foreground cursor-pointer">
            Rounded corners
          </Label>
          <Switch id="rounded-opt" checked={roundedCorners} onCheckedChange={onRoundedToggle} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
          <Label htmlFor="border-opt" className="text-sm text-foreground cursor-pointer">
            Cut border in PDF
          </Label>
          <Switch id="border-opt" checked={showBorder} onCheckedChange={onBorderToggle} />
        </div>
        <CardSizeControls size={cardSize} onChange={onCardSizeChange} />
        {canManualCrop && (
          <Button variant="outline" size="sm" onClick={onManualCrop} className="w-full gap-2">
            <Crop className="h-4 w-4" />
            Adjust Crop Region
          </Button>
        )}
      </SectionCollapsible>

      {/* Filters */}
      <SectionCollapsible icon={Palette} title="Filters">
        <ImageFilterControls filters={filters} onChange={onFiltersChange} />
      </SectionCollapsible>

      {/* Layout */}
      <SectionCollapsible icon={Layout} title="Print Layout">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Top Center', l: { gap: 4, marginTop: 6, marginLeft: 6, autoCenter: true } },
            { label: 'Center Page', l: { gap: 6, marginTop: 120, marginLeft: 6, autoCenter: true } },
            { label: 'Top Left', l: { gap: 6, marginTop: 6, marginLeft: 6, autoCenter: false } },
            { label: 'Compact', l: { gap: 0, marginTop: 5, marginLeft: 0, autoCenter: true } },
          ].map((p) => (
            <Button key={p.label} variant="outline" size="sm" className="text-xs" onClick={() => onLayoutChange(p.l)}>
              {p.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Card Gap (mm)</Label>
            <Input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={layout.gap}
              onChange={(e) => updateLayout('gap', parseFloat(e.target.value) || 0)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Top Margin (mm)</Label>
            <Input
              type="number"
              min={2}
              max={200}
              step={1}
              value={layout.marginTop}
              onChange={(e) => updateLayout('marginTop', parseFloat(e.target.value) || 2)}
              className="h-9"
            />
          </div>
        </div>

        {!layout.autoCenter && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Left Margin (mm)</Label>
            <Input
              type="number"
              min={2}
              max={100}
              step={1}
              value={layout.marginLeft}
              onChange={(e) => updateLayout('marginLeft', parseFloat(e.target.value) || 2)}
              className="h-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-center"
            checked={layout.autoCenter}
            onChange={(e) => updateLayout('autoCenter', e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary accent-primary"
          />
          <Label htmlFor="auto-center" className="text-xs text-muted-foreground cursor-pointer">
            Auto-center horizontally
          </Label>
        </div>
      </SectionCollapsible>
    </div>
  );
}
