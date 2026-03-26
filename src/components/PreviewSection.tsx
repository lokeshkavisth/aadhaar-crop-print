import { Download, RotateCcw, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PreviewSectionProps {
  frontImage: string;
  backImage: string;
  onDownload: () => void;
  onReset: () => void;
  isGenerating: boolean;
  showBorder: boolean;
  onBorderToggle: (v: boolean) => void;
  canManualCrop: boolean;
  onManualCrop: () => void;
}

export function PreviewSection({
  frontImage,
  backImage,
  onDownload,
  onReset,
  isGenerating,
  showBorder,
  onBorderToggle,
  canManualCrop,
  onManualCrop,
}: PreviewSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Front Side</p>
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <img src={frontImage} alt="Aadhaar Front" className="w-full h-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Back Side</p>
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <img src={backImage} alt="Aadhaar Back" className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Switch
            id="border-toggle"
            checked={showBorder}
            onCheckedChange={onBorderToggle}
          />
          <Label htmlFor="border-toggle" className="text-sm text-foreground cursor-pointer">
            Show cut border in PDF
          </Label>
        </div>
        {canManualCrop && (
          <Button variant="outline" size="sm" onClick={onManualCrop}>
            <Crop className="h-4 w-4 mr-2" />
            Adjust Crop
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="success"
          size="lg"
          className="flex-1 text-base"
          onClick={onDownload}
          disabled={isGenerating}
        >
          <Download className="h-5 w-5 mr-2" />
          {isGenerating ? 'Generating PDF...' : 'Download Print-Ready PDF'}
        </Button>
        <Button variant="outline" size="lg" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
