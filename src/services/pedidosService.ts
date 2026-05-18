import { api } from "../api/client";
import type { Pedido } from "../types";

type DetallePedido = {
  producto_id: number;
  cantidad: number;
  notas?: string | null;
};

type CrearPedidoBody = {
  mesa_id: number;
  detalles: DetallePedido[];
};

export async function crearPedido(body: CrearPedidoBody) {
  const { data } = await api.post<Pedido>("/pedidos", body);
  return data;
}

export async function getPedido(id: number) {
  const { data } = await api.get<Pedido>(`/pedidos/${id}`);
  return data;
}

export async function updateEstadoPedido(id: number, estado: string) {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado });
  return data;
}

type ActualizarDetallesPedidoBody = {
  detalles: DetallePedido[];
};

export async function actualizarDetallesPedido(id: number, body: ActualizarDetallesPedidoBody) {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/detalles`, body);
  return data;
}

export async function enviarPedido(id: number) {
  const { data } = await api.post<Pedido>(`/pedidos/${id}/enviar`);
  return data;
}

export async function confirmarEntrega(id: number) {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/confirmar-entrega`);
  return data;
}
