import { api } from "../api/client";
import type { Producto } from "../types";

export async function getProductosActivos() {
  const { data } = await api.get<Producto[]>("/menu/productos", {
    params: { activo: true },
  });
  return data;
}
