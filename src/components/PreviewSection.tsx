import { Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewSectionProps {
  frontImage: string;
  backImage: string;
  onDownload: () => void;
  onReset: () => void;
  isGenerating: boolean;
  roundedCorners: boolean;
}

export function PreviewSection({
  frontImage,
  backImage,
  onDownload,
  onReset,
  isGenerating,
  roundedCorners,
}: PreviewSectionProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Front</p>
          <div className={`border border-border overflow-hidden bg-card shadow-sm ${roundedCorners ? 'rounded-xl' : 'rounded-sm'}`}>
            <img src={frontImage} alt="Aadhaar Front" className="w-full h-auto block" />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Back</p>
          <div className={`border border-border overflow-hidden bg-card shadow-sm ${roundedCorners ? 'rounded-xl' : 'rounded-sm'}`}>
            <img src={backImage} alt="Aadhaar Back" className="w-full h-auto block" />
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
