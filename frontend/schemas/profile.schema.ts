import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),
  avatar: z.string().max(512).optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const securitySchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type SecurityInput = z.infer<typeof securitySchema>;
