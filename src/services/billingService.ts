import { api } from "../api/client";
import type { FacturaEnvioResponse, FacturaEstadoResponse } from "../types";

export async function getFacturaEstado(facturaId: number) {
  const { data } = await api.get<FacturaEstadoResponse>(`/facturas/${facturaId}/estado`);
  return data;
}

export async function getFacturaEnvios(facturaId: number) {
  const { data } = await api.get<FacturaEnvioResponse[]>(`/facturas/${facturaId}/envio`);
  return data;
}

export async function enviarFacturaPorCorreo(facturaId: number, email: string) {
  const normalizedEmail = email.trim();
  const { data } = await api.patch<FacturaEnvioResponse>(`/facturas/${facturaId}/enviar-correo`, {
    email: normalizedEmail,
  });
  return data;
}

