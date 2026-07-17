"use client";

import { useUser } from "@/hooks/useUser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Check, Bell, BellOff } from "lucide-react";

export function NotificationsList() {
  const { notifications, isLoadingNotifications, markRead, refetchNotifications } = useUser();

  const safeNotifications = notifications ?? [];

  const handleMarkRead = (id: string) => {
    markRead(id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="inline-flex items-center gap-1.5">
          <Bell className="h-4 w-4 text-primary" /> Notification Stream
        </CardTitle>
        {safeNotifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={refetchNotifications} className="text-xs">
            Refresh Stream
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingNotifications ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse font-semibold">
            Fetching notification logs...
          </div>
        ) : safeNotifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
            <BellOff className="h-8 w-8 opacity-30 text-primary" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Inbox is Clear</h4>
              <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                When new banknotes are processed or credentials undergo modification, alert receipts will stream here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {safeNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`py-4 flex gap-4 items-start transition-colors ${
                  !notif.read ? "bg-primary/5 -mx-6 px-6" : ""
                }`}
              >
                <div className="flex-grow space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                      {notif.title}
                    </span>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{notif.description}</p>
                  <span className="text-[10px] text-muted-foreground block">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
                {!notif.read && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-border/60 hover:bg-primary/10 hover:border-primary/20 hover:text-primary"
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default NotificationsList;
