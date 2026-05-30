import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  Shield, Loader2, Download, Printer, RotateCcw, Fingerprint, FileText, X,
  ArrowLeftRight, ChevronDown, Image as ImageIcon, FileImage, Layers, GripVertical,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { pngToJpg } from '@/lib/batch-processor';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { PasswordInput } from '@/components/PasswordInput';
import { ManualCropControls } from '@/components/ManualCropControls';
import { StepsGuide } from '@/components/StepsGuide';
import { QuickOptions } from '@/components/QuickOptions';
import { AdvancedDrawer } from '@/components/AdvancedDrawer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PrintPreview } from '@/components/PrintPreview';
import { DEFAULT_LAYOUT, type PrintLayout } from '@/components/PrintLayoutControls';
import { DEFAULT_FILTERS, type ImageFilters } from '@/components/ImageFilterControls';
import { DEFAULT_CARD_SIZE, type CardOutputSize } from '@/components/CardSizeControls';
import {
  checkIfPasswordProtected,
  loadPdf,
  processPdf,
  generatePrintPdf,
  cropFromCanvas,
  DEFAULT_CROP,
  defaultCropFor,
  type ProcessingResult,
  type CropRegion,
} from '@/lib/pdf-processor';
import { detectDocType, detectDocTypeByFilename, DOC_META, type DocType } from '@/lib/doc-detector';

