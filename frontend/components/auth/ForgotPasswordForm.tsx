"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";
import { Button } from "../ui/button";

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

export function ForgotPasswordForm({ onSuccess, onCancel }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.sendOTP({
        email: data.email,
        purpose: "PASSWORD_RESET",
      });
      if (response.success) {
        onSuccess(data.email);
      } else {
        setError(response.message || "Failed to send verification code.");
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Too many requests. Please wait a moment before trying again.");
      } else {
        setError(err?.response?.data?.message || err.message || "Failed to send verification code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email address
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

      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" className="w-full h-11 text-base font-medium" isLoading={isLoading}>
          Send reset code
        </Button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}
export default ForgotPasswordForm;
