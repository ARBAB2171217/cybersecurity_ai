import { User } from "./index";

export interface UserProfileUpdateInput {
  fullName: string;
}

export interface UserSecuritySettingsUpdateInput {
  currentPassword?: string;
  newPassword?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}
