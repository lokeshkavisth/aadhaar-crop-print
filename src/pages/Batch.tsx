import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Loader2,
  Download,
  X,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InstallButton } from '@/components/InstallButton';
import {
  processBatchFile,
  generateBatchPdf,
  type BatchCard,
  type BatchFileResult,
} from '@/lib/batch-processor';
import { DOC_META } from '@/lib/doc-detector';

const Batch = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState('');
  const [showBorder, setShowBorder] = useState(false);
  const [labels, setLabels] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<BatchFileResult[]>([]);
  const [cards, setCards] = useState<BatchCard[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type === 'application/pdf');
    setFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleProcess = useCallback(async () => {
    if (!files.length) return;
    setProcessing(true);
    setResults([]);
    setCards([]);
    const out: BatchFileResult[] = [];
    const allCards: BatchCard[] = [];
    for (const f of files) {
      const r = await processBatchFile(f, password || undefined);
      out.push(r);
      allCards.push(...r.cards);
      setResults([...out]);
      setCards([...allCards]);
    }
    setProcessing(false);
  }, [files, password]);

  const handleDownload = () => {
    if (!cards.length) return;
    const blob = generateBatchPdf(cards, { showBorder, labels });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    a.download = `IDSevaCrop-Batch-${stamp}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onCardDragStart = (i: number) => setDragIdx(i);
  const onCardDragOver = (e: React.DragEvent) => e.preventDefault();
  const onCardDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return;
    setCards((prev) => {
      const next = [...prev];
      const [m] = next.splice(dragIdx, 1);
      next.splice(i, 0, m);
      return next;
    });
    setDragIdx(null);
  };

  const removeCard = (i: number) =>
    setCards((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-2 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              Batch Process
            </h1>
            <span className="hidden md:inline-flex text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {cards.length} cards
            </span>
          </div>
          <div className="flex-1" />
          {cards.length > 0 && (
            <Button
              variant="success"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          )}
          <InstallButton compact />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT — input */}
          <div className="lg:col-span-5 space-y-4">
            <section className="surface-card p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                1. Add PDFs
              </h2>
              <label
                htmlFor="batch-input"
                className="block rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 p-6 text-center cursor-pointer transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Drop multiple PDFs or click to browse
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Aadhaar · e-PAN · Jan Aadhaar — mix freely
                </p>
                <input
                  id="batch-input"
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>

              {files.length > 0 && (
                <ul className="space-y-1.5 max-h-56 overflow-auto">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/40 border border-border/50"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="surface-card p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                2. Shared password (optional)
              </h2>
              <div className="space-y-1.5">
                <Label htmlFor="batch-pw" className="text-xs flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Tried on every protected PDF
                </Label>
                <Input
                  id="batch-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty if none are protected"
                  className="h-9 font-mono text-sm"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="batch-border" className="text-xs">Cut borders</Label>
                <Switch id="batch-border" checked={showBorder} onCheckedChange={setShowBorder} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="batch-labels" className="text-xs">Show source labels</Label>
                <Switch id="batch-labels" checked={labels} onCheckedChange={setLabels} />
              </div>
            </section>

            <Button
              onClick={handleProcess}
              disabled={!files.length || processing}
              className="w-full h-10 gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing {results.length}/{files.length}…
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" /> Process {files.length || ''} PDF{files.length === 1 ? '' : 's'}
                </>
              )}
            </Button>

            {results.length > 0 && (
              <section className="surface-card p-3 space-y-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Results
                </h3>
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {r.status === 'ok' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : r.status === 'password-required' ? (
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="truncate flex-1 text-foreground">{r.file}</span>
                    {r.docType && (
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {DOC_META[r.docType].label}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {r.status === 'ok'
                        ? `${r.cards.length} card${r.cards.length === 1 ? '' : 's'}`
                        : r.status === 'password-required'
                        ? 'Locked'
                        : 'Failed'}
                    </span>
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* RIGHT — grid */}
          <div className="lg:col-span-7">
            <section className="surface-card p-4 space-y-3 min-h-[400px]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  3. Drag to reorder · then download
                </h2>
                {cards.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {cards.length} card{cards.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
                  <Layers className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Processed cards will appear here</p>
                  <p className="text-[11px] mt-1">Add PDFs on the left, then click Process</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cards.map((card, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => onCardDragStart(i)}
                      onDragOver={onCardDragOver}
                      onDrop={() => onCardDrop(i)}
                      onDragEnd={() => setDragIdx(null)}
                      className={`group relative rounded-lg border bg-card overflow-hidden cursor-move transition-all ${
                        dragIdx === i ? 'opacity-40 border-primary' : 'border-border hover:border-primary/40 hover:shadow-md'
                      }`}
                    >
                      <div className="absolute top-1 left-1 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur text-[10px] font-mono">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        #{i + 1}
                      </div>
                      <button
                        onClick={() => removeCard(i)}
                        className="absolute top-1 right-1 z-10 p-1 rounded bg-background/80 backdrop-blur text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove card"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <img src={card.image} alt={`${card.file} ${card.side}`} className="w-full h-auto block" />
                      <div className="px-2 py-1.5 text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/50">
                        <span className="truncate">{card.file}</span>
                        <span className="uppercase font-semibold ml-2 shrink-0">
                          {DOC_META[card.docType].label} · {card.side}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 bg-card/40 mt-auto">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-3 text-center text-[11px] text-muted-foreground">
          All PDFs are processed in your browser. Nothing is uploaded.
        </div>
      </footer>
    </div>
  );
};

export default Batch;
