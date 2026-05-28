import { api } from "../api/client";
import type { Usuario, Rol, PaginatedResponse, UsuarioEstado } from "../types";

export type GetUsuariosParams = {
  rol?: Rol;
  estado?: UsuarioEstado;
};

export async function getUsuarios(params: GetUsuariosParams = {}) {
  const { data } = await api.get<Usuario[]>("/usuarios", { params });
  return data;
}

export async function createUsuario(userData: { nombre: string; email: string; password?: string; rol: Rol }) {
  const { data } = await api.post<Usuario>("/usuarios", userData);
  return data;
}

export async function updateUsuario(id: number, userData: Partial<Usuario>) {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}`, userData);
  return data;
}

export async function updateUsuarioEstado(id: number, estado: UsuarioEstado) {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}/estado`, { estado });
  return data;
}

export async function getMeserosActivos() {
  return getUsuarios({ rol: "MESERO", estado: "ACTIVO" });
}
