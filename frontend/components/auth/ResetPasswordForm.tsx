"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";
import { Button } from "../ui/button";

interface ResetPasswordFormProps {
  email: string;
  code: string;
  onSuccess: () => void;
}

export function ResetPasswordForm({ email, code, onSuccess }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.resetPassword(email, code, data);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || "Failed to reset password.");
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Too many attempts. Please try again in 2 minutes.");
      } else {
        setError(err?.response?.data?.detail || err?.response?.data?.message || err.message || "Failed to reset password.");
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
          New password
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

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Confirm new password
        </label>
        <input
          type="password"
          placeholder="••••••••"
          {...register("confirm_password")}
          className="w-full h-11 px-3 rounded-lg border border-border bg-zinc-950/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {errors.confirm_password && (
          <p className="text-xs text-destructive font-medium mt-1.5">{errors.confirm_password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11 text-base font-medium mt-2" isLoading={isLoading}>
        Change password
      </Button>
    </form>
  );
}
export default ResetPasswordForm;
