"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { Button } from "../ui/button";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { OtpInput } from "./OtpInput";
import { AuthLayout } from "./AuthLayout";
import { X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { resolveRole } from "@/utils/permissions";
import { getDefaultRedirect } from "@/utils/routes";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}: LoginModalProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [otpPurpose, setOtpPurpose] = useState<"LOGIN" | "REGISTRATION">("LOGIN");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      const remembered = localStorage.getItem("cybershield_remembered_email");
      if (remembered) {
        setValue("email", remembered);
        setRememberMe(true);
      }
    }
  }, [setValue, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      // Citizen login only. Admin login moved to /admin/login
      const response = await authService.loginUser(data);

      if (response.success && response.data) {
        if (rememberMe) {
          localStorage.setItem("cybershield_remembered_email", data.email);
        } else {
          localStorage.removeItem("cybershield_remembered_email");
        }

        await login(response.data.access_token, response.data.refresh_token);
        onClose();
        
        const updatedUser = useAuthStore.getState().user;
        const userRole = resolveRole(updatedUser);
        window.location.href = getDefaultRedirect(userRole);
      } else {
        setError(response.message || "Authentication failed.");
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Too many attempts. Please try again in 2 minutes.");
      } else if (err?.response?.status === 403 && (err.response.data?.detail?.includes("verified") || err.response.data?.detail?.includes("device"))) {
        // Handle unverified email or unknown device requiring OTP
        setEmailForOtp(data.email);
        setOtpPurpose(err.response.data.detail.includes("device") ? "LOGIN" : "REGISTRATION");
        setStep("OTP");
      } else {
        setError(err?.response?.data?.message || err.message || "Failed to authenticate.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = async (code?: string) => {
    // For LOGIN purpose, the OTP verify doesn't return the token in this app's flow unless we change it.
    // Actually, verifyOTP just returns success. If we just re-submit the login form, it should work now
    // because the backend can mark the device as trusted or the email as verified.
    // Wait, if it's LOGIN purpose, we might need to resubmit the form.
    setIsLoading(true);
    setStep("FORM");
    handleSubmit(onSubmit)();
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginGoogle(credential);
      if (response.success && response.data) {
        await login(response.data.access_token, response.data.refresh_token);
        onClose();
        
        const updatedUser = useAuthStore.getState().user;
        const userRole = resolveRole(updatedUser);
        window.location.href = getDefaultRedirect(userRole);
      } else {
        setError(response.message || "Google authentication failed.");
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Too many attempts. Please try again in 2 minutes.");
      } else if (err?.response?.status === 403 && (err.response.data?.detail?.includes("verified") || err.response.data?.detail?.includes("device"))) {
        // We need the email for OTP. For Google Auth, if it's a new device, we might not have it in the form.
        // We will just extract it from the Google SDK token if possible, or we could return it from the backend.
        // But since we can't easily extract it without parsing JWT, we will let the user know they need to login manually.
        // Actually, if we require OTP for Google, it's better to just show the OTP form if we have the email.
        // Let's just ask them to verify via email link or show an error.
        setError(err.response.data.detail);
      } else {
        setError(err?.response?.data?.detail || err?.response?.data?.message || err.message || "Failed to authenticate via Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = (errMsg: string) => {
    setError(errMsg);
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
            {step === "FORM" ? "Welcome back" : "Security Verification"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {step === "FORM" ? "Log in to your account" : "Please enter the verification code sent to your email"}
          </p>
        </div>

        {step === "FORM" ? (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center font-medium">
              {error}
            </div>
          )}

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
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-foreground">
                Password
              </label>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
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

          <div className="flex items-center mt-2">
            <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-800 bg-zinc-950/40 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-zinc-950 transition-all cursor-pointer"
              />
              <span>Remember me</span>
            </label>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-medium mt-2" isLoading={isLoading}>
            Log in
          </Button>
        </form>

        <div className="relative my-6 text-center flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-border/40"></div>
          </div>
          <span className="relative bg-zinc-950 px-3 text-sm text-muted-foreground">
            or
          </span>
        </div>

        <GoogleLoginButton onSuccess={handleGoogleSuccess} onFailure={handleGoogleFailure} />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          New here?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-primary hover:underline font-medium"
          >
            Create account
          </button>
        </div>
          </>
        ) : (
          <OtpInput
            email={emailForOtp}
            purpose={otpPurpose}
            onSuccess={handleOTPSuccess}
            onCancel={() => setStep("FORM")}
            mode="auto-verify"
          />
        )}
      </div>
    </div>
  );
}
export default LoginModal;
