"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadSchema, UploadInput } from "@/schemas/upload.schema";
import { useDetectionStore } from "@/store/detection.store";
import { FileUploader } from "@/components/common/FileUploader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { ROUTES } from "@/lib/constants";
import type { Denomination } from "@/lib/constants";
import { Sparkles, Upload, AlertTriangle, CheckCircle, Camera, Link as LinkIcon, FileImage, Globe } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "@/components/upload/CameraCapture";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";

export function EvidenceUploader() {
  const router = useRouter();
  const { analyze, status, progress, error, result, reset } = useDetectionStore();
  const [files, setFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "camera" | "url">("file");
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);
  const [urlError, setUrlError] = useState("");

  const isLoading = status === "uploading" || status === "processing" || isUrlProcessing;
  const isSuccess = status === "success";

  const handleClear = () => {
    setFiles([]);
    setUrlInput("");
    setUrlError("");
    useDetectionStore.getState().reset();
  };

  const statusLabel = () => {
    if (isUrlProcessing) return "Analyzing URL Threat Intelligence...";
    if (status === "uploading") return "Uploading evidence to server...";
    if (status === "processing") return "AI pipeline running analysis...";
    return "";
  };

  const processUrl = async () => {
    if (!urlInput) return;
    setIsUrlProcessing(true);
    setUrlError("");
    try {
      // Create a mock report for URL since they are not saved in DB via standard pipeline yet, or maybe they are?
      // Actually, if we just redirect to Dashboard's URL Intelligence anchor, it works, 
      // but to integrate it fully, let's process it and redirect.
      // Wait, we can just push to dashboard with anchor and populate a store, or do the URL analysis right here and show it.
      // A better way: redirect to URL Intelligence page with the url in query params.
      router.push(`${ROUTES.URL_INTELLIGENCE}?url=${encodeURIComponent(urlInput)}`);
    } catch (e: any) {
      setUrlError(e.message || "Failed to process URL.");
    } finally {
      setIsUrlProcessing(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (activeTab === "url") {
      await processUrl();
      return;
    }
    
    if (!files || files.length === 0) return;
    try {
      const reports: string[] = [];
      for (const f of files) {
        const reportId = await analyze(f, undefined);
        if (reportId) reports.push(reportId);
      }
      if (reports.length > 0) {
        if (reports.length === 1) {
            setTimeout(() => {
                router.push(ROUTES.DETECTION_RESULT(reports[0]));
            }, 3000);
        } else {
            router.push(ROUTES.REPORTS);
        }
      }
    } catch {
      // Error is captured in the store
    }
  };

  return (
    <Card className="border-none shadow-none relative overflow-hidden bg-transparent">
      <div className="flex flex-col items-center text-center pb-4 pt-6">
        <Upload className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
        <CardTitle className="text-sm font-bold">Drag & Drop Analysis Hub</CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">Select file to view and to analyze</p>
      </div>

      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border/20 pb-4">
            <Button 
              variant={activeTab === "file" ? "default" : "secondary"} 
              size="sm" 
              onClick={() => setActiveTab("file")}
              className={`text-xs transition-all ${activeTab === "file" ? "shadow-lg shadow-primary/20" : "bg-zinc-900/50 hover:bg-zinc-800"}`}
            >
              <FileImage className="h-4 w-4 mr-2" /> Upload File
            </Button>
            <Button 
              variant={activeTab === "camera" ? "default" : "secondary"} 
              size="sm" 
              onClick={() => setActiveTab("camera")}
              className={`text-xs transition-all ${activeTab === "camera" ? "shadow-lg shadow-primary/20" : "bg-zinc-900/50 hover:bg-zinc-800"}`}
            >
              <Camera className="h-4 w-4 mr-2" /> Camera
            </Button>
            <Button 
              variant={activeTab === "url" ? "default" : "secondary"} 
              size="sm" 
              onClick={() => setActiveTab("url")}
              className={`text-xs transition-all ${activeTab === "url" ? "shadow-lg shadow-primary/20" : "bg-zinc-900/50 hover:bg-zinc-800"}`}
            >
              <LinkIcon className="h-4 w-4 mr-2" /> Paste URL
            </Button>
        </div>

        <div className="space-y-6">
          {(error || urlError) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error || urlError}</span>
            </div>
          )}

          {isSuccess && result && (
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Evidence Detected: {result.evidenceType || "Unknown"}</span>
              </div>
              <div className="text-xs ml-7 space-y-1">
                {result.rawAiResponse?.qr_details ? (
                  <>
                    <p>QR Type: <span className="font-semibold text-emerald-300">{result.rawAiResponse.qr_details.qr_type}</span></p>
                    <p>Decoded Content: <span className="font-semibold text-emerald-300 truncate inline-block max-w-[200px] align-bottom">{result.rawAiResponse.qr_details.decoded_value}</span></p>
                    <p>Confidence: <span className="font-semibold text-emerald-300">{(result.rawAiResponse.qr_details.confidence * 100).toFixed(0)}%</span></p>
                  </>
                ) : (
                  <p>Selected Analysis: <span className="font-semibold text-emerald-300">{result.selectedPipeline || "Generic Analysis"}</span></p>
                )}
                <p className="animate-pulse mt-2 text-emerald-500/80">Automatically continuing to results...</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "file" && (
                <div className="bg-zinc-950/30 p-1 rounded-xl border border-border/30">
                  <FileUploader onFilesSelected={(fs) => setFiles(fs)} multiple={true} />
                  {files.length > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground mt-2 px-2 pb-1">
                      Ready to analyze: <span className="font-semibold text-primary">{files.length} file(s) selected</span>
                    </motion.p>
                  )}
                </div>
              )}

              {activeTab === "camera" && (
                <div className="bg-zinc-950/30 p-1 rounded-xl border border-border/30">
                  <CameraCapture onCapture={(f) => { setFiles([f]); setActiveTab("file"); }} onCancel={() => setActiveTab("file")} />
                </div>
              )}

              {activeTab === "url" && (
                <div className="bg-zinc-950/30 p-4 rounded-xl border border-border/30 space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Analyze Suspicious Link
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="https://example.com/login" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="bg-zinc-900/60 border-border/50 text-sm pl-10 h-11 focus:ring-primary/30 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">
                    Our AI evaluates the domain reputation, page content, and potential phishing indicators in real-time.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {isLoading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>{statusLabel()}</span>
                <span>{progress || 50}%</span>
              </div>
              <Progress value={progress || 50} className="h-1.5" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {(files.length > 0 || urlInput) && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </Button>
            )}
            <Button
              type="button"
              className="flex-1 flex items-center gap-2 shadow-primary/20 shadow-lg"
              onClick={handleBatchSubmit}
              isLoading={isLoading}
              disabled={(files.length === 0 && !urlInput) || isLoading || isSuccess}
            >
              <Upload className="h-4 w-4" />
              {isLoading ? "Analysing Evidence..." : "Launch AI Classifier"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EvidenceUploader;
