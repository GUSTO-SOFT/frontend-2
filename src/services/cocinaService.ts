import { api } from "../api/client";
import type { Pedido } from "../types";

export const cocinaService = {
  getPedidos: async () => {
    const { data } = await api.get<Pedido[]>("/cocina/pedidos");
    return data;
  },
  
  updateEstadoPedido: async (id: number, estado: string) => {
    const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado });
    return data;
  }
};
