import { Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewSectionProps {
  frontImage: string;
  backImage: string;
  onDownload: () => void;
  onReset: () => void;
  isGenerating: boolean;
}

export function PreviewSection({
  frontImage,
  backImage,
  onDownload,
  onReset,
  isGenerating,
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
