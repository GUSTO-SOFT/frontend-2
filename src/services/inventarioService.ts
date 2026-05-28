import { api } from "../api/client";
import type { CreateIngredienteData, Ingrediente, PaginatedResponse, MovimientoStock } from "../types";

export async function getIngredientes(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<PaginatedResponse<Ingrediente>>("/inventario/ingredientes", {
    params,
  });
  return data;
}

export async function createIngrediente(ingrediente: CreateIngredienteData) {
  const { data } = await api.post<Ingrediente>("/inventario/ingredientes", ingrediente);
  return data;
}

export async function ajustarStock(ingredienteId: number, delta: number, motivo: string) {
  const { data } = await api.post<MovimientoStock>(
    `/inventario/ingredientes/${ingredienteId}/ajuste`,
    { delta, motivo }
  );
  return data;
}

export async function getMovimientos(
  ingredienteId: number,
  params: { page?: number; limit?: number } = {}
) {
  const { data } = await api.get<PaginatedResponse<MovimientoStock>>(
    `/inventario/ingredientes/${ingredienteId}/movimientos`,
    { params }
  );
  return data;
}

export async function getMovimientosGlobales(params: { page?: number; limit?: number } = {}) {
  try {
    const { data } = await api.get<PaginatedResponse<MovimientoStock>>(
      "/inventario/movimientos",
      { params }
    );
    return data;
  } catch (error) {
    // Fallback: si el endpoint global no existe, retornar respuesta vacía
    console.warn("Endpoint /inventario/movimientos no disponible, retornando datos vacíos");
    return {
      data: [],
      meta: {
        total: 0,
        page: params.page || 1,
        limit: params.limit || 15,
        total_pages: 1,
      },
    };
  }
}
