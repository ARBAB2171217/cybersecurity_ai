"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

export function CameraCapture({ onCapture, onCancel }: { onCapture: (f: File) => void, onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, []);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCamera();
        onCapture(file);
      }
    }, "image/jpeg");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded-xl border border-border">
      <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs">
            Waiting for camera access...
          </div>
        )}
      </div>
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => { stopCamera(); onCancel(); }}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="button" onClick={capture}>
          <Camera className="mr-2 h-4 w-4" /> Capture Note
        </Button>
      </div>
    </div>
  );
}
