import { api } from "../api/client";
import type { Cuenta, DescuentoTipo, FacturaEnvioResponse, FacturaEstadoResponse } from "../types";

type AplicarDescuentoBody = {
  tipo: DescuentoTipo;
  valor: number;
  motivo: string;
};

export async function getCuentaMesa(mesaId: number) {
  const { data } = await api.get<Cuenta>(`/mesas/${mesaId}/cuenta`);
  return data;
}

export async function aplicarDescuento(cuentaId: number, body: AplicarDescuentoBody) {
  const { data } = await api.post<Cuenta>(`/cuentas/${cuentaId}/descuento`, body);
  return data;
}

type CerrarCuentaBody = {
  metodo_pago?: string;
  monto_recibido?: number;
};

export async function cerrarCuenta(cuentaId: number, body?: CerrarCuentaBody) {
  const { data } = await api.post<Cuenta>(`/cuentas/${cuentaId}/cerrar`, body);
  return data;
}

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
