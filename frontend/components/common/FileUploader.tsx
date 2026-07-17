"use client";

import { UploadCloud, File, X } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export function FileUploader({
  onFilesSelected,
  accept = "image/*",
  multiple = false,
  className,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      const filtered = multiple ? filesArray : [filesArray[0]];
      setSelectedFiles(filtered);
      onFilesSelected(filtered);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const filtered = multiple ? filesArray : [filesArray[0]];
      setSelectedFiles(filtered);
      onFilesSelected(filtered);
    }
  };

  const handleRemove = (idx: number) => {
    const updated = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all",
          isDragOver
            ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
            : "border-border/60 bg-zinc-950/20 hover:border-border hover:bg-zinc-950/40"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm font-semibold text-foreground">
          Drag & Drop file to analyze
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Or click to browse storage files (JPG, PNG, PDF up to 10MB)
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-zinc-900/40 text-xs"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <File className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {file.name}
                </span>
                <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-white/5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default FileUploader;
