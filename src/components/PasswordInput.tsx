import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PasswordInputProps {
  onSubmit: (password: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function PasswordInput({ onSubmit, isLoading, error }: PasswordInputProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">PDF is Password Protected</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Enter the password to unlock your Aadhaar PDF. This is usually your date of birth or postal PIN code.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter PDF password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={isLoading || !password.trim()} className="w-full">
          {isLoading ? 'Unlocking...' : 'Unlock PDF'}
        </Button>
      </form>
    </div>
  );
}
