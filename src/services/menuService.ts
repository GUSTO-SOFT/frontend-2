import { api } from "../api/client";
import type { Producto, CreateProductoData, Ingrediente, BloqueoProducto } from "../types";

export async function getProductosActivos() {
  const { data } = await api.get<Producto[]>("/menu/productos", {
    params: { activo: true },
  });

  return data;
}

export async function getProductos(
  params: { activo?: boolean } = {}
) {
  const { data } = await api.get<Producto[]>("/menu/productos", { params });
  return data;
}

export async function getProducto(id: number) {
  const { data } = await api.get<Producto>(`/menu/productos/${id}`);
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

export async function updateProducto(id: number, producto: Partial<CreateProductoData>) {
  const { data } = await api.put<Producto>(`/menu/productos/${id}`, producto);
  return data;
}

export async function toggleDisponibilidad(id: number, activo: boolean) {
  const { data } = await api.patch<Producto>(`/menu/productos/${id}/disponibilidad`, { activo });
  return data;
}

export async function getBloqueoProducto(id: number) {
  const { data } = await api.get<BloqueoProducto>(`/menu/productos/${id}/bloqueo`);
  return data;
}