type AppState = 'idle' | 'checking' | 'needs-password' | 'processing' | 'preview' | 'manual-crop';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<AppState>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBorder, setShowBorder] = usePersistedState<boolean>('aadhaar.showBorder', false);
  const [roundedCorners, setRoundedCorners] = usePersistedState<boolean>('aadhaar.roundedCorners', false);
  const [crop, setCrop] = useState<CropRegion>(DEFAULT_CROP);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [docType, setDocType] = useState<DocType>('aadhaar');
  const [layout, setLayout] = usePersistedState<PrintLayout>('aadhaar.layout', DEFAULT_LAYOUT);
  const [filters, setFilters] = usePersistedState<ImageFilters>('aadhaar.filters', DEFAULT_FILTERS);
  const [cardSize, setCardSize] = usePersistedState<CardOutputSize>('aadhaar.cardSize', DEFAULT_CARD_SIZE);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [dragSide, setDragSide] = useState<null | 'front' | 'back'>(null);

  // Display order applies swap (only meaningful when 2 cards exist)
  const display = useMemo(() => {
    if (!result) return null;
    if (swapped && result.backImage) {
      return { frontImage: result.backImage, backImage: result.frontImage };
    }
    return { frontImage: result.frontImage, backImage: result.backImage };
  }, [result, swapped]);

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
    const isAadhaar = docType === 'aadhaar';
    setResult({
      docType,
      frontImage: cropFromCanvas(canvas, 'front', cropRegion, rounded, imgFilters, sz),
      backImage: isAadhaar
        ? cropFromCanvas(canvas, 'back', cropRegion, rounded, imgFilters, sz)
        : undefined,
      fullPageCanvas: canvas,
    });
  }, [cardSize, docType]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setPasswordError(null);
    setState('checking');
    try {
      const isProtected = await checkIfPasswordProtected(selectedFile);
      if (isProtected) {
        // Best guess from filename before unlock (PAN often protected, Jan Aadhaar rarely)
        setDocType(detectDocTypeByFilename(selectedFile));
        setState('needs-password');
      } else {
        setState('processing');
        const pdf = await loadPdf(selectedFile);
        setPdfDoc(pdf);
        const detected = await detectDocType(selectedFile, pdf);
        setDocType(detected);
        const initialCrop = defaultCropFor(detected);
        setCrop(initialCrop);
        const processed = await processPdf(pdf, detected, initialCrop, false);
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
      const detected = await detectDocType(file, pdf);
      setDocType(detected);
      const initialCrop = defaultCropFor(detected);
      setCrop(initialCrop);
      const processed = await processPdf(pdf, detected, initialCrop, false);
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
    if (!result || !display) return null;
    return generatePrintPdf(display.frontImage, display.backImage, pdfOptions);
  }, [result, display, pdfOptions]);

  const handleExportImage = useCallback(
    async (side: 'front' | 'back', format: 'png' | 'jpg') => {
      if (!display) return;
      const src = side === 'front' ? display.frontImage : display.backImage;
      if (!src) return;
      const dataUrl = format === 'jpg' ? await pngToJpg(src) : src;
      const a = document.createElement('a');
      a.href = dataUrl;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const typeLabel = DOC_META[docType].label.replace(/\s+/g, '');
      const sideLabel = result?.backImage ? `-${side}` : '';
      a.download = `IDSevaCrop-${typeLabel}${sideLabel}-${stamp}.${format}`;
      a.click();
    },
    [display, docType, result],
  );

  const handleDownload = useCallback(() => {
    if (!result) return;
    setIsGenerating(true);
    try {
      const blob = createPdfBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const typeLabel = DOC_META[docType].label.replace(/\s+/g, '');
      a.download = `IDSevaCrop-${typeLabel}-${stamp}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }, [createPdfBlob, result]);

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
    setDocType('aadhaar');
    setSwapped(false);
  }, []);

  const handleResetSettings = useCallback(() => {
    setRoundedCorners(false);
    setShowBorder(false);
    setLayout(DEFAULT_LAYOUT);
    setFilters(DEFAULT_FILTERS);
    setCardSize(DEFAULT_CARD_SIZE);
    if (result?.fullPageCanvas) {
      reprocessWithOptions(result.fullPageCanvas, crop, false, DEFAULT_FILTERS, {
        width: DEFAULT_CARD_SIZE.width,
        height: DEFAULT_CARD_SIZE.height,
      });
    }
  }, [result, crop, reprocessWithOptions]);

  const handleManualCrop = useCallback(() => setState('manual-crop'), []);

  const handleApplyCrop = useCallback(() => {
    if (!result?.fullPageCanvas) return;
    reprocessWithOptions(result.fullPageCanvas, crop, roundedCorners, filters);
    setState('preview');
  }, [result, crop, roundedCorners, filters, reprocessWithOptions]);

  const handleResetCrop = useCallback(() => setCrop(DEFAULT_CROP), []);

  const isPreview = state === 'preview' && result;

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isPreview) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownload();
      } else if (e.key === 'Escape' && advancedOpen) {
        setAdvancedOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPreview, advancedOpen, handlePrint, handleDownload]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-2 flex items-center gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <Fingerprint className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
              IDSeva Crop
            </h1>
            {file && (
              <span className="hidden md:inline-flex text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {DOC_META[docType].label}
              </span>
            )}
          </div>

          {/* File chip (center) */}
          {file && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60 max-w-xs">
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground truncate font-medium">{file.name}</span>
              <button
                onClick={handleReset}
                aria-label="Remove file"
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex-1" />

          {/* Right cluster */}
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20">
              <Shield className="h-3 w-3 text-accent" />
              <span className="font-medium">Browser-only</span>
            </div>

            {isPreview && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 gap-1.5 hidden sm:inline-flex"
                  title="Ctrl/Cmd + P"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={isGenerating}
                      className="h-8 gap-1.5"
                      title="Ctrl/Cmd + S"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {isGenerating ? '…' : 'Export'}
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      A4 print-ready
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleDownload} className="gap-2 text-xs">
                      <FileText className="h-3.5 w-3.5" /> PDF (A4)
                      <span className="ml-auto text-[10px] text-muted-foreground">⌘S</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Card image
                    </DropdownMenuLabel>
                    {result?.backImage ? (
                      <>
                        <DropdownMenuItem onClick={() => handleExportImage('front', 'png')} className="gap-2 text-xs">
                          <ImageIcon className="h-3.5 w-3.5" /> Front · PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportImage('back', 'png')} className="gap-2 text-xs">
                          <ImageIcon className="h-3.5 w-3.5" /> Back · PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportImage('front', 'jpg')} className="gap-2 text-xs">
                          <FileImage className="h-3.5 w-3.5" /> Front · JPG
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportImage('back', 'jpg')} className="gap-2 text-xs">
                          <FileImage className="h-3.5 w-3.5" /> Back · JPG
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => handleExportImage('front', 'png')} className="gap-2 text-xs">
                          <ImageIcon className="h-3.5 w-3.5" /> PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportImage('front', 'jpg')} className="gap-2 text-xs">
                          <FileImage className="h-3.5 w-3.5" /> JPG
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {!isPreview && state !== 'manual-crop' ? (
          /* Single column intake flow */
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
            {state === 'idle' && !file && (
              <section className="text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] font-medium text-accent">
                  <Shield className="h-3 w-3" />
                  100% browser-only · zero uploads
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                  Print-ready ID cards from any{' '}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Aadhaar, PAN or Jan Aadhaar
                  </span>{' '}
                  PDF
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                  Auto-detects your document, crops the card to exact ID-1 size,
                  and gives you a clean A4 PDF ready to print at home.
                </p>
              </section>
            )}

            {state === 'idle' && !file && <StepsGuide />}

            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {state === 'idle' ? 'Upload your ID PDF' : 'Uploaded file'}
              </h2>
              <FileUpload file={file} onFileSelect={handleFileSelect} onClear={handleReset} />
              {state === 'idle' && !file && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Aadhaar · e-PAN (NSDL/UTI) · Jan Aadhaar — document type is auto-detected
                </p>
              )}
            </section>

            {state === 'checking' && (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Checking PDF…</span>
              </div>
            )}

            {state === 'needs-password' && (
              <PasswordInput
                onSubmit={handlePasswordSubmit}
                isLoading={false}
                error={passwordError}
                docLabel={DOC_META[docType].label}
                passwordHint={DOC_META[docType].passwordHint}
              />
            )}

            {state === 'processing' && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing your PDF…</p>
              </div>
            )}

            {state === 'idle' && !file && (
              <>
                <section className="surface-card p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-foreground">Password hints</h2>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>· <b className="text-foreground">Aadhaar</b>: first 4 letters of name in CAPS + birth year (e.g. <code className="font-mono px-1 py-0.5 rounded bg-muted">LOKE1998</code>)</li>
                    <li>· <b className="text-foreground">PAN (e-PAN)</b>: Date of Birth in <code className="font-mono px-1 py-0.5 rounded bg-muted">DDMMYYYY</code></li>
                    <li>· <b className="text-foreground">Jan Aadhaar</b>: usually no password</li>
                  </ul>
                </section>

                <section className="text-center pt-2">
                  <a
                    href="https://github.com/lokeshkavisth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full surface-card hover:border-primary/40 hover:shadow-md transition-all text-xs group"
                  >
                    <span className="text-muted-foreground">Crafted by</span>
                    <span className="font-semibold text-foreground">Lokesh Sharma</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-mono text-primary group-hover:underline">@lokeshkavisth</span>
                    <svg className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.19 1.18a11.1 11.1 0 0 1 2.9-.39c.99 0 1.98.13 2.9.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
                  </a>
                </section>
              </>
            )}
          </div>
        ) : state === 'manual-crop' && result?.fullPageCanvas ? (
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
          /* Compact 2-column workspace */
          <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* LEFT: Sticky preview */}
              <div className="lg:col-span-8 xl:col-span-9">
                <div className="lg:sticky lg:top-[60px] space-y-3">
                  <section className="surface-card p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Print Preview
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="h-7 gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive shadow-sm"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Start Over
                      </Button>
                    </div>

                    <PrintPreview
                      frontImage={result.frontImage}
                      backImage={result.backImage}
                      showBorder={showBorder}
                      roundedCorners={roundedCorners}
                      layout={layout}
                    />

                    {/* Slim card thumbnail strip */}
                    <div className={`grid ${result.backImage ? 'grid-cols-2' : 'grid-cols-1'} gap-2 rounded-lg border border-border/50 bg-muted/30 p-2`}>
                      <ThumbStrip label={result.backImage ? 'Front' : DOC_META[docType].label} src={result.frontImage} rounded={roundedCorners} />
                      {result.backImage && (
                        <ThumbStrip label="Back" src={result.backImage} rounded={roundedCorners} />
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* RIGHT: Quick options */}
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="lg:sticky lg:top-[60px] space-y-3">
                  <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
                    Quick options
                  </h2>
                  <QuickOptions
                    showBorder={showBorder}
                    onBorderToggle={setShowBorder}
                    roundedCorners={roundedCorners}
                    onRoundedToggle={handleRoundedToggle}
                    layout={layout}
                    onLayoutChange={setLayout}
                    cardSize={cardSize}
                    onCardSizeChange={(s) => {
                      setCardSize(s);
                      if (result?.fullPageCanvas) {
                        reprocessWithOptions(result.fullPageCanvas, crop, roundedCorners, filters, { width: s.width, height: s.height });
                      }
                    }}
                    canManualCrop={!!result.fullPageCanvas}
                    onManualCrop={handleManualCrop}
                    onOpenAdvanced={() => setAdvancedOpen(true)}
                  />

                  {/* Mobile-only inline actions */}
                  <div className="sm:hidden flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 gap-1.5">
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button variant="success" size="sm" onClick={handleDownload} disabled={isGenerating} className="flex-1 gap-1.5">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Advanced settings drawer */}
      <AdvancedDrawer
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        layout={layout}
        onLayoutChange={setLayout}
        cardSize={cardSize}
        onCardSizeChange={(s) => {
          setCardSize(s);
          if (result?.fullPageCanvas) {
            reprocessWithOptions(result.fullPageCanvas, crop, roundedCorners, filters, { width: s.width, height: s.height });
          }
        }}
        onResetAll={handleResetSettings}
      />

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40 mt-auto">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-accent" />
            All processing happens in your browser. No data is uploaded.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Built by{' '}
            <a
              href="https://github.com/lokeshkavisth"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Lokesh Sharma
            </a>{' '}
            <span className="font-mono text-muted-foreground/70">@lokeshkavisth</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

function ThumbStrip({ label, src, rounded }: { label: string; src: string; rounded: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className={`overflow-hidden bg-card shadow-sm ${rounded ? 'rounded-lg' : 'rounded-sm'}`}>
        <img src={src} alt={`Aadhaar ${label}`} className="w-full h-auto block" />
      </div>
    </div>
  );
}

export default Index;
