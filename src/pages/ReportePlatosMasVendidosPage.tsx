import axios from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { descargarProductosVendidosCsv, descargarProductosVendidosPdf, getProductosVendidos } from "../services/reportesService";
import type { ApiErrorBody, ReporteProductoVendidoRow } from "../types";
import { formatCurrency } from "../utils/format";

function formatIsoDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toUtcStartIso(dateInput: string) {
  return `${dateInput}T00:00:00.000Z`;
}

function toUtcEndIso(dateInput: string) {
  return `${dateInput}T23:59:59.999Z`;
}

function parseApiMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null;
  const data = error.response?.data;
  const message = data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" | ");
  return null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReportePlatosMasVendidosPage() {
  const { usuario, rol } = useAuth();
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return formatIsoDateInput(from);
  });
  const [dateTo, setDateTo] = useState(() => formatIsoDateInput(new Date()));
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [rows, setRows] = useState<ReporteProductoVendidoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => b.total_unidades - a.total_unidades);
  }, [rows]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function consultar() {
    setRangeError(null);
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setRangeError("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    setLoading(true);
    try {
      const data = await getProductosVendidos({
        date_from: toUtcStartIso(dateFrom),
        date_to: toUtcEndIso(dateTo),
      });
      setRows(data);
    } catch (err) {
      setRows([]);
      setToast({ message: parseApiMessage(err) ?? "No se pudo consultar el reporte.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    consultar();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    consultar();
  }

  async function handleExport(format: "csv" | "pdf") {
    setRangeError(null);
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setRangeError("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    setDownloading(format);
    try {
      const range = {
        date_from: toUtcStartIso(dateFrom),
        date_to: toUtcEndIso(dateTo),
      };
      const blob =
        format === "csv" ? await descargarProductosVendidosCsv(range) : await descargarProductosVendidosPdf(range);
      const safeFrom = dateFrom.replaceAll("-", "");
      const safeTo = dateTo.replaceAll("-", "");
      downloadBlob(blob, `platos-mas-vendidos_${safeFrom}_${safeTo}.${format}`);
    } catch (err) {
      setToast({ message: parseApiMessage(err) ?? "No se pudo exportar el reporte.", type: "error" });
    } finally {
      setDownloading(null);
    }
  }

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <section className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden acceder a este reporte.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>Reporte · Platos más vendidos</h1>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>
              Rango de fechas y resumen de unidades vendidas e ingresos.
            </p>
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <section className="content">
          <div style={{ display: "grid", gap: "18px", maxWidth: "980px" }}>
            <div className="pedido-card">
              <h2 style={{ margin: 0 }}>Filtros</h2>
              <form onSubmit={handleSubmit} className="login-form" style={{ gap: "12px", marginTop: "14px" }}>
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <label className="form-field">
                    Fecha desde
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </label>
                  <label className="form-field">
                    Fecha hasta
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </label>
                </div>

                {rangeError && <p className="form-error">{rangeError}</p>}

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button className="primary-button" type="submit" disabled={loading}>
                    {loading ? "Consultando..." : "Consultar"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={downloading === "csv" || loading}
                    onClick={() => handleExport("csv")}
                  >
                    {downloading === "csv" ? "Exportando..." : "Exportar CSV"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={downloading === "pdf" || loading}
                    onClick={() => handleExport("pdf")}
                  >
                    {downloading === "pdf" ? "Exportando..." : "Exportar PDF"}
                  </button>
                </div>
              </form>
            </div>

            <div className="pedido-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Resultados</h2>
                <span className="mesa-muted">{sortedRows.length} productos</span>
              </div>

              {loading && rows.length === 0 ? (
                <div style={{ padding: "24px 0", color: "#667085" }}>Cargando...</div>
              ) : sortedRows.length === 0 ? (
                <div style={{ padding: "24px 0", color: "#667085" }}>No hay datos para el rango seleccionado.</div>
              ) : (
                <div style={{ overflow: "auto", marginTop: "14px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#475569", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.03em" }}>
                        <th style={{ padding: "16px 18px", textAlign: "left" }}>Producto</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>Total unidades</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>Ingreso total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.producto_id} style={{ borderTop: "1px solid #eef2f7" }}>
                          <td style={{ padding: "16px 18px", fontWeight: 800, color: "#0f172a" }}>{row.nombre}</td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 800 }}>{row.total_unidades}</td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 800 }}>
                            {formatCurrency(row.ingreso_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

