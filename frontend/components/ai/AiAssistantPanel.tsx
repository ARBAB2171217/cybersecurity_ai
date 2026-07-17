"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2 } from "lucide-react";
import detectionService from "@/services/detection.service";

export function AiAssistantPanel({ reportId }: { reportId: string }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const predefinedQuestions = [
    "Why was this note flagged as fake?",
    "Can you explain the watermark feature?",
    "How do I verify the security thread manually?"
  ];

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion("");
    
    // Add optimistic question
    setHistory((prev) => [...prev, { q, a: "" }]);
    
    try {
      const res = await detectionService.askAssistant(reportId, q);
      setHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = res.data || "The assistant couldn't generate an answer.";
        return newHistory;
      });
    } catch (err) {
      setHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].a = "Error communicating with the assistant.";
        return newHistory;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20 mt-6 print:hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Detection Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.length > 0 && (
          <div className="space-y-4 max-h-60 overflow-y-auto p-3 bg-zinc-950/50 rounded-lg border border-border/20">
            {history.map((item, i) => (
              <div key={i} className="space-y-2 text-xs">
                <div className="font-bold text-primary">You: {item.q}</div>
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {item.a ? item.a : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {history.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {predefinedQuestions.map((pq) => (
              <Button key={pq} variant="outline" size="sm" onClick={() => handleAsk(pq)} disabled={loading} className="text-[10px]">
                {pq}
              </Button>
            ))}
          </div>
        )}

        <form 
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
        >
          <input
            type="text"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Ask a question about this scan..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={!question.trim() || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
