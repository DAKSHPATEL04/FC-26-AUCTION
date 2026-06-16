import axios from "axios";

// All /api/* calls go through Next.js rewrites → backend.
// Using an empty baseURL means requests go to the same origin (no CORS).
const API_URL = typeof window !== "undefined"
  ? ""  // browser: same-origin, rewrites handle the proxy
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"); // SSR: direct

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("fc26_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
