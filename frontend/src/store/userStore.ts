import { create } from "zustand";
import { api } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "owner" | "guest";
  teamId: string | null;
  isActive: boolean;
  avatar?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("fc26_token") : null,
  loading: false,
  error: null,
  
  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem("fc26_token", token);
      // Save token in cookie for middleware
      if (typeof window !== "undefined") {
        document.cookie = `fc26_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      set({ token, user, loading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid email or password";
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("fc26_token");
    if (typeof window !== "undefined") {
      document.cookie = "fc26_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    set({ token: null, user: null, error: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem("fc26_token");
    if (!token) {
      set({ user: null, token: null });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      // Refresh token first to get latest role + teamId from DB
      // (handles cases where admin assigned a team after the user logged in)
      const refreshRes = await api.post("/api/auth/refresh-token");
      const { token: newToken, user } = refreshRes.data;

      localStorage.setItem("fc26_token", newToken);
      if (typeof window !== "undefined") {
        document.cookie = `fc26_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      set({ user, token: newToken, loading: false });
    } catch (err: any) {
      localStorage.removeItem("fc26_token");
      if (typeof window !== "undefined") {
        document.cookie = "fc26_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      set({ user: null, token: null, error: "Session expired", loading: false });
    }
  },
}));
