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
