import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
}

export function FileUpload({ onFileSelect, file, onClear }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile?.type === 'application/pdf') {
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
      e.target.value = '';
    },
    [onFileSelect]
  );

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Remove file">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('pdf-input')?.click()}
    >
      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">
        Drag & drop your Aadhaar PDF here
      </p>
      <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
      <Button variant="outline" size="sm" type="button">
        Select PDF File
      </Button>
      <input
        id="pdf-input"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
