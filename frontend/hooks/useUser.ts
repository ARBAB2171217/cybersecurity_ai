import { useState, useEffect, useCallback } from "react";
import { userService } from "@/services/user.service";
import { NotificationItem, UserProfileUpdateInput, UserSecuritySettingsUpdateInput } from "@/types/user";

export function useUser() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    setErrorNotifications(null);
    try {
      const response = await userService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        setErrorNotifications(response.message || "Failed to load notifications.");
      }
    } catch (err: any) {
      setErrorNotifications(err.message || "Failed to load notifications.");
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await userService.markNotificationRead(id);
      setNotifications((prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      console.error("Failed to mark notification read", err);
    }
  };

  const updateProfile = async (data: UserProfileUpdateInput) => {
    const response = await userService.updateProfile(data);
    return response;
  };

  const updateSecurity = async (data: UserSecuritySettingsUpdateInput) => {
    const response = await userService.updatePassword(data);
    return response;
  };

  const safeNotifications = notifications ?? [];

  return {
    notifications: safeNotifications,
    unreadCount: safeNotifications.filter((n) => !n?.read).length,
    isLoadingNotifications,
    errorNotifications,
    refetchNotifications: fetchNotifications,
    markRead,
    updateProfile,
    updateSecurity,
  };
}
export default useUser;
