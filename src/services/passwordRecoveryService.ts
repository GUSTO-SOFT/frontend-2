import { api } from "../api/client";

type ForgotPasswordResponse = {
  message: string;
  expires_in_minutes?: number;
  reset_token?: string;
};

type ResetPasswordResponse = {
  message: string;
};

export async function forgotPasswordRequest(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data } = await api.post<ForgotPasswordResponse>("/auth/recuperar-password", {
    email: normalizedEmail,
  });

  return data;
}

export async function resetPasswordRequest(token: string, nuevaPassword: string) {
  const { data } = await api.post<ResetPasswordResponse>("/auth/restablecer-password", {
    token,
    nueva_password: nuevaPassword,
  });

  return data;
}
