export type Rol = "ADMIN" | "MESERO" | "CHEF" | "CAJERO";

export type MesaEstado = "DISPONIBLE" | "OCUPADA";

export type MesaEstadoColor = "verde" | "rojo";

export type UsuarioEstado = "ACTIVO" | "INACTIVO";

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  estado?: UsuarioEstado;
  created_at?: string;
  updated_at?: string;
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
  unidadMedida?: string;
  unidad_medida?: string;
  stock_actual?: number;
  stock_minimo?: number;
  activo?: boolean;
  imagen_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateIngredienteData = {
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
};

export type MovimientoStockTipo = "ENTRADA" | "SALIDA" | "AJUSTE";

export type MovimientoStock = {
  id: number;
  ingrediente_id?: number | null;
  tipo: MovimientoStockTipo;
  cantidad: number;
  motivo: string;
  fecha_utc: string;
  usuario_id?: number | null;
  ingrediente_nombre?: string;
  usuario_nombre?: string;
};

export type AjusteStockResponse = {
  ingrediente_id: number;
  stock_actual: number;
  delta?: number;
  motivo?: string;
  fecha_utc?: string;
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
  producto_id: number;
  bloqueado: boolean;
  motivo: string;
  ingredientes_agotados: { id: number; nombre: string }[];
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

export type FacturaEstado = "ACEPTADA" | "RECHAZADA" | "PENDIENTE_REINTENTO";

export type FacturaEnvioEstado = "ENVIADO" | "ERROR";

export type FacturaEstadoResponse = {
  id: number;
  cuenta_id: number;
  cufe: string | null;
  estado: FacturaEstado;
  timestamp_utc: string;
  error_body: unknown | null;
  intentos: number;
  next_retry_at: string | null;
};

export type FacturaEnvioResponse = {
  id: number;
  factura_id: number;
  email_destino: string;
  estado: FacturaEnvioEstado;
  detalle_error: string | null;
  sent_at: string | null;
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

export type DescuentoTipo = "PORCENTAJE" | "VALOR_FIJO";

export type CuentaEstado = "ABIERTA" | "CERRADA";

export type CuentaItem = {
  producto_id: number;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type Cuenta = {
  id: number;
  mesa_id: number;
  estado: CuentaEstado;
  items: CuentaItem[];
  impuestos: number;
  total_bruto: number;
  descuento: number;
  descuento_tipo?: DescuentoTipo;
  descuento_motivo?: string;
  total_neto: number;
  closed_at?: string;
  cajero_id?: number;
};
