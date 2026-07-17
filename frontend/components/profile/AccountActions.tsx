"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user.service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Trash2, MailCheck, AlertTriangle } from "lucide-react";

export function AccountActions() {
  const { user, checkAuth, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await userService.resendVerification();
      if (res.success) {
        alert("Verification email has been sent. Please check your inbox.");
      } else {
        alert(res.message || "Failed to resend verification email.");
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleDelete = async () => {
    const confirmMessage = "Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all data.";
    if (!window.confirm(confirmMessage)) return;
    
    setIsDeleting(true);
    try {
      const res = await userService.deleteAccount();
      if (res.success) {
        logout();
      } else {
        alert(res.message || "Failed to delete account.");
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MailCheck className="h-5 w-5 text-primary" />
            Email Verification
          </CardTitle>
          <CardDescription>Manage your email verification status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card">
            <div>
              <p className="text-sm font-medium">Status: {(user as any)?.isVerified ? <span className="text-emerald-500">Verified</span> : <span className="text-amber-500">Unverified</span>}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(user as any)?.isVerified 
                  ? "Your email address is verified and secure." 
                  : "Please verify your email address to unlock all features."}
              </p>
            </div>
            {!(user as any)?.isVerified && (
              <Button variant="outline" size="sm" onClick={handleResend} isLoading={isResending}>
                Resend Verification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete} isLoading={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
