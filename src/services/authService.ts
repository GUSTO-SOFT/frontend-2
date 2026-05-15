import { api } from "../api/client";
import type { Usuario } from "../types";

type LoginResponse = {
  access_token: string;
  token_type: "Bearer";
  usuario: Usuario;
};

export async function loginRequest(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data } = await api.post<LoginResponse>("/auth/login", {
    email: normalizedEmail,
    password,
  });

  return data;
}
