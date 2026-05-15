import { api } from "../api/client";
import type { Mesa, MesaEstado, PaginatedResponse } from "../types";

type GetMesasParams = {
  estado?: MesaEstado;
  page?: number;
  limit?: number;
};

export async function getMesas(params: GetMesasParams = {}) {
  const { data } = await api.get<PaginatedResponse<Mesa>>("/mesas", { params });
  return data;
}

export async function abrirMesa(id: number) {
  const { data } = await api.post<Mesa>(`/mesas/${id}/abrir`);
  return data;
}

export async function asignarMesero(id: number, mesero_id: number) {
  const { data } = await api.patch<Mesa>(`/mesas/${id}/asignar`, { mesero_id });
  return data;
}
