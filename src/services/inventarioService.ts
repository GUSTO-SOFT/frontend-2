import { api } from "../api/client";
import type { CreateIngredienteData, Ingrediente, PaginatedResponse } from "../types";

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
