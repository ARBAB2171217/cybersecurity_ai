import { create } from "zustand";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface UIState {
  // Global loading overlay
  isGlobalLoading: boolean;

  // Sidebar collapsed state
  isSidebarCollapsed: boolean;

  // Toast notifications queue
  toasts: ToastItem[];
}

interface UIActions {
  setGlobalLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Push a toast to the queue */
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  /** Remove a specific toast by ID */
  dismissToast: (id: string) => void;

  // Convenience toast shortcuts
  toastSuccess: (title: string, description?: string) => void;
  toastError: (title: string, description?: string) => void;
  toastWarning: (title: string, description?: string) => void;
  toastInfo: (title: string, description?: string) => void;
}

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  // ── State
  isGlobalLoading: false,
  isSidebarCollapsed: false,
  toasts: [],

  // ── Actions
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  pushToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.duration ?? 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => get().dismissToast(id), duration);
    }
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  toastSuccess: (title, description) =>
    get().pushToast({ title, description, variant: "success" }),

  toastError: (title, description) =>
    get().pushToast({ title, description, variant: "error", duration: 6000 }),

  toastWarning: (title, description) =>
    get().pushToast({ title, description, variant: "warning", duration: 5000 }),

  toastInfo: (title, description) =>
    get().pushToast({ title, description, variant: "info" }),
}));
