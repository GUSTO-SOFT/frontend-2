import { api } from "../api/client";
import type { Cuenta, DescuentoTipo } from "../types";

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
