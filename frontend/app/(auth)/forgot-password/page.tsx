"use client";

import { useState, useEffect } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { OtpInput } from "@/components/auth/OtpInput";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ROUTES } from "@/lib/constants";

type Step = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

interface ForgotPasswordState {
  step: Step;
  email: string;
  code: string;
  timestamp: number;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("forgot_password_state");
    if (saved) {
      try {
        const parsed: ForgotPasswordState = JSON.parse(saved);
        // Expire state after 15 minutes
        if (Date.now() - parsed.timestamp < 15 * 60 * 1000) {
          setStep(parsed.step);
          setEmail(parsed.email);
          setCode(parsed.code);
        } else {
          sessionStorage.removeItem("forgot_password_state");
        }
      } catch (e) {
         // ignore
      }
    }
    setIsLoaded(true);
  }, []);

  // Save state to sessionStorage
  const updateState = (newState: Partial<ForgotPasswordState>) => {
    const currentState = { step, email, code, timestamp: Date.now() };
    const nextState = { ...currentState, ...newState };
    
    setStep(nextState.step);
    setEmail(nextState.email);
    setCode(nextState.code);
    
    sessionStorage.setItem("forgot_password_state", JSON.stringify(nextState));
  };

  const handleEmailSuccess = (targetEmail: string) => {
    updateState({ email: targetEmail, step: "OTP" });
  };

  const handleOTPSuccess = (otpCode?: string) => {
    if (otpCode) {
      updateState({ code: otpCode, step: "RESET" });
    } else {
      updateState({ step: "RESET" });
    }
  };

  const handleResetSuccess = () => {
    updateState({ step: "SUCCESS" });
    // Clear state on success so they don't get stuck if they come back
    sessionStorage.removeItem("forgot_password_state");
  };

  const handleCancelOTP = () => {
    updateState({ step: "EMAIL" });
  };

  if (!isLoaded) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-zinc-950 border border-border/40 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {step === "EMAIL" && "Reset your password"}
            {step === "OTP" && "Check your email"}
            {step === "RESET" && "Create new password"}
            {step === "SUCCESS" && "Password updated"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {step === "EMAIL" && "Enter your email and we'll send you a recovery code."}
            {step === "OTP" && "Enter the verification code to continue."}
            {step === "RESET" && "Enter your new secure password below."}
            {step === "SUCCESS" && "Your password has been changed successfully."}
          </p>
        </div>

        {step === "EMAIL" && (
          <ForgotPasswordForm
            onSuccess={handleEmailSuccess}
            onCancel={() => {
              sessionStorage.removeItem("forgot_password_state");
              window.location.href = ROUTES.LOGIN;
            }}
          />
        )}
        {step === "OTP" && (
          <OtpInput
            email={email}
            purpose="PASSWORD_RESET"
            onSuccess={handleOTPSuccess}
            onCancel={handleCancelOTP}
            mode="pass-code"
          />
        )}
        {step === "RESET" && (
          <ResetPasswordForm email={email} code={code} onSuccess={handleResetSuccess} />
        )}
        {step === "SUCCESS" && (
          <div className="text-center space-y-4 mt-4">
            <button
              onClick={() => {
                window.location.href = ROUTES.LOGIN;
              }}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:bg-primary/95 transition-all"
            >
              Back to log in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
