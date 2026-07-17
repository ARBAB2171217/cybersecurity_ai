"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { resolveRole } from "@/utils/permissions";
import { getDefaultRedirect } from "@/utils/routes";
import { Shield, Eye, ScanLine, FileBarChart2, ArrowRight } from "lucide-react";
import { ROUTES, STORAGE_KEYS } from "@/lib/constants";

function LandingPageContent() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  const searchParams = useSearchParams();
  const authMode = searchParams.get("auth");

  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
    setHasToken(!!token);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userRole = resolveRole(user);
      router.replace(getDefaultRedirect(userRole));
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (authMode === "login") {
      setIsRegisterOpen(false);
      setIsLoginOpen(true);
    } else if (authMode === "register") {
      setIsLoginOpen(false);
      setIsRegisterOpen(true);
    }
  }, [authMode]);

  if (isLoading || (hasToken && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-xs text-muted-foreground font-semibold animate-pulse">Loading gateway landing interface...</span>
      </div>
    );
  }

  const handleOpenLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const handleOpenRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onOpenLogin={handleOpenLogin} onOpenRegister={handleOpenRegister} />

      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center justify-center text-center px-4">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
          
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              Phase 2 Active // Auth Module Enabled
            </span>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              AI-Powered Indian Currency <br />
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Counterfeit Detection</span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              Verify security thread motifs, extract alphanumeric serial codes, and detect counterfeit rupee bills utilizing deep vision analysis.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <button
                onClick={handleOpenLogin}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:scale-[1.02]"
              >
                Access Portal <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleOpenRegister}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-zinc-900/50 hover:bg-zinc-800/80 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:scale-[1.02]"
              >
                Request Access
              </button>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-zinc-950/20 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Security Features & Analysis Matrix</h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                CyberShield employs a multi-tiered validation architecture engineered to match reserve bank standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass glass-hover p-6 rounded-xl flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">Deep Vision Models</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dual-layered visual validation utilizing Gemini Vision micro-classifiers to verify security motifs and microprinting.
                </p>
              </div>

              <div className="glass glass-hover p-6 rounded-xl flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ScanLine className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">OCR Serial Verification</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Real-time OCR extraction utilizing EasyOCR framework with regex syntax checks to flags incorrect font configurations.
                </p>
              </div>

              <div className="glass glass-hover p-6 rounded-xl flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileBarChart2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">Detailed Reports</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automated scan reports logging confidence scores, denomination mapping, physical parameters, and history records.
                </p>
              </div>

              <div className="glass glass-hover p-6 rounded-xl flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">RBAC Enforced Access</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Granular role checks (Citizen/Admin/Super Admin) to protect citizen scans and secure backend query modules.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* System Stats / Metrics */}
        <section className="py-20 flex flex-col items-center justify-center px-4">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-primary">99.8%</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">AI Detection Accuracy</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-primary">&lt; 1.5s</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Processing Latency</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-primary">Zero Trust</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Network Architecture</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Auth Modals Container */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={handleOpenRegister}
        onSwitchToForgotPassword={() => {
          setIsLoginOpen(false);
          window.location.href = ROUTES.FORGOT_PASSWORD;
        }}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={handleOpenLogin}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-xs text-muted-foreground font-semibold animate-pulse">Loading gateway landing interface...</span>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  );
}
