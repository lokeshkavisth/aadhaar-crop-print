import { useState, useCallback } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { PasswordInput } from '@/components/PasswordInput';
import { PreviewSection } from '@/components/PreviewSection';
import { ManualCropControls } from '@/components/ManualCropControls';
import { StepsGuide } from '@/components/StepsGuide';
import { OptionsPanel } from '@/components/OptionsPanel';
import { PrintPreview } from '@/components/PrintPreview';
import { DEFAULT_LAYOUT, type PrintLayout } from '@/components/PrintLayoutControls';
import { DEFAULT_FILTERS, type ImageFilters } from '@/components/ImageFilterControls';
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

  const reprocessWithOptions = useCallback((
    canvas: HTMLCanvasElement,
    cropRegion: CropRegion,
    rounded: boolean,
    imgFilters: ImageFilters
  ) => {
    setResult({
      frontImage: cropFromCanvas(canvas, 'front', cropRegion, rounded, imgFilters),
      backImage: cropFromCanvas(canvas, 'back', cropRegion, rounded, imgFilters),
      fullPageCanvas: canvas,
    });
  }, []);

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

  const handleDownload = useCallback(() => {
    if (!result) return;
    setIsGenerating(true);
    try {
      const blob = generatePrintPdf(result.frontImage, result.backImage, {
        showBorder,
        roundedCorners,
        gap: layout.gap,
        marginTop: layout.marginTop,
        marginLeft: layout.marginLeft,
        autoCenter: layout.autoCenter,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aadhaar-print-ready.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }, [result, showBorder, roundedCorners, layout]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              Aadhaar Card Crop & Print
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              100% offline • No data uploaded • Browser-only processing
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Steps - only show when idle */}
        {state === 'idle' && !file && <StepsGuide />}

        {/* Upload */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {state === 'idle' ? '1. Upload Aadhaar PDF' : 'Uploaded File'}
          </h2>
          <FileUpload file={file} onFileSelect={handleFileSelect} onClear={handleReset} />
        </section>

        {/* Checking */}
        {state === 'checking' && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Checking PDF...</span>
          </div>
        )}

        {/* Password */}
        {state === 'needs-password' && (
          <PasswordInput onSubmit={handlePasswordSubmit} isLoading={false} error={passwordError} />
        )}

        {/* Processing */}
        {state === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing your Aadhaar PDF...</p>
          </div>
        )}

        {/* Preview */}
        {state === 'preview' && result && (
          <>
            {/* Card Preview */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Card Preview
              </h2>
              <PreviewSection
                frontImage={result.frontImage}
                backImage={result.backImage}
                onDownload={handleDownload}
                onReset={handleReset}
                isGenerating={isGenerating}
                roundedCorners={roundedCorners}
              />
            </section>

            {/* Options Panel (tabbed) */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
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
              />
            </section>

            {/* Live Print Preview */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
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
          </>
        )}

        {/* Manual Crop */}
        {state === 'manual-crop' && result?.fullPageCanvas && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Adjust Crop Region
            </h2>
            <ManualCropControls
              fullPageCanvas={result.fullPageCanvas}
              crop={crop}
              onChange={setCrop}
              onApply={handleApplyCrop}
              onReset={handleResetCrop}
            />
          </section>
        )}

        {/* How it works */}
        {state === 'idle' && !file && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">How it works</h2>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Upload your original Aadhaar letter PDF from UIDAI</li>
              <li>Enter the password (PIN code or DOB in DDMMYYYY)</li>
              <li>Auto-crops front & back of your Aadhaar card</li>
              <li>Adjust filters, layout, and download print-ready PDF</li>
            </ol>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="container max-w-3xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            <Shield className="h-3 w-3 inline-block mr-1 -mt-0.5" />
            All processing happens in your browser. No data is uploaded to any server.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
