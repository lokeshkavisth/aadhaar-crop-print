import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Wand2 } from 'lucide-react';
import type { PrintLayout } from '@/components/PrintLayoutControls';

export interface PresetValue {
  layout: PrintLayout;
  showBorder: boolean;
  roundedCorners: boolean;
}

export const PRESETS: Record<string, { label: string; desc: string; value: PresetValue }> = {
  standard: {
    label: 'Standard',
    desc: '1 card centered on A4',
    value: {
      layout: { gap: 4, marginTop: 15, marginLeft: 0, autoCenter: true },
      showBorder: false,
      roundedCorners: false,
    },
  },
  laminate: {
    label: 'Cut & Laminate',
    desc: 'Dashed border + rounded corners',
    value: {
      layout: { gap: 6, marginTop: 18, marginLeft: 0, autoCenter: true },
      showBorder: true,
      roundedCorners: true,
    },
  },
  pvc: {
    label: 'PVC Card Printer',
    desc: 'Tight, no border, no rounding',
    value: {
      layout: { gap: 2, marginTop: 8, marginLeft: 0, autoCenter: true },
      showBorder: false,
      roundedCorners: false,
    },
  },
  compact: {
    label: 'Compact',
    desc: 'Smaller top margin to save paper',
    value: {
      layout: { gap: 3, marginTop: 6, marginLeft: 0, autoCenter: true },
      showBorder: false,
      roundedCorners: false,
    },
  },
};

interface Props {
  onApply: (v: PresetValue) => void;
}

export function PresetSelector({ onApply }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between gap-1.5 text-xs h-8">
          <span className="inline-flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5 text-primary" />
            Print preset
          </span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Operator presets
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(PRESETS).map(([k, p]) => (
          <DropdownMenuItem
            key={k}
            onClick={() => onApply(p.value)}
            className="flex-col items-start gap-0.5 text-xs cursor-pointer"
          >
            <span className="font-semibold">{p.label}</span>
            <span className="text-[10px] text-muted-foreground">{p.desc}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
