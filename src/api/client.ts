import axios from "axios";

const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://gusto-soft-backend.onrender.com";

export const API_URL = (import.meta.env.VITE_API_URL ?? defaultApiUrl).replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((request) => {
  const accessToken = window.sessionStorage.getItem("access_token");
  if (accessToken && request.headers) {
    request.headers.Authorization = `Bearer ${accessToken}`;
  }
  return request;
});

export function buildApiAssetUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const base = API_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.sessionStorage.removeItem("access_token");
      window.sessionStorage.removeItem("usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

