"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/Switch";
import { useState } from "react";

export default function AdminSettingsPage() {
  const [minConfidence, setMinConfidence] = useState(90);
  const [requireOcrCheck, setRequireOcrCheck] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);
    setTimeout(() => {
      setStatusMsg("System thresholds and rules updated.");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "Admin Panel", href: "/admin/dashboard" }, { label: "System Rules" }]} />
        <h1 className="text-xl font-black text-foreground tracking-tight sm:text-2xl">
          System Rules & Parameters
        </h1>
        <p className="text-xs text-muted-foreground">
          Tune classification certainty requirements, rate limits, and OCR matching algorithms.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Algorithm Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {statusMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold text-center">
                {statusMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Minimum Verification Confidence (%)
              </label>
              <Input
                type="number"
                min="50"
                max="100"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Classifications resolving with confidence under this index are directed to manual reviews.</p>
            </div>

            <div className="flex items-center justify-between border-t border-b border-border/20 py-4">
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-foreground block">Strict OCR Serial Matching</span>
                <span className="text-muted-foreground">Require OCR serial sequences to match central bank signature records.</span>
              </div>
              <Switch checked={requireOcrCheck} onChange={() => setRequireOcrCheck(!requireOcrCheck)} />
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Update Rules Matrix
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
