import { api } from "../api/client";
import type { ReporteProductoVendidoRow } from "../types";

type DateRange = {
  date_from: string;
  date_to: string;
};

export async function getProductosVendidos(range: DateRange) {
  const { data } = await api.get<ReporteProductoVendidoRow[]>("/reportes/productos-vendidos", {
    params: range,
  });
  return data;
}

export async function descargarProductosVendidosCsv(range: DateRange) {
  const { data } = await api.get("/reportes/productos-vendidos", {
    params: range,
    responseType: "blob",
    headers: {
      Accept: "text/csv",
    },
  });
  return data as Blob;
}

export async function descargarProductosVendidosPdf(range: DateRange) {
  const { data } = await api.get("/reportes/productos-vendidos", {
    params: range,
    responseType: "blob",
    headers: {
      Accept: "application/pdf",
    },
  });
  return data as Blob;
}

