import { Upload, KeyRound, Eye, Download } from 'lucide-react';

const steps = [
  { icon: Upload, title: 'Upload PDF', desc: 'Select your Aadhaar letter PDF', color: 'bg-primary/10 text-primary' },
  { icon: KeyRound, title: 'Enter Password', desc: 'Unlock if password-protected', color: 'bg-accent/10 text-accent' },
  { icon: Eye, title: 'Preview', desc: 'Review cropped front & back', color: 'bg-primary/10 text-primary' },
  { icon: Download, title: 'Download', desc: 'Get print-ready PDF', color: 'bg-success/10 text-success' },
];

export function StepsGuide() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {steps.map((step, i) => (
        <div key={i} className="glass-card flex flex-col items-center text-center p-4 rounded-xl group hover:shadow-md transition-shadow">
          <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${step.color} mb-3`}>
            <step.icon className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">{step.title}</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}
