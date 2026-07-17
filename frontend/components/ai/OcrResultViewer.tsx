"use client";

import { cn } from "@/lib/utils";
import type { OcrResult } from "@/types/detection";
import { ScanText, Hash, BadgeCheck } from "lucide-react";

interface OcrResultViewerProps {
  ocr?: OcrResult;
  rawText?: string;
  className?: string;
}

export function OcrResultViewer({ ocr, rawText, className }: OcrResultViewerProps) {
  const text = ocr?.rawText ?? rawText ?? "";
  const serial = ocr?.serialNumber;
  const ocrConfidence = ocr?.confidence;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Serial number highlight */}
      {serial && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Hash className="h-4 w-4 text-primary shrink-0" />
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              OCR Serial Number
            </span>
            <span className="font-mono text-sm font-black text-foreground tracking-widest">
              {serial}
            </span>
          </div>
        </div>
      )}

      {/* OCR confidence */}
      {ocrConfidence !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <BadgeCheck
            className={cn(
              "h-4 w-4 shrink-0",
              ocrConfidence >= 0.8 ? "text-emerald-400" : "text-amber-400"
            )}
          />
          <span className="text-muted-foreground">OCR Confidence:</span>
          <span className="font-bold text-foreground">
            {(ocrConfidence * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {/* Raw extracted text */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ScanText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Raw OCR Extraction
          </span>
        </div>
        <div className="relative">
          <pre className="text-xs font-mono text-foreground/80 leading-relaxed bg-zinc-950/60 border border-border/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
            {text || "No OCR text extracted."}
          </pre>
        </div>
      </div>

      {/* Denomination text if available */}
      {ocr?.denominationText && (
        <div className="flex items-start gap-2 text-xs">
          <span className="text-muted-foreground">Denomination text detected:</span>
          <span className="font-mono font-bold text-foreground">{ocr.denominationText}</span>
        </div>
      )}
    </div>
  );
}
export default OcrResultViewer;
