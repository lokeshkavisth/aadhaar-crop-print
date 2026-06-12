import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, GripVertical, Layers, X } from 'lucide-react';
import { generateBatchPdf, type BatchCard } from '@/lib/batch-processor';

const KEY = 'idseva.sheet.v1';

function load(): BatchCard[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BatchCard[]) : [];
  } catch {
    return [];
  }
}
function save(cards: BatchCard[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cards));
  } catch {
    /* quota — silently ignore */
  }
}

export function useSheet() {
  const [cards, setCards] = useState<BatchCard[]>(() => load());
  useEffect(() => save(cards), [cards]);

  const add = (c: BatchCard | BatchCard[]) =>
    setCards((prev) => [...prev, ...(Array.isArray(c) ? c : [c])]);
  const clear = () => setCards([]);
  const remove = (i: number) => setCards((prev) => prev.filter((_, idx) => idx !== i));
  const move = (from: number, to: number) =>
    setCards((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });

  return { cards, add, clear, remove, move, count: cards.length };
}

interface SheetTrayProps {
  cards: BatchCard[];
  onRemove: (i: number) => void;
  onMove: (from: number, to: number) => void;
  onClear: () => void;
  showBorder: boolean;
  roundedCorners: boolean;
}

export function SheetTray({
  cards,
  onRemove,
  onMove,
  onClear,
  showBorder,
}: SheetTrayProps) {
  const [drag, setDrag] = useState<number | null>(null);

  const handleDownload = () => {
    if (!cards.length) return;
    const blob = generateBatchPdf(cards, { showBorder, labels: false });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    a.download = `IDSevaCrop-Sheet-${cards.length}cards-${stamp}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (cards.length === 0) return null;

  return (
    <section className="surface-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          Sheet · {cards.length} card{cards.length === 1 ? '' : 's'}
        </h2>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onClear} className="h-7 px-2 text-[11px] text-destructive hover:text-destructive">
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
          <Button variant="success" size="sm" onClick={handleDownload} className="h-7 gap-1.5 text-xs">
            <Download className="h-3 w-3" /> Print Sheet
          </Button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cards.map((c, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag !== null && drag !== i) onMove(drag, i);
              setDrag(null);
            }}
            onDragEnd={() => setDrag(null)}
            className={`group relative shrink-0 w-28 rounded-md border bg-card overflow-hidden cursor-move ${
              drag === i ? 'opacity-40 border-primary' : 'border-border hover:border-primary/40'
            }`}
            title={`${c.file} · ${c.side}`}
          >
            <div className="absolute top-0.5 left-0.5 z-10 flex items-center gap-0.5 px-1 py-0.5 rounded bg-background/80 backdrop-blur text-[9px] font-mono">
              <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
              {i + 1}
            </div>
            <button
              onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 z-10 p-0.5 rounded bg-background/80 backdrop-blur text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove"
            >
              <X className="h-2.5 w-2.5" />
            </button>
            <img src={c.image} alt={c.side} className="w-full h-auto block" draggable={false} />
          </div>
        ))}
      </div>
    </section>
  );
}
