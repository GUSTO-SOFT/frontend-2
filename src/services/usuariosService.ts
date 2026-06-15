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

export async function createUsuario(userData: { nombre: string; email: string; password?: string; rol: Rol }) {
  const { data } = await api.post<Usuario>("/usuarios", userData);
  return data;
}

export type RegistroUsuarioData = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  password_confirmacion: string;
};

export type RegistroUsuarioResponse = {
  usuario_id: number;
  email: string;
  estado: UsuarioEstado;
};

export type VerificacionEstadoResponse = {
  usuario_id: number;
  codigo_disponible: boolean;
  expires_at: string | null;
  envio_estado: "ENVIADO" | "ERROR" | null;
  detalle_error: string | null;
  sent_at: string | null;
};

export type VerificarUsuarioResponse = {
  usuario_id: number;
  rol: Rol | null;
  estado: UsuarioEstado;
};

export async function registrarUsuario(userData: RegistroUsuarioData) {
  const { data } = await api.post<RegistroUsuarioResponse>("/usuarios/registro", {
    ...userData,
    email: userData.email.trim().toLowerCase(),
  });
  return data;
}

export async function verificarUsuario(usuarioId: number, codigo: string) {
  const { data } = await api.post<VerificarUsuarioResponse>(`/usuarios/${usuarioId}/verificar`, { codigo });
  return data;
}

export async function reenviarCodigoVerificacion(usuarioId: number) {
  const { data } = await api.post<{ usuario_id: number; expires_at: string }>(
    `/usuarios/${usuarioId}/verificacion/reenviar`,
  );
  return data;
}

export async function getEstadoVerificacion(usuarioId: number) {
  const { data } = await api.get<VerificacionEstadoResponse>(`/usuarios/${usuarioId}/verificacion/estado`);
  return data;
}

export async function asignarRolUsuario(id: number, rol: Rol) {
  const { data } = await api.patch<{
    usuario_id: number;
    rol: Rol;
    estado: UsuarioEstado;
    verificacion_enviada: boolean;
  }>(`/usuarios/${id}/rol`, { rol });
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
  const { data } = await api.get<Usuario[]>("/usuarios/meseros/disponibles");
  return data;
}
