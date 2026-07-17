"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { securitySchema, SecurityInput } from "@/schemas/profile.schema";
import { useUser } from "@/hooks/useUser";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ChangePasswordForm() {
  const { updateSecurity } = useUser();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SecurityInput>({
    resolver: zodResolver(securitySchema),
  });

  const onSubmit = async (data: SecurityInput) => {
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const response = await updateSecurity(data);
      if (response.success) {
        setStatusMsg({ type: "success", message: "Password updated successfully." });
        reset();
      } else {
        setStatusMsg({ type: "error", message: response.message || "Failed to update password." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.response?.data?.detail || err.message || "Failed to update password." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Security Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {statusMsg.message}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Current Password
            </label>
            <Input type="password" {...register("currentPassword")} error={!!errors.currentPassword} placeholder="Enter your current password" />
            {errors.currentPassword && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              New Password
            </label>
            <Input type="password" {...register("newPassword")} error={!!errors.newPassword} placeholder="Enter a new strong password" />
            {errors.newPassword && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <Button type="submit" isLoading={isSubmitting} variant="default" className="w-full sm:w-auto">
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
