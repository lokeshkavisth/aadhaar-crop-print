import { Upload, KeyRound, Eye, Download } from 'lucide-react';

const steps = [
  { icon: Upload, title: 'Upload', desc: 'Aadhaar, PAN, Voter, DL, RC…' },
  { icon: KeyRound, title: 'Unlock', desc: 'Enter password if asked' },
  { icon: Eye, title: 'Preview', desc: 'Auto-cropped on A4' },
  { icon: Download, title: 'Print', desc: 'Download or print' },
];

export function StepsGuide() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className="relative surface-card p-3 rounded-xl hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                0{i + 1}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-2">{step.title}</p>
            <p className="text-[11px] text-muted-foreground leading-snug">{step.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-center text-muted-foreground">
        Built for <b className="text-foreground">cybercafes, CSC centers & eMitra</b> — fast, paper-saving, fully offline.
      </p>
    </div>
  );
}
