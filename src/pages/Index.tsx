import { useState, useCallback } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { PasswordInput } from '@/components/PasswordInput';
import { PreviewSection } from '@/components/PreviewSection';
import { StepsGuide } from '@/components/StepsGuide';
import {
  checkIfPasswordProtected,
  loadPdf,
  processAadhaarPdf,
  generatePrintPdf,
  type ProcessingResult,
} from '@/lib/pdf-processor';

type AppState = 'idle' | 'checking' | 'needs-password' | 'processing' | 'preview';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<AppState>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setPasswordError(null);
    setState('checking');

    try {
      const isProtected = await checkIfPasswordProtected(selectedFile);
      if (isProtected) {
        setState('needs-password');
      } else {
        // Not protected, process directly
        setState('processing');
        const pdf = await loadPdf(selectedFile);
        const processed = await processAadhaarPdf(pdf);
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
      const processed = await processAadhaarPdf(pdf);
      setResult(processed);
      setState('preview');
    } catch (error: any) {
      if (error?.name === 'PasswordException') {
        setPasswordError('Incorrect password. Please try again.');
        setState('needs-password');
      } else {
        setPasswordError('Failed to process PDF. Please try again.');
        setState('needs-password');
      }
    }
  }, [file]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    setIsGenerating(true);

    try {
      const blob = generatePrintPdf(result.frontImage, result.backImage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aadhaar-print-ready.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }, [result]);

  const handleReset = useCallback(() => {
    setFile(null);
    setState('idle');
    setResult(null);
    setPasswordError(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Aadhaar Card Crop & Print Tool
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Upload your Aadhaar PDF, enter password, and get a print-ready version instantly.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Steps */}
        <StepsGuide />

        {/* Upload */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Upload Aadhaar PDF</h2>
          <FileUpload file={file} onFileSelect={handleFileSelect} onClear={handleReset} />
        </section>

        {/* Checking spinner */}
        {state === 'checking' && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Checking PDF...</span>
          </div>
        )}

        {/* Password */}
        {state === 'needs-password' && (
          <PasswordInput
            onSubmit={handlePasswordSubmit}
            isLoading={false}
            error={passwordError}
          />
        )}

        {/* Processing */}
        {state === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing your Aadhaar PDF...</p>
          </div>
        )}

        {/* Preview */}
        {state === 'preview' && result && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Preview</h2>
            <PreviewSection
              frontImage={result.frontImage}
              backImage={result.backImage}
              onDownload={handleDownload}
              onReset={handleReset}
              isGenerating={isGenerating}
            />
          </section>
        )}

        {/* Instructions */}
        {state === 'idle' && !file && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">How it works</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Upload your original Aadhaar letter PDF downloaded from UIDAI</li>
              <li>Enter the password (usually your PIN code or DOB in DDMMYYYY format)</li>
              <li>The tool automatically crops the front and back of your Aadhaar card</li>
              <li>Download the print-ready PDF optimized for A4 paper</li>
            </ol>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container max-w-2xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Your Privacy is Protected</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Your Aadhaar data is not stored. All processing happens entirely in your browser. No data is uploaded to any server.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
