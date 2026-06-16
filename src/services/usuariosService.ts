import { api } from "../api/client";
import type { Usuario, Rol, UsuarioEstado } from "../types";

export type GetUsuariosParams = {
  rol?: Rol;
  estado?: UsuarioEstado;
};

export async function getUsuarios(params: GetUsuariosParams = {}) {
  const { data } = await api.get<Usuario[]>("/usuarios", { params });
  return data;
}

export type RegistrationCodeResponse = {
  codigo: string;
  expires_at: string;
  expires_in_minutes: number;
};

export async function createUsuario(userData: { nombre: string; email: string; password?: string; rol: Rol }) {
  const { data } = await api.post<Usuario>("/usuarios", userData);
  return data;
}

export async function createRegistrationCode(expires_in_minutes?: number) {
  const { data } = await api.post<RegistrationCodeResponse>("/usuarios/registro/codigos", {
    expires_in_minutes,
  });
  return data;
}

export async function updateUsuario(id: number, userData: Partial<Usuario>) {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}`, userData);
  return data;
}
export async function updateUsuarioRol(id: number, rol: Rol) {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}/rol`, { rol });
  return data;
}
export async function updateUsuarioEstado(id: number, estado: UsuarioEstado) {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}/estado`, { estado });
  return data;
}

export async function getMeserosActivos() {
  const { data } = await api.get<Usuario[]>("/usuarios/meseros/disponibles");
  return data;
}
