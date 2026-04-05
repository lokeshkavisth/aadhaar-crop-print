import { Settings2, Palette, Layout, Crop } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageFilterControls, type ImageFilters } from '@/components/ImageFilterControls';
import { PrintLayoutControls, type PrintLayout } from '@/components/PrintLayoutControls';
import { CardSizeControls, type CardOutputSize } from '@/components/CardSizeControls';

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
}: OptionsPanelProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border/50 bg-muted/30 h-auto p-0">
          <TabsTrigger
            value="general"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-xs gap-1.5 font-medium"
          >
            <Settings2 className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="filters"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-xs gap-1.5 font-medium"
          >
            <Palette className="h-3.5 w-3.5" />
            Filters
          </TabsTrigger>
          <TabsTrigger
            value="layout"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-xs gap-1.5 font-medium"
          >
            <Layout className="h-3.5 w-3.5" />
            Layout
          </TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <Label htmlFor="rounded-opt" className="text-sm text-foreground cursor-pointer">
                  Rounded corners
                </Label>
                <Switch
                  id="rounded-opt"
                  checked={roundedCorners}
                  onCheckedChange={onRoundedToggle}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <Label htmlFor="border-opt" className="text-sm text-foreground cursor-pointer">
                  Cut border in PDF
                </Label>
                <Switch
                  id="border-opt"
                  checked={showBorder}
                  onCheckedChange={onBorderToggle}
                />
              </div>
            </div>
            {canManualCrop && (
              <Button variant="outline" size="sm" onClick={onManualCrop} className="w-full gap-2">
                <Crop className="h-4 w-4" />
                Adjust Crop Region
              </Button>
            )}
          </TabsContent>

          <TabsContent value="filters" className="mt-0">
            <ImageFilterControls filters={filters} onChange={onFiltersChange} />
          </TabsContent>

          <TabsContent value="layout" className="mt-0">
            <PrintLayoutControls layout={layout} onChange={onLayoutChange} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
