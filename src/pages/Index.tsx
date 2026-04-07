import { useState, useCallback } from 'react';
import { Shield, Loader2, Download, Printer, RotateCcw, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { PasswordInput } from '@/components/PasswordInput';
import { ManualCropControls } from '@/components/ManualCropControls';
import { StepsGuide } from '@/components/StepsGuide';
import { OptionsPanel } from '@/components/OptionsPanel';
import { PrintPreview } from '@/components/PrintPreview';
import { DEFAULT_LAYOUT, type PrintLayout } from '@/components/PrintLayoutControls';
import { DEFAULT_FILTERS, type ImageFilters } from '@/components/ImageFilterControls';
import { DEFAULT_CARD_SIZE, type CardOutputSize } from '@/components/CardSizeControls';
import {
  checkIfPasswordProtected,
  loadPdf,
  processAadhaarPdf,
  generatePrintPdf,
  cropFromCanvas,
  DEFAULT_CROP,
  type ProcessingResult,
  type CropRegion,
} from '@/lib/pdf-processor';

type AppState = 'idle' | 'checking' | 'needs-password' | 'processing' | 'preview' | 'manual-crop';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<AppState>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBorder, setShowBorder] = useState(false);
  const [roundedCorners, setRoundedCorners] = useState(false);
  const [crop, setCrop] = useState<CropRegion>(DEFAULT_CROP);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [layout, setLayout] = useState<PrintLayout>(DEFAULT_LAYOUT);
  const [filters, setFilters] = useState<ImageFilters>(DEFAULT_FILTERS);
  const [cardSize, setCardSize] = useState<CardOutputSize>(DEFAULT_CARD_SIZE);

  const pdfOptions = {
    showBorder,
    roundedCorners,
    gap: layout.gap,
    marginTop: layout.marginTop,
    marginLeft: layout.marginLeft,
    autoCenter: layout.autoCenter,
  };

  const reprocessWithOptions = useCallback((
    canvas: HTMLCanvasElement,
    cropRegion: CropRegion,
    rounded: boolean,
    imgFilters: ImageFilters,
    outputSize?: { width: number; height: number }
  ) => {
    const sz = outputSize ?? { width: cardSize.width, height: cardSize.height };
    setResult({
      frontImage: cropFromCanvas(canvas, 'front', cropRegion, rounded, imgFilters, sz),
      backImage: cropFromCanvas(canvas, 'back', cropRegion, rounded, imgFilters, sz),
      fullPageCanvas: canvas,
    });
  }, [cardSize]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setPasswordError(null);
    setState('checking');
    try {
      const isProtected = await checkIfPasswordProtected(selectedFile);
      if (isProtected) {
        setState('needs-password');
      } else {
        setState('processing');
        const pdf = await loadPdf(selectedFile);
        setPdfDoc(pdf);
        const processed = await processAadhaarPdf(pdf, DEFAULT_CROP, false);
        setResult(processed);
        setState('preview');
      }
    } catch {
      setState('idle');
      setFile(null);
      setPasswordError('Invalid PDF file. Please try again.');
    }
  }, []);

  const handlePasswordSubmit = useCallback(async (password: string) => {
    if (!file) return;
    setPasswordError(null);
    setState('processing');
    try {
      const pdf = await loadPdf(file, password);
      setPdfDoc(pdf);
      const processed = await processAadhaarPdf(pdf, DEFAULT_CROP, false);
      setResult(processed);
      setState('preview');
    } catch (error: any) {
      if (error?.name === 'PasswordException') {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        setPasswordError('Failed to process PDF. Please try again.');
      }
      setState('needs-password');
    }
  }, [file]);

  const handleRoundedToggle = useCallback((enabled: boolean) => {
    setRoundedCorners(enabled);
    if (result?.fullPageCanvas) {
      reprocessWithOptions(result.fullPageCanvas, crop, enabled, filters);
    }
  }, [result, crop, filters, reprocessWithOptions]);

  const handleFiltersChange = useCallback((newFilters: ImageFilters) => {
    setFilters(newFilters);
    if (result?.fullPageCanvas) {
      reprocessWithOptions(result.fullPageCanvas, crop, roundedCorners, newFilters);
    }
  }, [result, crop, roundedCorners, reprocessWithOptions]);

  const createPdfBlob = useCallback(() => {
    if (!result) return null;
    return generatePrintPdf(result.frontImage, result.backImage, pdfOptions);
  }, [result, pdfOptions]);

  const handleDownload = useCallback(() => {
    setIsGenerating(true);
    try {
      const blob = createPdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aadhaar-print-ready.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }, [createPdfBlob]);

  const handlePrint = useCallback(() => {
    const blob = createPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  }, [createPdfBlob]);

  const handleReset = useCallback(() => {
    setFile(null);
    setState('idle');
    setResult(null);
    setPasswordError(null);
    setCrop(DEFAULT_CROP);
    setPdfDoc(null);
    setRoundedCorners(false);
    setShowBorder(false);
    setLayout(DEFAULT_LAYOUT);
    setFilters(DEFAULT_FILTERS);
    setCardSize(DEFAULT_CARD_SIZE);
    
  }, []);

  const handleManualCrop = useCallback(() => {
    setState('manual-crop');
  }, []);

  const handleApplyCrop = useCallback(() => {
    if (!result?.fullPageCanvas) return;
    reprocessWithOptions(result.fullPageCanvas, crop, roundedCorners, filters);
    setState('preview');
  }, [result, crop, roundedCorners, filters, reprocessWithOptions]);

  const handleResetCrop = useCallback(() => {
    setCrop(DEFAULT_CROP);
  }, []);

  const isPreview = state === 'preview' && result;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Fingerprint className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Aadhaar Card Cutter
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Crop, customize & print — 100% offline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
              <Shield className="h-3 w-3 text-accent" />
              <span className="font-medium">Browser-only</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {!isPreview && state !== 'manual-crop' ? (
          /* ===== SINGLE COLUMN: Upload / Password / Loading ===== */
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
            {state === 'idle' && !file && <StepsGuide />}

            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {state === 'idle' ? 'Upload Aadhaar PDF' : 'Uploaded File'}
              </h2>
              <FileUpload file={file} onFileSelect={handleFileSelect} onClear={handleReset} />
            </section>

            {state === 'checking' && (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Checking PDF…</span>
              </div>
            )}

            {state === 'needs-password' && (
              <PasswordInput onSubmit={handlePasswordSubmit} isLoading={false} error={passwordError} />
            )}

            {state === 'processing' && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing your Aadhaar PDF…</p>
              </div>
            )}

            {state === 'idle' && !file && (
              <section className="glass-card rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">How it works</h2>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Upload your original Aadhaar letter PDF from UIDAI</li>
                  <li>Enter the password (PIN code or DOB in DDMMYYYY)</li>
                  <li>Auto-crops front & back of your Aadhaar card</li>
                  <li>Adjust filters, layout, and download or print directly</li>
                </ol>
              </section>
            )}
          </div>
        ) : state === 'manual-crop' && result?.fullPageCanvas ? (
          /* ===== SINGLE COLUMN: Manual Crop ===== */
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
            <ManualCropControls
              fullPageCanvas={result.fullPageCanvas}
              crop={crop}
              onChange={setCrop}
              onApply={handleApplyCrop}
              onReset={handleResetCrop}
            />
          </div>
        ) : isPreview ? (
          /* ===== TWO COLUMN: Preview (left) + Controls (right) ===== */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Preview + Print Preview */}
              <div className="lg:col-span-7 space-y-5">
                {/* Card previews */}
                <section className="glass-card rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Card Preview
                    </h2>
                    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-3 w-3" />
                      Start Over
                    </Button>
                  </div>

                  {/* Zoom control */}
                  <div className="flex items-center gap-3">
                    <ZoomOut className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <Slider
                      value={[previewZoom]}
                      min={50}
                      max={200}
                      step={5}
                      onValueChange={(v) => setPreviewZoom(v[0])}
                      className="flex-1"
                    />
                    <ZoomIn className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <button
                      onClick={() => setPreviewZoom(100)}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground tabular-nums min-w-[40px] text-right"
                    >
                      {previewZoom}%
                    </button>
                  </div>

                  <div className="overflow-auto max-h-[500px] rounded-lg border border-border/40 bg-muted/20 p-3">
                    <div
                      className="grid grid-cols-2 gap-3 origin-top-left transition-transform duration-150"
                      style={{ width: `${previewZoom}%` }}
                    >
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Front</p>
                        <div className={`overflow-hidden bg-card shadow-md ${roundedCorners ? 'rounded-xl' : 'rounded-sm'}`}>
                          <img src={result.frontImage} alt="Aadhaar Front" className="w-full h-auto block" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Back</p>
                        <div className={`overflow-hidden bg-card shadow-md ${roundedCorners ? 'rounded-xl' : 'rounded-sm'}`}>
                          <img src={result.backImage} alt="Aadhaar Back" className="w-full h-auto block" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                    <Button variant="success" size="sm" onClick={handleDownload} disabled={isGenerating} className="gap-1.5 flex-1 sm:flex-none">
                      <Download className="h-4 w-4" />
                      {isGenerating ? 'Generating…' : 'Download PDF'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 flex-1 sm:flex-none">
                      <Printer className="h-4 w-4" />
                      Print Directly
                    </Button>
                  </div>
                </section>

                {/* Live Print Preview */}
                <section className="glass-card rounded-xl p-5 space-y-3">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Print Preview
                  </h2>
                  <PrintPreview
                    frontImage={result.frontImage}
                    backImage={result.backImage}
                    showBorder={showBorder}
                    roundedCorners={roundedCorners}
                    layout={layout}
                  />
                </section>
              </div>

              {/* Right Column: All Controls */}
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-[72px] space-y-5">
                  <section>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                      Options
                    </h2>
                    <OptionsPanel
                      showBorder={showBorder}
                      onBorderToggle={setShowBorder}
                      roundedCorners={roundedCorners}
                      onRoundedToggle={handleRoundedToggle}
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      layout={layout}
                      onLayoutChange={setLayout}
                      canManualCrop={!!result.fullPageCanvas}
                      onManualCrop={handleManualCrop}
                      cardSize={cardSize}
                      onCardSizeChange={(s) => {
                        setCardSize(s);
                        if (result?.fullPageCanvas) {
                          reprocessWithOptions(result.fullPageCanvas, crop, roundedCorners, filters, { width: s.width, height: s.height });
                        }
                      }}
                    />
                  </section>

                  {/* Uploaded file info */}
                  {file && (
                    <div className="glass-card rounded-xl p-4">
                      <FileUpload file={file} onFileSelect={handleFileSelect} onClear={handleReset} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/40 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-accent" />
            All processing happens in your browser. No data is uploaded.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Built by <span className="font-semibold text-foreground">Lokesh Sharma</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;