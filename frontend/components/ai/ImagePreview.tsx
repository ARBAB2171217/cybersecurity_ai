"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { Banknote } from "lucide-react";

interface ImagePreviewProps {
  imageUrl?: string;
  preprocessedImageUrl?: string;
  className?: string;
}

export function ImagePreview({ imageUrl, preprocessedImageUrl, className }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<"original" | "processed">("original");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeSrc = mode === "original" ? imageUrl : preprocessedImageUrl;
  const hasPreprocessed = !!preprocessedImageUrl;

  const zoomIn  = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const reset   = () => setZoom(1);

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Toggle between original / preprocessed */}
        {hasPreprocessed && (
          <div className="flex gap-1 p-1 rounded-lg bg-zinc-900/60 border border-border/30 w-fit">
            {(["original", "processed"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all",
                  mode === m
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "original" ? "Original" : "Pre-processed"}
              </button>
            ))}
          </div>
        )}

        {/* Image frame */}
        <div className="relative rounded-xl overflow-hidden border border-border/30 bg-zinc-950">
          <div className="overflow-auto max-h-80 flex items-center justify-center">
            {activeSrc ? (
              <img
                src={activeSrc}
                alt="Banknote scan"
                draggable={false}
                className="object-contain transition-transform duration-200 select-none"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center", maxWidth: "100%" }}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Banknote className="h-12 w-12 opacity-20" />
                <span className="text-xs font-semibold">No image available</span>
              </div>
            )}
          </div>

          {/* Controls overlay */}
          {activeSrc && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              {[
                { icon: ZoomOut, action: zoomOut, label: "Zoom out" },
                { icon: RotateCcw, action: reset,   label: "Reset zoom" },
                { icon: ZoomIn,  action: zoomIn,  label: "Zoom in" },
                { icon: Maximize2, action: () => setIsFullscreen(true), label: "Fullscreen" },
              ].map(({ icon: Icon, action, label }) => (
                <button
                  key={label}
                  onClick={action}
                  aria-label={label}
                  className="h-7 w-7 rounded-lg bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <Icon className="h-3.5 w-3.5 text-white" />
                </button>
              ))}
            </div>
          )}

          {/* Zoom indicator */}
          {activeSrc && zoom !== 1 && (
            <div className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 backdrop-blur text-white px-2 py-1 rounded-md">
              {Math.round(zoom * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && activeSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={activeSrc}
            alt="Banknote scan fullscreen"
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
          />
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            aria-label="Close fullscreen"
          >
            <RotateCcw className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
    </>
  );
}
export default ImagePreview;
