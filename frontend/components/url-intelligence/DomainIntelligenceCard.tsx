import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, Server, Globe, Layers, Settings, ShieldAlert, Calendar, Clock } from "lucide-react";
import { ParsedURLResult } from "@/utils/urlParser";
import { BrandMatchResult } from "@/utils/brandSimilarity";

interface DomainIntelligenceCardProps {
  parsedFinal: ParsedURLResult;
  brandMatch?: BrandMatchResult;
  consistency?: {
    domainChanged: boolean;
    protocolChanged: boolean;
    tldChanged: boolean;
    protocolDowngraded: boolean;
    suspiciousRedirect: boolean;
  };
  whois?: {
    creation_date: string;
    expiration_date: string;
    updated_date: string;
    domain_age_days: string;
  };
}

export function DomainIntelligenceCard({
  parsedFinal,
  brandMatch,
  consistency,
  whois
}: DomainIntelligenceCardProps) {
  return (
    <Card className="bg-zinc-950/20 border-border/40">
      <CardHeader className="pb-3 border-b border-border/10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <Server className="h-4 w-4" /> Domain & Brand Intelligence
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4 text-xs">
        {/* Domain Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Server className="h-3 w-3" /> Fully Qualified Host
            </span>
            <p className="font-mono font-bold text-foreground break-all">{parsedFinal.hostname}</p>
          </div>

          <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" /> Root Domain
            </span>
            <p className="font-mono font-bold text-foreground truncate">{parsedFinal.rootDomain || "N/A"}</p>
          </div>

          <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Settings className="h-3 w-3" /> Subdomain Path
            </span>
            <p className="font-mono font-bold text-foreground truncate">{parsedFinal.subdomain || "None"}</p>
          </div>

          <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> Top-Level TLD
            </span>
            <p className="font-mono font-bold text-foreground">.{parsedFinal.tld || "None"}</p>
          </div>
        </div>

        {/* WHOIS Metrics Grid */}
        {whois && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/10">
            <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Registration Date
              </span>
              <p className="font-mono font-bold text-foreground">{whois.creation_date || "N/A"}</p>
            </div>
            
            <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Expiration Date
              </span>
              <p className="font-mono font-bold text-foreground">{whois.expiration_date || "N/A"}</p>
            </div>

            <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Last Updated
              </span>
              <p className="font-mono font-bold text-foreground">{whois.updated_date || "N/A"}</p>
            </div>

            <div className="bg-zinc-900/40 border border-border/10 rounded-lg p-3 space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Domain Age
              </span>
              <p className="font-mono font-bold text-foreground">{whois.domain_age_days || "N/A"}</p>
            </div>
          </div>
        )}

        {/* Brand Spoof Warnings */}
        {brandMatch && brandMatch.detected ? (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
            <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-destructive">Impersonation Attempt Flagged</span>
              <p className="text-[11px] text-destructive/80 leading-relaxed">
                {brandMatch.description} This domain exhibits typosquatting techniques designed to mimic "{brandMatch.brand}".
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-400">Brand Safety Cleared</span>
              <p className="text-[10px] text-muted-foreground">
                No visual likenesses or lookalikes identified targeting well-known brands.
              </p>
            </div>
          </div>
        )}

        {/* Consistency Check Statuses */}
        {consistency && (
          <div className="space-y-2 border-t border-border/10 pt-3">
            <span className="text-[9px] uppercase font-bold text-muted-foreground block font-mono">Consistency Diagnostics</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-zinc-950/40 p-2 rounded border border-border/10">
                <span className="text-muted-foreground">Host Changed</span>
                <span className={consistency.domainChanged ? "text-amber-400 font-bold" : "text-emerald-400"}>
                  {consistency.domainChanged ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/40 p-2 rounded border border-border/10">
                <span className="text-muted-foreground">Proto Changed</span>
                <span className={consistency.protocolChanged ? "text-amber-400 font-bold" : "text-emerald-400"}>
                  {consistency.protocolChanged ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/40 p-2 rounded border border-border/10 col-span-2">
                <span className="text-muted-foreground">Encryption Downgrade</span>
                <span className={consistency.protocolDowngraded ? "text-destructive font-bold animate-pulse" : "text-emerald-400"}>
                  {consistency.protocolDowngraded ? "Yes (Insecure)" : "None"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
