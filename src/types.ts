export type Rol = "ADMIN" | "MESERO" | "CHEF" | "CAJERO";

export type UsuarioEstado = "ACTIVO" | "INACTIVO";

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  estado: UsuarioEstado;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export type MesaEstado = "DISPONIBLE" | "OCUPADA";

export type MesaEstadoColor = "verde" | "rojo";

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
  unidadMedida?: string;
  unidad_medida?: string;
  stock_actual?: number;
  stock_minimo?: number;
  activo?: boolean;
  imagen_url?: string;
};

export type CreateIngredienteData = {
  nombre: string;
  unidad_medida: "KG" | "G" | "L" | "ML" | "UNIDAD";
  stock_actual: number;
  stock_minimo: number;
};

export type MovimientoStockTipo = "ENTRADA" | "SALIDA" | "AJUSTE";

export type MovimientoStock = {
  id: number;
  ingrediente_id: number;
  ingrediente_nombre?: string;
  tipo: MovimientoStockTipo;
  cantidad: number;
  motivo: string;
  usuario_id: number;
  usuario_nombre?: string;
  fecha_utc: string;
  created_at: string;
};

export type AjusteStockResponse = {
  ingrediente_id: number;
  stock_actual: number;
  movimiento: MovimientoStock;
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
  tiempo_preparacion?: number;
  ingredientes: { ingrediente_id: number; cantidad: number }[];
};

export type AlertaInventario = {
  id: number;
  ingrediente_id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  generada_at: string;
};

export type BloqueoProducto = {
  bloqueado: boolean;
  motivo: string | null;
  ingredientes_agotados: { id: number; nombre: string }[];
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
  hace_minutos?: number;
  resaltar_por_antiguedad?: boolean;
};
