import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, Eye, EyeOff, Globe, Server, Layers, Link as LinkIcon } from "lucide-react";
import { ParsedURLResult } from "@/utils/urlParser";

interface URLCardProps {
  original: ParsedURLResult;
  final: ParsedURLResult;
}

export function URLCard({ original, final }: URLCardProps) {
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);
  const [expandOrig, setExpandOrig] = useState(false);
  const [expandFinal, setExpandFinal] = useState(false);

  const handleCopy = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "Website": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "IP Address URL": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "File Download": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "API Endpoint": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Localhost": return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <Card className="bg-zinc-950/20 border-border/40">
      <CardHeader className="pb-3 border-b border-border/10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <LinkIcon className="h-4 w-4" /> URL Component Details
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4 text-xs">
        {/* Original URL Display */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Original Submission</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setExpandOrig(!expandOrig)}
              >
                {expandOrig ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {expandOrig ? "Collapse" : "Expand"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(original.originalUrl, setCopiedOrig)}
              >
                {copiedOrig ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedOrig ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <p className={`font-mono text-zinc-400 select-all break-all ${expandOrig ? "" : "line-clamp-2"}`}>
            {original.originalUrl}
          </p>
        </div>

        {/* Final URL Display */}
        <div className="space-y-1 pt-2 border-t border-border/5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Final Resolved Address</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setExpandFinal(!expandFinal)}
              >
                {expandFinal ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {expandFinal ? "Collapse" : "Expand"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(final.originalUrl, setCopiedFinal)}
              >
                {copiedFinal ? <Check className="h-3 w-3 mr-1 text-emerald-400" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedFinal ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <p className={`font-mono text-foreground font-semibold select-all break-all ${expandFinal ? "" : "line-clamp-2"}`}>
            {final.originalUrl}
          </p>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/10 font-mono">
          <div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Protocol</span>
            <span className="text-xs font-semibold text-foreground">{final.protocol || "N/A"}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">IP Type</span>
            <span className="text-xs font-semibold text-foreground">{final.ipType || "N/A"}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">Category</span>
            <Badge variant="outline" className={`text-[8px] font-bold py-0.5 mt-0.5 uppercase ${getCategoryBadgeColor(final.category)}`}>
              {final.category}
            </Badge>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground block">TLD</span>
            <span className="text-xs font-semibold text-foreground">.{final.tld || "none"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
