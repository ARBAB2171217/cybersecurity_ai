import { api } from "@/lib/axios";
import type { ApiResponse } from "./api";
import type { LoginInput, RegisterInput, ResetPasswordInput } from "@/schemas/auth.schema";
import type { User, Admin } from "@/types";

// ─── Auth-Specific Payload Types ──────────────────────────────────────────

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface OTPRequestPayload {
  email: string;
  purpose: "REGISTRATION" | "PASSWORD_RESET" | "LOGIN";
}

export interface OTPVerifyPayload {
  email: string;
  code: string;
  purpose: "REGISTRATION" | "PASSWORD_RESET" | "LOGIN";
}

// ─── Auth Service ─────────────────────────────────────────────────────────

export const authService = {
  /**
   * Registers a new citizen. Returns JWT token pair on success.
   */
  async register(data: RegisterInput): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>("/auth/register", data);
    return res.data;
  },

  /**
   * Authenticates a citizen user.
   */
  async loginUser(data: LoginInput): Promise<ApiResponse<TokenPair>> {
    const res = await api.post<ApiResponse<TokenPair>>("/auth/login/user", data);
    return res.data;
  },

  /**
   * Authenticates an administrator.
   */
  async loginAdmin(data: LoginInput): Promise<ApiResponse<TokenPair>> {
    const res = await api.post<ApiResponse<TokenPair>>("/auth/login/admin", data);
    return res.data;
  },

  /**
   * Exchanges a refresh token for a new token pair.
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenPair>> {
    const res = await api.post<ApiResponse<TokenPair>>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  /**
   * Initiates Google OAuth login with a server-issued ID token.
   */
  async loginGoogle(credential: string): Promise<ApiResponse<TokenPair>> {
    const res = await api.post<ApiResponse<TokenPair>>("/auth/google", {
      credential,
    });
    return res.data;
  },

  /**
   * Sends an OTP to the given email address.
   */
  async sendOTP(data: OTPRequestPayload): Promise<ApiResponse<null>> {
    const payload = {
      ...data,
      purpose: data.purpose === "REGISTRATION" ? "REGISTER" : data.purpose,
    } as any;
    const res = await api.post<ApiResponse<null>>("/auth/otp/send", payload);
    return res.data;
  },

  /**
   * Verifies an OTP code against the backend Redis cache.
   */
  async verifyOTP(data: OTPVerifyPayload): Promise<ApiResponse<boolean>> {
    const payload = {
      ...data,
      purpose: data.purpose === "REGISTRATION" ? "REGISTER" : data.purpose,
    } as any;
    const res = await api.post<ApiResponse<boolean>>("/auth/otp/verify", payload);
    return res.data;
  },

  /**
   * Triggers a password-reset email.
   */
  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>("/auth/forgot-password", { email });
    return res.data;
  },

  /**
   * Completes a password reset using the email token.
   */
  async resetPassword(
    email: string,
    code: string,
    data: ResetPasswordInput
  ): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>("/auth/reset-password", {
      email,
      code,
      new_password: data.password,
    });
    return res.data;
  },

  /**
   * Fetches the currently authenticated user's profile.
   * Works for both citizens and admins; the backend returns the appropriate shape.
   */
  async getProfile(): Promise<ApiResponse<User | Admin>> {
    const res = await api.get<ApiResponse<User | Admin>>("/auth/me");
    if (res.data && res.data.success && res.data.data) {
      const raw = res.data.data as any;
      res.data.data = {
        id: raw.id,
        email: raw.email,
        fullName: raw.full_name || raw.fullName,
        isActive: raw.is_active !== undefined ? raw.is_active : raw.isActive,
        isVerified: raw.is_verified !== undefined ? raw.is_verified : raw.isVerified,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
        ...(raw.role ? { role: raw.role } : {}),
      } as any;
    }
    return res.data;
  },

  /**
   * Invalidates the current session server-side.
   */
  async logout(): Promise<ApiResponse<null>> {
    const res = await api.post<ApiResponse<null>>("/auth/logout");
    return res.data;
  },
};

export default authService;
