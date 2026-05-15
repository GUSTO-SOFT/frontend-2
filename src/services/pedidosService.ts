import { api } from "../api/client";
import type { Pedido } from "../types";

type DetallePedido = {
  producto_id: number;
  cantidad: number;
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
