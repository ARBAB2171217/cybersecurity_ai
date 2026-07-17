"use client";

import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { Button } from "../ui/button";
import { authService } from "@/services/auth.service";

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  if (localPart.length <= 2) return `*@${domain}`;
  const firstTwo = localPart.slice(0, 2);
  const lastChar = localPart.slice(-1);
  return `${firstTwo}***${lastChar}@${domain}`;
}

interface OtpInputProps {
  email: string;
  purpose: "REGISTRATION" | "PASSWORD_RESET" | "LOGIN";
  onSuccess: (code?: string) => void;
  onCancel?: () => void;
  // If provided, the parent is handling verification (like in forgot password). 
  // Otherwise this component handles verify via API (like in registration).
  mode: "auto-verify" | "pass-code"; 
}

export function OtpInput({ email, purpose, onSuccess, onCancel, mode }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const focusInput = (index: number) => {
    if (index >= 0 && index < 6) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight") {
      focusInput(index + 1);
    }
  };

  const handleChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return; // Only allow digits
    
    const newOtp = [...otp];
    // Take only the last character if they typed multiple somehow (except on paste)
    newOtp[index] = val.slice(-1); 
    setOtp(newOtp);

    if (val !== "" && index < 5) {
      focusInput(index + 1);
    }
    
    setError(null);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    focusInput(Math.min(pastedData.length, 5));
    setError(null);
  };

  const submitOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (mode === "pass-code") {
        onSuccess(code);
      } else {
        const response = await authService.verifyOTP({
          email,
          code,
          purpose,
        });
        if (response.success) {
          onSuccess(code);
        } else {
          setError(response.message || "Invalid verification code.");
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setError("Too many attempts. Please try again in 2 minutes.");
      } else if (err?.response?.data?.detail?.includes("expired")) {
         setError("This code has expired. Please request a new one.");
      } else {
        setError(err?.response?.data?.detail || err.message || "Invalid verification code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setOtp(Array(6).fill(""));
    focusInput(0);
    try {
      await authService.sendOTP({ email, purpose });
      setCountdown(30);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Too many requests. Please wait before resending.");
      } else {
        setError("Failed to resend code.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-muted-foreground mb-4">
        We've sent a verification code to <span className="font-semibold text-foreground">{maskEmail(email)}</span>
      </div>

      <div className="flex justify-center gap-2 sm:gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-lg border bg-zinc-950/40 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              error ? "border-destructive focus:ring-destructive" : "border-border"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-destructive text-center font-medium">{error}</p>
      )}

      <Button onClick={submitOtp} className="w-full" isLoading={isLoading} disabled={otp.join("").length < 6}>
        Verify Code
      </Button>

      <div className="text-center text-sm">
        {countdown > 0 ? (
          <span className="text-muted-foreground">Resend code in {countdown >= 10 ? `00:${countdown}` : `00:0${countdown}`}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-primary hover:underline font-semibold"
          >
            Resend code
          </button>
        )}
      </div>
      
      {onCancel && (
        <div className="text-center mt-2">
           <button
            type="button"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}
