import { User } from "./index";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenResponse;
}

export interface OTPRequestPayload {
  email: string;
  purpose: "REGISTRATION" | "PASSWORD_RESET" | "LOGIN";
}

export interface OTPVerifyPayload {
  email: string;
  otp: string;
  purpose: "REGISTRATION" | "PASSWORD_RESET" | "LOGIN";
}

export interface GoogleCallbackPayload {
  code: string;
  state: string;
}
