import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL, STORAGE_KEYS } from "./constants";

// ─── Axios Instance ───────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
  withCredentials: true,
});

// ─── Token Refresh State ──────────────────────────────────────────────────

let isRefreshing = false;

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

// ─── Request Interceptor ──────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (Token Refresh + Global Error) ─────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401s; skip if already retried or no config
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request until the new token arrives
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
          : null;

      if (!refreshToken) throw new Error("No refresh token available.");

      // Call refresh endpoint using plain axios to avoid interceptor loop
      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefresh } = data.data;

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      if (newRefresh) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);

      if (typeof window !== "undefined") {
        document.cookie = `cybershield_access_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
        try {
          const { useAuthStore } = require("@/store/auth.store");
          useAuthStore.setState({
            accessToken: access_token,
            refreshToken: newRefresh || refreshToken,
          });
        } catch (e) {
          console.error("Failed to sync Zustand store state during refresh:", e);
        }
      }

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      processQueue(null, access_token);
      originalRequest.headers!.Authorization = `Bearer ${access_token}`;
      return axios(originalRequest);
    } catch (refreshError) {

      processQueue(refreshError, null);

      // Clear session and send to home
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        document.cookie = "cybershield_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        delete api.defaults.headers.common.Authorization;

        try {
          const { useAuthStore } = require("@/store/auth.store");
          useAuthStore.getState().logout();
        } catch (e) {
          console.error("Failed to logout from Zustand store during error:", e);
        }

        window.dispatchEvent(new CustomEvent("auth:expired"));
        window.location.href = "/";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
