"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsInput } from "@/schemas/settings.schema";
import { useUser } from "@/hooks/useUser";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export function SecuritySettingsForm() {
  const { updateSecurity } = useUser();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
  });

  const onSubmit = async (data: SettingsInput) => {
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const response = await updateSecurity({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (response.success) {
        setStatusMsg({ type: "success", message: "Password updated successfully." });
        reset();
      } else {
        setStatusMsg({ type: "error", message: response.message || "Failed to change password." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to change password." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Security Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} className="space-y-6">
          {statusMsg && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold text-center ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {statusMsg.message}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Current Password
            </label>
            <Input type="password" {...register("currentPassword")} error={!!errors.currentPassword} placeholder="••••••••" />
            {errors.currentPassword && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              New Password
            </label>
            <Input type="password" {...register("newPassword")} error={!!errors.newPassword} placeholder="••••••••" />
            {errors.newPassword && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Confirm New Password
            </label>
            <Input type="password" {...register("confirmPassword")} error={!!errors.confirmPassword} placeholder="••••••••" />
            {errors.confirmPassword && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Change Security Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
export default SecuritySettingsForm;
