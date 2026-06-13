import { api } from "../api/client";
import type { Producto, CreateProductoData, Ingrediente, BloqueoProducto, PaginatedResponse } from "../types";

type ProductJsonPayload = Omit<CreateProductoData, "ingredientes" | "imagen"> & {
  ingredientes: Array<{ ingrediente_id: number; cantidad: number }>;
};

function toProductJsonPayload(producto: CreateProductoData): ProductJsonPayload {
  return {
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: producto.precio,
    tiempo_preparacion: producto.tiempo_preparacion,
    ingredientes: producto.ingredientes.map((ingrediente) => ({
      ingrediente_id: ingrediente.ingrediente_id,
      cantidad: ingrediente.cantidad,
    })),
  };
}

function appendProductFormData(producto: CreateProductoData) {
  const formData = new FormData();
  const payload = toProductJsonPayload(producto);

  formData.append("nombre", payload.nombre);
  formData.append("categoria", payload.categoria);
  formData.append("precio", String(payload.precio));
  formData.append("tiempo_preparacion", String(payload.tiempo_preparacion));
  formData.append("ingredientes", JSON.stringify(payload.ingredientes));

  if (producto.imagen) {
    formData.append("imagen", producto.imagen);
  }

  return formData;
}

function toPartialProductJsonPayload(producto: Partial<CreateProductoData>) {
  const payload: Record<string, unknown> = {};

  if (producto.nombre !== undefined) payload.nombre = producto.nombre;
  if (producto.categoria !== undefined) payload.categoria = producto.categoria;
  if (producto.precio !== undefined) payload.precio = producto.precio;
  if (producto.tiempo_preparacion !== undefined) payload.tiempo_preparacion = producto.tiempo_preparacion;
  if (producto.ingredientes !== undefined) {
    payload.ingredientes = producto.ingredientes.map((ingrediente) => ({
      ingrediente_id: ingrediente.ingrediente_id,
      cantidad: ingrediente.cantidad,
    }));
  }

  return payload;
}

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
  if (producto.imagen) {
    const { data } = await api.post<Producto>("/menu/productos/con-imagen", appendProductFormData(producto));
    return data;
  }

  const { data } = await api.post<Producto>("/menu/productos", toProductJsonPayload(producto));
  return data;
}

export async function getIngredientes() {
  const { data } = await api.get<PaginatedResponse<Ingrediente>>("/inventario/ingredientes", {
    params: { page: 1, limit: 100 },
  });
  return data.data;
}

export async function updateProducto(id: number, producto: Partial<CreateProductoData>) {
  const { data } = await api.put<Producto>(`/menu/productos/${id}`, toPartialProductJsonPayload(producto));

  if (producto.imagen) {
    return updateProductoImagen(id, producto.imagen);
  }

  return data;
}

export async function updateProductoImagen(id: number, imagen: File) {
  const formData = new FormData();
  formData.append("imagen", imagen);

  const { data } = await api.patch<Producto>(`/menu/productos/${id}/imagen`, formData);
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
