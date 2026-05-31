import { useEffect, useState } from 'react';
import { Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * "Install app" button — manifest-only PWA install hint.
 *
 * - Listens for `beforeinstallprompt` (Chrome / Edge / Android) and triggers
 *   the native install dialog on click.
 * - On iOS Safari (no event) we show a short hint to use Share → Add to Home Screen.
 * - Hides itself once the app is installed or already running standalone.
 */
export function InstallButton({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;
    if (standalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-success" /> Installed
      </span>
    );
  }

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferred(null);
      return;
    }
    // iOS / unsupported — show inline hint
    setShowIosHint(true);
    setTimeout(() => setShowIosHint(false), 6000);
  };

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size={compact ? 'sm' : 'default'}
        onClick={handleClick}
        className="gap-1.5"
        title="Install IDSeva Crop as an app"
      >
        <Download className="h-4 w-4" />
        <span className={compact ? 'hidden sm:inline' : ''}>Install app</span>
      </Button>

      {showIosHint && (
        <div
          role="status"
          className="absolute right-0 top-full mt-2 w-64 rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow-lg z-50"
        >
          {isIos ? (
            <>
              In Safari, tap <span className="font-medium">Share</span> →{' '}
              <span className="font-medium">Add to Home Screen</span> to install.
            </>
          ) : (
            <>
              Use your browser menu and choose{' '}
              <span className="font-medium">Install app</span> /{' '}
              <span className="font-medium">Add to Home Screen</span>.
            </>
          )}
        </div>
      )}
    </div>
  );
}
