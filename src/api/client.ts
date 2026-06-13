import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
});

export function buildApiAssetUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const base = API_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

