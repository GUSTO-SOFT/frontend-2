import { api } from "../api/client";
import type { Usuario, Rol, PaginatedResponse } from "../types";

export type UsuarioEstado = "ACTIVO" | "INACTIVO";

type GetUsuariosParams = {
  rol?: Rol;
  estado?: UsuarioEstado;
  page?: number;
  limit?: number;
};

export async function getUsuarios(params: GetUsuariosParams = {}) {
  const { data } = await api.get<Usuario[]>("/usuarios", { params });
  return data;
}

export async function getMeserosActivos() {
  return getUsuarios({ rol: "MESERO", estado: "ACTIVO" });
}
