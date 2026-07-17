import { create } from "zustand";
import userService from "@/services/user.service";
import type { User } from "@/types";
import type {
  UserProfileUpdateInput,
  UserSecuritySettingsUpdateInput,
  NotificationItem,
} from "@/types/user";
import { getErrorMessage } from "@/utils/errors";

interface UserState {
  profile: User | null;
  notifications: NotificationItem[];
  unreadCount: number;
  isLoadingProfile: boolean;
  isLoadingNotifications: boolean;
  error: string | null;
}

interface UserActions {
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UserProfileUpdateInput) => Promise<void>;
  updatePassword: (data: UserSecuritySettingsUpdateInput) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setProfile: (profile: User) => void;
  clearError: () => void;
}

export const useUserStore = create<UserState & UserActions>()((set, get) => ({
  // ── State
  profile: null,
  notifications: [],
  unreadCount: 0,
  isLoadingProfile: false,
  isLoadingNotifications: false,
  error: null,

  // ── Actions
  fetchProfile: async () => {
    set({ isLoadingProfile: true, error: null });
    try {
      const res = await userService.getProfile();
      if (res.success) set({ profile: res.data });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoadingProfile: true, error: null });
    try {
      const res = await userService.updateProfile(data);
      if (res.success) set({ profile: res.data });
    } catch (err) {
      set({ error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  updatePassword: async (data) => {
    set({ isLoadingProfile: true, error: null });
    try {
      await userService.updatePassword(data);
    } catch (err) {
      set({ error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  fetchNotifications: async () => {
    set({ isLoadingNotifications: true, error: null });
    try {
      const res = await userService.getNotifications();
      if (res.success) {
        const notifications = res.data ?? [];
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        });
      }
    } catch (err) {
      set({ error: getErrorMessage(err) });
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  markRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: (state.notifications ?? []).map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await userService.markNotificationRead(id);
    } catch (err) {
      // Revert optimistic update on failure
      await get().fetchNotifications();
      throw err;
    }
  },

  markAllRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: (state.notifications ?? []).map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    try {
      await userService.markAllNotificationsRead();
    } catch (err) {
      await get().fetchNotifications();
      throw err;
    }
  },

  setProfile: (profile) => set({ profile }),
  clearError: () => set({ error: null }),
}));
