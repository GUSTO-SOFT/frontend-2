import { api } from "../api/client";
import { getUsuarios } from "./usuariosService";
import type {
  CreateIngredienteData,
  Ingrediente,
  PaginatedResponse,
  MovimientoStock,
  AjusteStockResponse,
  AlertaInventario,
  Usuario,
} from "../types";

let usuariosByIdCache: { at: number; map: Map<number, string> } | null = null;
const USUARIOS_CACHE_TTL_MS = 5 * 60 * 1000;

async function getUsuariosById(): Promise<Map<number, string>> {
  const now = Date.now();
  if (usuariosByIdCache && now - usuariosByIdCache.at < USUARIOS_CACHE_TTL_MS) {
    return usuariosByIdCache.map;
  }

  try {
    const usuarios = (await getUsuarios()) as Usuario[];
    const map = new Map<number, string>();
    for (const u of usuarios) {
      map.set(u.id, u.nombre);
    }
    usuariosByIdCache = { at: now, map };
    return map;
  } catch {
    const map = new Map<number, string>();
    usuariosByIdCache = { at: now, map };
    return map;
  }
}

export async function getIngredientes(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<PaginatedResponse<Ingrediente>>("/inventario/ingredientes", {
    params,
  });
  return data;
}

export async function createIngrediente(ingrediente: CreateIngredienteData) {
  const { data } = await api.post<Ingrediente>("/inventario/ingredientes", ingrediente);
  return data;
}

export async function ajustarStock(ingredienteId: number, delta: number, motivo: string) {
  const { data } = await api.post<AjusteStockResponse>(
    `/inventario/ingredientes/${ingredienteId}/ajuste`,
    { delta, motivo }
  );
  return data;
}

export async function getMovimientos(
  ingredienteId: number,
  params: { page?: number; limit?: number } = {}
) {
  const { data } = await api.get<PaginatedResponse<MovimientoStock>>(
    `/inventario/ingredientes/${ingredienteId}/movimientos`,
    { params }
  );
  return data;
}

export async function getMovimientosGlobales(params: { page?: number; limit?: number } = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 15;
  const perIngredientLimit = Math.max(20, limit);

  try {
    const usuariosById = await getUsuariosById();
    const INGREDIENTES_PAGE_SIZE = 100;
    const allIngredientes: Ingrediente[] = [];
    const ingredienteNombreById = new Map<number, string>();
    let nextPage = 1;
    while (true) {
      const response = await getIngredientes({ page: nextPage, limit: INGREDIENTES_PAGE_SIZE });
      allIngredientes.push(...response.data);
      for (const ingrediente of response.data) {
        ingredienteNombreById.set(ingrediente.id, ingrediente.nombre);
      }
      if (nextPage >= response.meta.total_pages) break;
      nextPage += 1;
    }

    if (allIngredientes.length === 0) {
      return { data: [], meta: { total: 0, page, limit, total_pages: 1 } };
    }

    type SourceState = {
      ingredienteId: number;
      page: number;
      totalPages: number;
      total: number;
      items: MovimientoStock[];
      index: number;
    };

    const sources: SourceState[] = [];
    let total = 0;

    for (const ingrediente of allIngredientes) {
      try {
        const response = await getMovimientos(ingrediente.id, { page: 1, limit: perIngredientLimit });
        total += response.meta.total;
        if (response.data.length === 0) continue;
        sources.push({
          ingredienteId: ingrediente.id,
          page: 1,
          totalPages: response.meta.total_pages,
          total: response.meta.total,
          items: response.data.map((mov) => ({
            ...mov,
            ingrediente_nombre: ingredienteNombreById.get(mov.ingrediente_id ?? ingrediente.id) ?? ingrediente.nombre,
            usuario_nombre: mov.usuario_id ? usuariosById.get(mov.usuario_id) : undefined,
          })),
          index: 0,
        });
      } catch {
        continue;
      }
    }

    const needed = Math.max(0, page * limit);
    const merged: MovimientoStock[] = [];

    const ensureHead = async (source: SourceState) => {
      while (source.index >= source.items.length && source.page < source.totalPages) {
        source.page += 1;
        const response = await getMovimientos(source.ingredienteId, { page: source.page, limit: perIngredientLimit });
        source.totalPages = response.meta.total_pages;
        source.items = response.data.map((mov) => ({
          ...mov,
          ingrediente_nombre:
            ingredienteNombreById.get(mov.ingrediente_id ?? source.ingredienteId) ??
            ingredienteNombreById.get(source.ingredienteId) ??
            String(source.ingredienteId),
          usuario_nombre: mov.usuario_id ? usuariosById.get(mov.usuario_id) : undefined,
        }));
        source.index = 0;
      }
      return source.index < source.items.length;
    };

    for (const source of sources) {
      await ensureHead(source);
    }

    while (merged.length < needed) {
      let bestIndex = -1;
      let bestTime = -Infinity;

      for (let i = 0; i < sources.length; i += 1) {
        const source = sources[i];
        const hasHead = await ensureHead(source);
        if (!hasHead) continue;
        const head = source.items[source.index];
        const parsed = Date.parse(head.fecha_utc as any);
        const time = Number.isFinite(parsed) ? parsed : 0;
        if (time > bestTime) {
          bestTime = time;
          bestIndex = i;
        }
      }

      if (bestIndex === -1) break;
      const chosen = sources[bestIndex];
      merged.push(chosen.items[chosen.index]);
      chosen.index += 1;
    }

    const start = Math.max(0, (page - 1) * limit);
    const data = merged.slice(start, start + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, meta: { total, page, limit, total_pages: totalPages } };
  } catch {
    return { data: [], meta: { total: 0, page, limit, total_pages: 1 } };
  }
}

export async function getAlertasActivas() {
  const { data } = await api.get<AlertaInventario[]>("/inventario/alertas");
  return data;
}
