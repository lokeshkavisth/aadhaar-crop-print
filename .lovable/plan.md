## Goal
Turn IDSeva Crop into a daily-driver for **cybercafes, CSC centers, and eMitra operators**. They run high volumes, mixed document types, and need fast, paper-saving output with traceable filenames.

## What to add

### 1. More Indian ID document types
Extend `DocType` and `DOC_META` in `src/lib/doc-detector.ts` with content + filename detection:
- **Voter ID (EPIC)** — keywords: "election commission", "EPIC", "voter"
- **Driving License (Parivahan/Sarathi e-DL)** — "driving licence", "sarathi", "parivahan"
- **Ayushman Bharat (PMJAY)** — "ayushman", "pmjay", "abha"
- **PVC Aadhaar / mAadhaar print** — already handled but tune
- **RC (Vehicle Registration)** — "registration certificate", "RTO"

Each gets its own `passwordHint`, default crop region (`defaultCropFor`), and detection rules. Single-card processor reused; only crop coords differ. Fall back to "Generic ID" with a manual-crop prompt for unknown types.

### 2. Multi-card A4 sheet ("Save paper" mode) on the main page
Today the main page prints one card centered on A4. CSC operators want to **stack 2-6 cards on one A4** (e.g. family Aadhaars, husband+wife PAN+Aadhaar combo). Add a **Sheet Composer** drawer:
- "+ Add current card to sheet" button in the Export menu
- Tray strip showing queued cards (thumbnail + remove + drag-reorder)
- "Print Sheet" generates a grid PDF (reuse `generateBatchPdf` from batch-processor)
- Sheet persists in `sessionStorage` so re-uploading another PDF doesn't lose the queue
- Empty when the operator clicks "Reset session"

### 3. OCR-based smart filename
After processing, run a lightweight OCR pass (Tesseract.js WASM, loaded on demand) on the cropped front image to extract:
- Aadhaar last-4 digits
- PAN number (regex `[A-Z]{5}[0-9]{4}[A-Z]`)
- Name (top text line)

Use those to auto-name downloads, e.g. `Aadhaar-RAHUL-1234-20260612.pdf`. Falls back to current timestamped name if OCR confidence is low. Toggle in Advanced Drawer ("Smart filenames — uses on-device OCR"). Bundle size impact: Tesseract loaded only when toggle is on.

### 4. Customer session log (local only)
A persistent local log of processed documents per session — useful when an operator handles 30 customers a day and needs to re-print one:
- New route `/log` (or drawer panel) showing: timestamp · doc type · last-4 / PAN suffix · "Reprint" button
- Stored in `localStorage` (no PII beyond what operator typed; mostly hashes + thumbnails as data URLs)
- "Clear log" button + auto-clear after 24h
- Strictly browser-only; no upload (keeps existing privacy promise)

### 5. Operator-friendly print presets
A preset dropdown in Quick Options:
- **Standard (1 card centered)** — current default
- **Save paper (4-up grid)**
- **Cut-and-laminate (with border + 3mm bleed)**
- **PVC card printer (single, no margins)**

Each preset just sets `layout` + `showBorder` + `roundedCorners` + grid mode in one click.

### 6. UPI/QR tip block on landing
A small footer block on the landing page only: "Free forever. If this saved you time, you can tip the maker." with the creator's UPI QR. Optional, low-emphasis, no popups — fits the cybercafe/CSC vibe where operators appreciate clearly-free tools.

## Out of scope (for this iteration)
- No cloud storage, no accounts, no backend (preserves zero-trust promise)
- No language/translation work yet
- No payment / billing logic
- No changes to the existing Aadhaar crop math

## Files to touch
- `src/lib/doc-detector.ts` — add 4-5 new doc types + detection rules + hints
- `src/lib/pdf-processor.ts` — per-doc-type default crops
- `src/lib/ocr.ts` (new) — Tesseract.js wrapper with on-demand load
- `src/lib/session-log.ts` (new) — log storage + helpers
- `src/components/SheetComposer.tsx` (new) — multi-card tray + grid print
- `src/components/PresetSelector.tsx` (new) — print preset dropdown
- `src/pages/Index.tsx` — wire OCR filename, sheet composer button, presets, log entry on download
- `src/pages/Log.tsx` (new) + route in `src/App.tsx`
- `src/components/StepsGuide.tsx` — mention CSC/eMitra in copy
- `package.json` — add `tesseract.js` (lazy-loaded chunk)

## Suggested implementation order
1. **Doc types** (smallest, highest leverage for your audience)
2. **Print presets** (instant UX win)
3. **Sheet composer** (paper-saving — biggest CSC ask)
4. **Session log + reprint**
5. **OCR smart filenames** (heaviest, do last)
6. **Landing tip block** (cosmetic, parallel-able)

Want me to start with steps 1-2 first, or scope a different combination?
