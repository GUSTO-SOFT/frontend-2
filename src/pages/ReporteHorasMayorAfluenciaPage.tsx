import axios from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { FiltrosFecha } from "../components/FiltrosFecha";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { getAfluencia } from "../services/reportesService";
import type { ApiErrorBody, ReporteAfluenciaResponse, ReporteAfluenciaRow } from "../types";
import { defaultDateFrom, defaultDateTo, toUtcEndIso, toUtcStartIso } from "../utils/dateRange";

function parseApiMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null;
  const data = error.response?.data;
  const message = data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" | ");
  return null;
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatRange(row: { franja_inicio: string; franja_fin: string }) {
  return `${formatTime(row.franja_inicio)} - ${formatTime(row.franja_fin)}`;
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

const DIA_SEMANA_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Todos", value: "" },
  { label: "Domingo (0)", value: "0" },
  { label: "Lunes (1)", value: "1" },
  { label: "Martes (2)", value: "2" },
  { label: "Miércoles (3)", value: "3" },
  { label: "Jueves (4)", value: "4" },
  { label: "Viernes (5)", value: "5" },
  { label: "Sábado (6)", value: "6" },
];

function ChartAfluencia({ rows, granularidad }: { rows: ReporteAfluenciaRow[]; granularidad: "30m" | "1h" }) {
  const chartHeight = 180;
  const columnWidth = granularidad === "30m" ? 44 : 58;

  const maxValue = useMemo(() => {
    return rows.reduce((max, row) => Math.max(max, row.total_pedidos, row.total_mesas_abiertas), 0);
  }, [rows]);

  if (rows.length === 0) {
    return <div style={{ padding: "18px 0", color: "#667085" }}>No hay datos para graficar.</div>;
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#344054", fontWeight: 800 }}>
          <span className="dot" style={{ background: "#007a2f" }} />
          Total pedidos
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#344054", fontWeight: 800 }}>
          <span className="dot" style={{ background: "#94a3b8" }} />
          Total mesas abiertas
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#344054", fontWeight: 800 }}>
          <span className="dot" style={{ background: "#d1141f" }} />
          Franja pico
        </span>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", padding: "12px 8px", minHeight: chartHeight + 60 }}>
          {rows.map((row) => {
            const heightPedidos = maxValue ? Math.max(2, Math.round((row.total_pedidos / maxValue) * chartHeight)) : 2;
            const heightMesas = maxValue ? Math.max(2, Math.round((row.total_mesas_abiertas / maxValue) * chartHeight)) : 2;
            const pedidosColor = row.is_pico ? "#d1141f" : "#007a2f";
            const mesasColor = row.is_pico ? "#f97316" : "#94a3b8";

            return (
              <div key={`${row.franja_inicio}-${row.franja_fin}`} style={{ width: columnWidth, display: "grid", gap: "10px", justifyItems: "center" }}>
                <div
                  title={`${formatRange(row)}\nPedidos: ${row.total_pedidos}\nMesas abiertas: ${row.total_mesas_abiertas}${row.is_pico ? "\nPico" : ""}`}
                  style={{ height: chartHeight, display: "flex", alignItems: "flex-end", gap: "6px" }}
                >
                  <div style={{ width: "16px", height: `${heightPedidos}px`, background: pedidosColor, borderRadius: "10px" }} />
                  <div style={{ width: "16px", height: `${heightMesas}px`, background: mesasColor, borderRadius: "10px" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", fontSize: "0.75rem", color: "#667085" }}>
                  <span>{formatTime(row.franja_inicio)}</span>
                  {row.is_pico && <span style={{ color: "#d1141f", fontWeight: 900 }}>▲</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ReporteHorasMayorAfluenciaPage() {
  const { usuario, rol } = useAuth();
  const [dateFrom, setDateFrom] = useState(() => defaultDateFrom(30));
  const [dateTo, setDateTo] = useState(() => defaultDateTo());
  const [granularidad, setGranularidad] = useState<"30m" | "1h">("1h");
  const [diaSemana, setDiaSemana] = useState<string>("");
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [data, setData] = useState<ReporteAfluenciaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const rows = data?.data ?? [];

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.franja_inicio.localeCompare(b.franja_inicio));
  }, [rows]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const diaSemanaNumber = diaSemana === "" ? undefined : Number(diaSemana);

  async function consultar() {
    setRangeError(null);
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setRangeError("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    setLoading(true);
    try {
      const response = await getAfluencia({
        date_from: toUtcStartIso(dateFrom),
        date_to: toUtcEndIso(dateTo),
        granularidad,
        ...(diaSemanaNumber === undefined ? {} : { dia_semana: diaSemanaNumber }),
      });
      setData(response);
    } catch (err) {
      setData(null);
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

  const percentil75 = data?.resumen.percentil_75 ?? 0;
  const franjaPicoAbsoluta = data?.resumen.franja_pico_absoluto ?? null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>Reporte · Horas de mayor afluencia</h1>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>
              Franjas horarias con total de pedidos y mesas abiertas. Resalta picos según el percentil 75.
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
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <label className="form-field">
                    Granularidad
                    <select value={granularidad} onChange={(e) => setGranularidad(e.target.value as "30m" | "1h")} style={SELECT_STYLE}>
                      <option value="30m">30 minutos</option>
                      <option value="1h">1 hora</option>
                    </select>
                  </label>
                  <label className="form-field">
                    Día de semana (0-6)
                    <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} style={SELECT_STYLE}>
                      {DIA_SEMANA_OPTIONS.map((option) => (
                        <option key={option.value || "all"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </FiltrosFecha>
            </div>

            <div className="pedido-card">
              <h2 style={{ margin: 0 }}>Resumen</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginTop: "14px" }}>
                <div style={{ border: "1px solid #e7ebf3", borderRadius: "12px", padding: "16px", background: "#fff" }}>
                  <div style={{ color: "#667085", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Percentil 75 (pedidos)
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#141a2d", marginTop: "6px" }}>{percentil75}</div>
                </div>
                <div style={{ border: "1px solid #e7ebf3", borderRadius: "12px", padding: "16px", background: "#fff" }}>
                  <div style={{ color: "#667085", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Franja pico absoluta
                  </div>
                  {franjaPicoAbsoluta ? (
                    <div style={{ marginTop: "6px", display: "grid", gap: "4px" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#141a2d" }}>{formatRange(franjaPicoAbsoluta)}</div>
                      <div style={{ color: "#667085", fontWeight: 800 }}>
                        {franjaPicoAbsoluta.total_pedidos} pedidos · {franjaPicoAbsoluta.total_mesas_abiertas} mesas abiertas
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "10px", color: "#667085" }}>Sin datos.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pedido-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Gráfica</h2>
                <span className="mesa-muted">{sortedRows.length} franjas</span>
              </div>

              {loading && !data ? (
                <div style={{ padding: "24px 0", color: "#667085" }}>Cargando...</div>
              ) : (
                <div style={{ marginTop: "14px" }}>
                  <ChartAfluencia rows={sortedRows} granularidad={granularidad} />
                </div>
              )}
            </div>

            <div className="pedido-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Detalle por franja</h2>
                <span className="mesa-muted">
                  Picos: {sortedRows.filter((row) => row.is_pico).length}/{sortedRows.length}
                </span>
              </div>

              {loading && !data ? (
                <div style={{ padding: "24px 0", color: "#667085" }}>Cargando...</div>
              ) : sortedRows.length === 0 ? (
                <div style={{ padding: "24px 0", color: "#667085" }}>No hay datos para el rango seleccionado.</div>
              ) : (
                <div style={{ overflow: "auto", marginTop: "14px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#475569", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.03em" }}>
                        <th style={{ padding: "16px 18px", textAlign: "left" }}>Franja</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>Total pedidos</th>
                        <th style={{ padding: "16px 18px", textAlign: "right" }}>Mesas abiertas</th>
                        <th style={{ padding: "16px 18px", textAlign: "center" }}>Pico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={`${row.franja_inicio}-${row.franja_fin}`} style={{ borderTop: "1px solid #eef2f7", background: row.is_pico ? "#fff0f1" : "transparent" }}>
                          <td style={{ padding: "16px 18px", fontWeight: 900, color: "#0f172a" }}>{formatRange(row)}</td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 900 }}>{row.total_pedidos}</td>
                          <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 900 }}>{row.total_mesas_abiertas}</td>
                          <td style={{ padding: "16px 18px", textAlign: "center", fontWeight: 900, color: row.is_pico ? "#d1141f" : "#667085" }}>
                            {row.is_pico ? "▲" : "—"}
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

