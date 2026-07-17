"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileInput } from "@/schemas/profile.schema";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export function ProfileForm() {
  const { updateProfile } = useUser();
  const { user, checkAuth } = useAuth();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const response = await updateProfile(data);
      if (response.success) {
        setStatusMsg({ type: "success", message: "Profile details updated successfully." });
        await checkAuth();
      } else {
        setStatusMsg({ type: "error", message: response.message || "Failed to update profile." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", message: err.message || "Failed to update profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              Email Address
            </label>
            <Input value={user?.email || ""} disabled readOnly className="opacity-60 cursor-not-allowed" />
            <p className="text-[10px] text-muted-foreground mt-1">Contact administrators to request email address modifications.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Full Name
            </label>
            <Input {...register("fullName")} error={!!errors.fullName} placeholder="Jane Doe" />
            {errors.fullName && (
              <p className="text-[10px] text-destructive font-semibold mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Save Profile Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
export default ProfileForm;
