"use client";

import { cn } from "@/lib/utils";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, BookOpen } from "lucide-react";

interface RecommendationPanelProps {
  isCounterfeit: boolean;
  riskScore: number;
  className?: string;
}

interface Recommendation {
  icon: React.ElementType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

function getRecommendations(isCounterfeit: boolean, riskScore: number): Recommendation[] {
  if (!isCounterfeit && riskScore <= 20) {
    return [
      {
        icon: ShieldCheck,
        title: "Note Accepted",
        description: "This banknote passed all security feature checks. It is safe to accept as legal tender.",
        priority: "low",
      },
      {
        icon: BookOpen,
        title: "Keep Records",
        description: "Archive this report for audit compliance. Maintain detection logs as required by banking norms.",
        priority: "low",
      },
    ];
  }

  if (!isCounterfeit && riskScore > 20) {
    return [
      {
        icon: AlertTriangle,
        title: "Proceed with Caution",
        description: "The note passed classification, but risk indicators are elevated. Cross-verify with UV light or manual inspection.",
        priority: "medium",
      },
      {
        icon: Shield,
        title: "Secondary Verification Advised",
        description: "Use the RBI Currency Verification Portal or nearest bank branch for a second opinion.",
        priority: "medium",
      },
    ];
  }

  // Counterfeit
  return [
    {
      icon: ShieldAlert,
      title: "Do NOT Accept This Note",
      description: "This note is flagged as a potential counterfeit. Refusing the note is your legal right under the Negotiable Instruments Act.",
      priority: "high",
    },
    {
      icon: AlertTriangle,
      title: "Report to Local Authorities",
      description: "Under RBI directive, suspected counterfeit notes must be surrendered to the nearest bank or police station. Do not attempt to pass it further.",
      priority: "high",
    },
    {
      icon: Shield,
      title: "Preserve Evidence",
      description: "Keep the note and this scan report. It may be required as evidence. Do not alter, cut, or mark the note.",
      priority: "medium",
    },
    {
      icon: BookOpen,
      title: "Understand Your Rights",
      description: "The passer of a counterfeit note is not criminally liable if they report it in good faith. Cooperation with authorities is strongly advised.",
      priority: "low",
    },
  ];
}

const PRIORITY_STYLES = {
  high:   { border: "border-destructive/30",  bg: "bg-destructive/5",  icon: "text-destructive"  },
  medium: { border: "border-amber-500/30",     bg: "bg-amber-500/5",    icon: "text-amber-400"    },
  low:    { border: "border-emerald-500/30",   bg: "bg-emerald-500/5",  icon: "text-emerald-400"  },
};

export function RecommendationPanel({ isCounterfeit, riskScore, className }: RecommendationPanelProps) {
  const recs = getRecommendations(isCounterfeit, riskScore);

  return (
    <div className={cn("space-y-3", className)}>
      {recs.map((rec, idx) => {
        const styles = PRIORITY_STYLES[rec.priority];
        const Icon = rec.icon;
        return (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border text-xs",
              styles.bg,
              styles.border
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", styles.icon)} />
            <div>
              <span className="font-bold text-foreground block">{rec.title}</span>
              <p className="text-muted-foreground leading-relaxed mt-0.5">{rec.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default RecommendationPanel;
