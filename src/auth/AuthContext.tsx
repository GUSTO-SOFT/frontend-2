import { createContext, useContext, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { Rol, Usuario } from "../types";

type JwtPayload = {
  sub: number;
  email: string;
  rol: Rol;
  exp?: number;
};

type AuthContextValue = {
  token: string | null;
  usuario: Usuario | null;
  rol: Rol | null;
  isAuthenticated: boolean;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  const raw = localStorage.getItem("usuario");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    localStorage.removeItem("usuario");
    return null;
  }
}

function readRolFromToken(token: string | null) {
  if (!token) return null;

  try {
    return jwtDecode<JwtPayload>(token).rol;
  } catch {
    localStorage.removeItem("access_token");
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [usuario, setUsuario] = useState<Usuario | null>(() => readStoredUser());

  const rol = readRolFromToken(token) ?? usuario?.rol ?? null;

  const value = useMemo<AuthContextValue>(() => ({
    token,
    usuario,
    rol,
    isAuthenticated: Boolean(token && usuario),
    login(nextUsuario, nextToken) {
      localStorage.setItem("access_token", nextToken);
      localStorage.setItem("usuario", JSON.stringify(nextUsuario));
      setToken(nextToken);
      setUsuario(nextUsuario);
    },
    logout() {
      localStorage.removeItem("access_token");
      localStorage.removeItem("usuario");
      setToken(null);
      setUsuario(null);
    },
  }), [rol, token, usuario]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
