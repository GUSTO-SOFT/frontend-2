export type Rol = "ADMIN" | "MESERO" | "CHEF";

export type MesaEstado = "DISPONIBLE" | "OCUPADA";

export type MesaEstadoColor = "verde" | "rojo";

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
};

export type Mesa = {
  id: number;
  numero: number;
  estado: MesaEstado;
  estado_color: MesaEstadoColor;
  mesero_id: number | null;
  mesero_nombre: string | null;
  opened_at: string | null;
  abierta_hace_minutos: number | null;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type MesaSocketPayload = {
  mesa_id: number;
  estado: MesaEstado;
  estado_color: MesaEstadoColor;
  mesero_id: number | null;
  opened_at: string | null;
};

export type CategoriaProducto = "ENTRADA" | "PLATO_FUERTE" | "BEBIDA" | "POSTRE";

export type Ingrediente = {
  id: number;
  nombre: string;
  unidadMedida: string;
};

export type Producto = {
  id: number;
  nombre: string;
  categoria: CategoriaProducto;
  precio: number | string;
  tiempo_preparacion?: number;
  tiempoPreparacion?: number;
  activo: boolean;
  ingredientes?: Ingrediente[];
  created_at: string;
  updated_at: string;
};

export type CreateProductoData = {
  nombre: string;
  categoria: CategoriaProducto;
  precio: number;
  tiempo_preparacion: number;
  ingredientes: number[];
};

export type ApiErrorBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

export type PedidoEstado =
  | "BORRADOR"
  | "PENDIENTE"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export type PedidoDetalle = {
  id: number;
  producto_id: number;
  producto_nombre?: string;
  categoria?: CategoriaProducto;
  cantidad: number;
  precio?: number | null;
  precio_unitario?: string;
  notas?: string | null;
};

export type Pedido = {
  id: number;
  mesa_id: number;
  mesa_numero?: number;
  mesero_id: number;
  mesero_nombre?: string;
  estado: PedidoEstado;
  detalles: PedidoDetalle[];
  sent_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
};
