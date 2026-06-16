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

// Compatibilidad - nombres en español usados por archivos antiguos/CI
export type VerificacionEstadoResponse = {
  usuario_id: number;
  codigo_disponible: boolean;
  expires_at: string | null;
  envio_estado: "ENVIADO" | "ERROR" | null;
  detalle_error: string | null;
  sent_at: string | null;
};

export async function registrarUsuario(payload: { nombre: string; apellido?: string; email: string; password: string; password_confirmacion?: string; codigo_registro: string }) {
  const { data } = await api.post('/usuarios/registro', payload);
  return data;
}

export async function verificarUsuario(id: number, codigo: string) {
  const dto = { codigo };
  const { data } = await api.post(`/usuarios/${id}/verificar`, dto);
  return data;
}

export async function reenviarCodigoVerificacion(id: number) {
  const { data } = await api.post(`/usuarios/${id}/verificacion/reenviar`);
  return data;
}

export async function getEstadoVerificacion(id: number) {
  const { data } = await api.get<VerificacionEstadoResponse>(`/usuarios/${id}/verificacion/estado`);
  return data;
}

export async function asignarRolUsuario(id: number, rol: Rol) {
  return updateUsuarioRol(id, rol);
}
