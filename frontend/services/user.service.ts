import { api } from "@/lib/axios";
import type { ApiResponse } from "./api";
import type { User } from "@/types";
import type {
  UserProfileUpdateInput,
  UserSecuritySettingsUpdateInput,
  NotificationItem,
} from "@/types/user";

export const userService = {
  /**
   * Fetches the citizen's own profile.
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const res = await api.get<ApiResponse<User>>("/user/me");
    return res.data;
  },

  /**
   * Updates the citizen's display name / profile fields.
   */
  async updateProfile(data: UserProfileUpdateInput): Promise<ApiResponse<User>> {
    const res = await api.put<ApiResponse<User>>("/user/profile", data);
    return res.data;
  },

  /**
   * Changes the citizen's password after verifying the current one.
   */
  async updatePassword(
    data: UserSecuritySettingsUpdateInput
  ): Promise<ApiResponse<null>> {
    const res = await api.put<ApiResponse<null>>("/user/security", data);
    return res.data;
  },

  /**
   * Lists all notifications for the authenticated citizen.
   */
  async getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    const res = await api.get<ApiResponse<NotificationItem[]>>(
      "/user/notifications"
    );
    return res.data;
  },

  /**
   * Marks a single notification as read.
   */
  async markNotificationRead(id: string): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>(
      `/user/notifications/${id}/read`
    );
    return res.data;
  },

  /**
   * Marks all notifications as read in a single call.
   */
  async markAllNotificationsRead(): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>(
      "/user/notifications/read-all"
    );
    return res.data;
  },

  async getSessions(): Promise<ApiResponse<any[]>> {
    const res = await api.get<ApiResponse<any[]>>("/user/sessions");
    return res.data;
  },

  async revokeSession(token: string): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/user/sessions/${token}`);
    return res.data;
  },

  async resendVerification(): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>("/user/resend-verification");
    return res.data;
  },

  async deleteAccount(): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>("/user/me");
    return res.data;
  },

  async uploadAvatar(file: File): Promise<ApiResponse<User>> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse<User>>("/user/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default userService;
