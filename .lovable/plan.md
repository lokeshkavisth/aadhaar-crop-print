## Goal
Tighten the existing 2-column layout into a **compact pro-tool** experience with floating quick actions, an advanced settings drawer, and a header dark-mode toggle — keeping all current functionality intact.

---

## 1. Theming & Dark Mode
- Add a refined dark palette in `src/index.css` (deep slate background, elevated surfaces, same primary/accent shifted for contrast).
- Add `ThemeProvider` (lightweight, no extra dep — toggle `dark` class on `<html>`, persist in `localStorage`, default = system).
- Header gets a **Sun/Moon toggle** next to the "Browser-only" pill.
- Audit semantic tokens so glass-card, borders, and muted surfaces look correct in both modes.

## 2. Compact Header (denser, more useful)
- Reduce header height; move actions inline:
  - Logo + title (smaller, single line)
  - Center: filename chip (when uploaded) with inline "Replace" / "Reset" icons
  - Right: Privacy pill, Theme toggle, primary **Download** + **Print** split-button (only when in preview state)
- Removes the duplicate footer-style action row; primary actions now live persistently in header.

## 3. Workspace (2-column, tighter)
```text
┌─────────────────────────────────────────────────────────┐
│  Header: logo · file chip · actions · theme            │
├──────────────────────────────┬──────────────────────────┤
│                              │  Quick Actions (always)  │
│   PREVIEW (sticky canvas)    │  ──────────────────────  │
│   • A4 print preview         │  □ Border  ○ Rounded     │
│   • Front/Back thumbnails    │  Card size  [- 90.6 -]   │
│     in a slim strip below    │  Gap [4mm]  Margin [8mm] │
│                              │                          │
│   Floating bottom toolbar:   │  [ Advanced settings ▸ ] │
│   [Manual crop] [Reset]      │  (opens right Drawer)    │
└──────────────────────────────┴──────────────────────────┘
```
- Reduce paddings (`p-5` → `p-3`), section header sizes, and gaps for density.
- Front/Back thumbnails become a **slim horizontal strip** under the A4 preview (not a 2-col block) — saves vertical space.
- Preview column becomes `sticky top-[56px]` so options scroll independently.

## 4. Floating Quick-Actions Panel (right column, always visible)
Replace the current Collapsible accordion with a single compact card showing the **most-used controls inline**:
- Border toggle
- Rounded corners toggle
- Card size (numeric inputs, side by side)
- Gap (mm) input
- Top margin (mm) input
- Auto-center switch

Everything else moves into the **Advanced Drawer**.

## 5. Advanced Settings Drawer
- Use shadcn `Sheet` (right-side) triggered by **"Advanced settings"** button.
- Contains:
  - Image filters (brightness, contrast, saturation, sharpness)
  - Full Print Layout controls (left margin, fine positioning)
  - Manual crop entry point
  - Reset all
- Keeps the main view clean while preserving every existing option.

## 6. Floating Action Bar (bottom of preview)
Small pill-shaped floating bar over the preview with:
- Manual Crop · Reset Crop · Fit/Zoom indicator (read-only label, no zoom UI re-added)
- Subtle shadow, glass background, only shown in preview state.

## 7. Micro-polish
- Replace heavy `glass-card` everywhere with two tiers: `surface` (flat) for dense panels, `glass-card` only for the hero preview.
- Tighter typography scale; numeric inputs use `font-mono` for alignment.
- Consistent 8px spacing grid.
- Smooth `transition-colors` on theme switch.
- Keyboard: `Cmd/Ctrl+P` → Print, `Cmd/Ctrl+S` → Download, `Esc` → close drawer.

---

## Files to touch
- `src/index.css` — dark tokens, density utilities
- `src/main.tsx` or new `src/components/ThemeProvider.tsx` — theme context
- `src/pages/Index.tsx` — header restructure, layout density, sticky preview, floating bar, drawer wiring, shortcuts
- `src/components/OptionsPanel.tsx` — split into **QuickOptions** (inline) + **AdvancedOptions** (drawer content)
- New: `src/components/ThemeToggle.tsx`, `src/components/AdvancedDrawer.tsx`, `src/components/FloatingPreviewToolbar.tsx`
- `tailwind.config.ts` — only if new tokens needed

## Out of scope
- No changes to PDF processing logic, crop math, or output dimensions.
- No new dependencies (uses existing shadcn `Sheet`, `Switch`, `Input`).
- Mobile layout stays single-column stacked; drawer becomes bottom sheet on small screens.