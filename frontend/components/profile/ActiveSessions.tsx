"use client";

import { useState, useEffect } from "react";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Globe, LogOut, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ActiveSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { logout } = useAuth();

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getSessions();
      if (res.success && res.data) {
        setSessions(res.data);
      } else {
        setError(res.message || "Failed to load sessions.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sessions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (token: string) => {
    setRevoking(token);
    try {
      const res = await userService.revokeSession(token);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.token !== token));
      } else {
        alert(res.message || "Failed to revoke session.");
      }
    } catch (err: any) {
      alert("Error revoking session.");
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to log out from all devices?")) return;
    try {
      await authService.logout();
      logout();
    } catch (err) {
      alert("Error logging out all devices.");
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Active Sessions</CardTitle>
        <Button variant="outline" size="sm" onClick={handleLogoutAll} className="text-xs">
          Logout All Devices
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive text-sm p-4 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No active sessions found.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    {session.user_agent?.toLowerCase().includes("mobile") ? (
                      <Smartphone className="h-5 w-5" />
                    ) : session.user_agent?.toLowerCase().includes("mozilla") || session.user_agent?.toLowerCase().includes("chrome") ? (
                      <Globe className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1 max-w-[200px] sm:max-w-full" title={session.user_agent}>
                      {session.user_agent || "Unknown Device"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{session.ip_address || "Unknown IP"}</span>
                      <span>•</span>
                      <span>Expires: {new Date(session.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRevoke(session.token)}
                  disabled={revoking === session.token}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {revoking === session.token ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revoke"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
