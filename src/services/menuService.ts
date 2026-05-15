import { api } from "../api/client";
import type { Producto } from "../types";

export async function getProductosActivos() {
  const { data } = await api.get<Producto[]>("/menu/productos", {
    params: { activo: true },
  });
import type { Producto, CreateProductoData, Ingrediente } from "../types";

export async function getProductos(params: { activo?: boolean; categoria?: string } = {}) {
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
