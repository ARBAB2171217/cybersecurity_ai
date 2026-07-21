"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/schemas/auth.schema";
import { authService, TokenPair } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import { OtpInput } from "./OtpInput";
import { X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { resolveRole } from "@/utils/permissions";
import { getDefaultRedirect } from "@/utils/routes";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  if (!isOpen) return null;

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      if (response.success) {
        setEmail(data.email);
        setStep("OTP");
      } else {
        setError(response.message || "Registration failed.");
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Too many attempts. Please try again in 2 minutes.");
      } else {
        setError(err?.response?.data?.message || err.message || "Failed to register.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = async () => {
    // Registration complete, OTP verified. 
    // Now switch to login so they can log in normally.
    onSwitchToLogin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-950 border border-border/40 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {step === "FORM" ? "Create an account" : "Check your email"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
             {step === "FORM" ? "Join us and start scanning" : "Enter the verification code to continue"}
          </p>
        </div>

        {step === "FORM" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                {...register("full_name")}
                className="w-full h-11 px-3 rounded-lg border border-border bg-zinc-950/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.full_name && (
                <p className="text-xs text-destructive font-medium mt-1.5">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                className="w-full h-11 px-3 rounded-lg border border-border bg-zinc-950/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="w-full h-11 px-3 rounded-lg border border-border bg-zinc-950/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium mt-2" isLoading={isLoading}>
              Create account
            </Button>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
            </div>
          </form>
        ) : (
          <OtpInput
            email={email}
            purpose="REGISTRATION"
            onSuccess={handleOTPSuccess}
            onCancel={() => setStep("FORM")}
            mode="auto-verify"
          />
        )}
      </div>
    </div>
  );
}
export default RegisterModal;
