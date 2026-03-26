import { Upload, KeyRound, Eye, Download } from 'lucide-react';

const steps = [
  { icon: Upload, title: 'Upload PDF', desc: 'Select your Aadhaar letter PDF' },
  { icon: KeyRound, title: 'Enter Password', desc: 'Unlock if password-protected' },
  { icon: Eye, title: 'Preview', desc: 'Review cropped front & back' },
  { icon: Download, title: 'Download', desc: 'Get print-ready PDF' },
];

export function StepsGuide() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary mb-3">
            <step.icon className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">{step.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}
