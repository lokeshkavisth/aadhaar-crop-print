import { Settings2, Palette, Layout, Crop } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageFilterControls, type ImageFilters } from '@/components/ImageFilterControls';
import { PrintLayoutControls, type PrintLayout } from '@/components/PrintLayoutControls';

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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-muted/50 h-auto p-0">
          <TabsTrigger
            value="general"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-xs gap-1.5"
          >
            <Settings2 className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="filters"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-xs gap-1.5"
          >
            <Palette className="h-3.5 w-3.5" />
            Filters
          </TabsTrigger>
          <TabsTrigger
            value="layout"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-xs gap-1.5"
          >
            <Layout className="h-3.5 w-3.5" />
            Layout
          </TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Switch
                  id="rounded-opt"
                  checked={roundedCorners}
                  onCheckedChange={onRoundedToggle}
                />
                <Label htmlFor="rounded-opt" className="text-sm text-foreground cursor-pointer">
                  Rounded corners
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Switch
                  id="border-opt"
                  checked={showBorder}
                  onCheckedChange={onBorderToggle}
                />
                <Label htmlFor="border-opt" className="text-sm text-foreground cursor-pointer">
                  Cut border in PDF
                </Label>
              </div>
            </div>
            {canManualCrop && (
              <Button variant="outline" size="sm" onClick={onManualCrop} className="w-full sm:w-auto">
                <Crop className="h-4 w-4 mr-2" />
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
