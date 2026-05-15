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

export type ApiErrorBody = {
  error?: string;
  message?: string;
  statusCode?: number;
};
