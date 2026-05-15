import { api } from "../api/client";
import type { Producto, CreateProductoData, Ingrediente } from "../types";

export async function getProductosActivos() {
  const { data } = await api.get<Producto[]>("/menu/productos", {
    params: { activo: true },
  });

  return data;
}

export async function getProductos(
  params: { activo?: boolean; categoria?: string } = {}
) {
  const { data } = await api.get<Producto[]>("/menu/productos", { params });
  return data;
}

export async function createProducto(producto: CreateProductoData) {
  const { data } = await api.post<Producto>("/menu/productos", producto);
  return data;
}

export async function getIngredientes() {
  const { data } = await api.get<Ingrediente[]>("/inventario/ingredientes");
  return data;
}