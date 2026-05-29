import axios from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { FiltrosFecha } from "../components/FiltrosFecha";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { getIngredientes } from "../services/inventarioService";
import { getDesperdicioInsumos } from "../services/reportesService";
import type { ApiErrorBody, Ingrediente, ReporteDesperdicioRow } from "../types";
import { defaultDateFrom, defaultDateTo, toUtcEndIso, toUtcStartIso } from "../utils/dateRange";

function parseApiMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null;
  const data = error.response?.data;
  const message = data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" | ");
  return null;
}

function formatCantidad(value: number, decimals: number) {
  const parsed = Number(value);
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  minHeight: "48px",
  border: "1px solid #d8deea",
  borderRadius: "14px",
  padding: "0 16px",
  outline: "none",
  fontSize: "1rem",
  background: "#fff",
  color: "#172033",
};

export function ReporteDesperdicioInsumosPage() {
  const { usuario, rol } = useAuth();
  const [dateFrom, setDateFrom] = useState(() => defaultDateFrom(30));
  const [dateTo, setDateTo] = useState(() => defaultDateTo());
  const [ingredienteId, setIngredienteId] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [rows, setRows] = useState<ReporteDesperdicioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => b.porcentaje_desperdicio - a.porcentaje_desperdicio);
  }, [rows]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    async function cargarIngredientes() {
      try {
        const all: Ingrediente[] = [];
        let page = 1;
        while (true) {
          const response = await getIngredientes({ page, limit: 100 });
          all.push(...response.data);
          if (page >= response.meta.total_pages) break;
          page += 1;
        }
        setIngredientes(all);
      } catch {
        setIngredientes([]);
      }
    }

    cargarIngredientes();
  }, []);

  const ingredienteIdNumber = ingredienteId ? Number(ingredienteId) : undefined;

  async function consultar() {
    setRangeError(null);
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setRangeError("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    setLoading(true);
    try {
      const data = await getDesperdicioInsumos({
        date_from: toUtcStartIso(dateFrom),
        date_to: toUtcEndIso(dateTo),
        ...(ingredienteIdNumber ? { ingrediente_id: ingredienteIdNumber } : {}),
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
            <h1 style={{ margin: 0 }}>Reporte · Desperdicio de insumos</h1>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>
              Compara consumo teórico vs real de ingredientes y marca alertas cuando el % de desperdicio supera el umbral.
            </p>
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <section className="content">
          <div style={{ display: "grid", gap: "18px", maxWidth: "1100px" }}>
            <div className="pedido-card">
              <h2 style={{ margin: 0 }}>Filtros</h2>
              <FiltrosFecha
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChangeDateFrom={setDateFrom}
                onChangeDateTo={setDateTo}
                onSubmit={handleSubmit}
                error={rangeError}
                actions={
                  <button className="primary-button" type="submit" disabled={loading}>
                    {loading ? "Consultando..." : "Consultar"}
                  </button>
                }
              >
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                  <label className="form-field">
                    Ingrediente (opcional)
                    <select value={ingredienteId} onChange={(e) => setIngredienteId(e.target.value)} style={SELECT_STYLE}>
                      <option value="">Todos</option>
                      {ingredientes.map((ingrediente) => (
                        <option key={ingrediente.id} value={String(ingrediente.id)}>
                          {ingrediente.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </FiltrosFecha>
            </div>

            <div className="pedido-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Detalle</h2>
                <span className="mesa-muted">{sortedRows.length} ingredientes</span>
              </div>

              {loading && rows.length === 0 ? (
                <div style={{ padding: "24px 0", color: "#667085" }}>Cargando...</div>
              ) : sortedRows.length === 0 ? (
                <div style={{ padding: "24px 0", color: "#667085" }}>Sin datos para el periodo seleccionado</div>
              ) : (
                <div style={{ overflow: "auto", marginTop: "14px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#475569", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.03em" }}>
                        <th style={{ padding: "16px 18px", textAlign: "left" }}>Ingrediente</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>Consumo teórico</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>Consumo real</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>Diferencia</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>% desperdicio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.ingrediente_id} style={{ borderTop: "1px solid #eef2f7", background: row.alerta ? "#fffbeb" : "transparent" }}>
                          <td style={{ padding: "16px 18px", fontWeight: 900, color: "#0f172a" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                              {row.alerta && <span style={{ color: "#b54708", fontWeight: 900 }}>⚠</span>}
                              {row.nombre}
                            </span>
                          </td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 900 }}>
                            {formatCantidad(row.consumo_teorico, 3)}
                          </td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 900 }}>
                            {formatCantidad(row.consumo_real, 3)}
                          </td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 900, color: row.diferencia > 0 ? "#b54708" : "#0f172a" }}>
                            {formatCantidad(row.diferencia, 3)}
                          </td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 900, color: row.alerta ? "#b54708" : "#0f172a" }}>
                            {formatCantidad(row.porcentaje_desperdicio, 2)}%
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
