import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { getAlertasActivas, getMovimientosGlobales } from "../services/inventarioService";
import type { MovimientoStock } from "../types";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const PAGE_SIZE = 15;

export function MovimientosStockPage() {
  const { usuario, rol } = useAuth();
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [alertasCount, setAlertasCount] = useState<number | null>(null);

  useEffect(() => {
    fetchMovimientos(page);
  }, [page]);

  useEffect(() => {
    fetchAlertas();
  }, []);

  const fetchAlertas = async () => {
    try {
      const alertas = await getAlertasActivas();
      setAlertasCount(alertas.length);
    } catch {
      setAlertasCount(null);
    }
  };

  const fetchMovimientos = async (nextPage: number) => {
    setLoading(true);
    try {
      const response = await getMovimientosGlobales({
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setMovimientos(response.data);
      setTotalPages(response.meta.total_pages);
      setTotalItems(response.meta.total);
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const message = error?.response?.data?.message;
      const errorText =
        typeof message === "string"
          ? message
          : Array.isArray(message)
            ? message.join(", ")
            : null;

      console.error("Error al cargar movimientos:", error);
      setToast({
        message: `Error al cargar movimientos${status ? ` (${status})` : ""}${code ? ` - ${code}` : ""}${errorText ? `: ${errorText}` : ""}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayMovs = movimientos.filter((m) => new Date(m.fecha_utc).toDateString() === today);

    const salidas = todayMovs.filter((m) => m.tipo === "SALIDA").reduce((sum, m) => sum + m.cantidad, 0);
    const ajustes = todayMovs.filter((m) => m.tipo === "AJUSTE").length;

    return { salidas, ajustes };
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
        return { bg: "#e6f7ed", color: "#047857", label: "Entrada" };
      case "SALIDA":
        return { bg: "#fff0f1", color: "#b91c1c", label: "Salida" };
      case "AJUSTE":
        return { bg: "#fef3c7", color: "#92400e", label: "Ajuste" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280", label: tipo };
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumberSmart = (value: number, maxDecimals: number) => {
    if (!Number.isFinite(value)) return String(value);
    const fixed = value.toFixed(maxDecimals);
    return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  };

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <section className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden acceder a esta página.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const stats = getTodayStats();
  const pageStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, totalItems);
  const pagesToShow = (() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    const start = Math.max(1, Math.min(page - half, totalPages - windowSize + 1));
    const end = Math.min(totalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>Movimientos de Stock</h1>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>Historial global de movimientos de inventario.</p>
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <section className="content">
          <div style={{ display: "grid", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
              <div style={{ background: "#fff", borderRadius: "18px", padding: "18px 20px", border: "1px solid #fee2e2" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.04em" }}>SALIDAS HOY</div>
                <div style={{ marginTop: "10px", fontSize: "2rem", fontWeight: 900, color: "#b91c1c" }}>{formatNumberSmart(stats.salidas, 3)}</div>
                <div style={{ marginTop: "6px", color: "#98a2b3", fontSize: "0.85rem" }}>Consumo por pedidos</div>
              </div>

              <div style={{ background: "#fff", borderRadius: "18px", padding: "18px 20px", border: "1px solid #ffedd5" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.04em" }}>AJUSTES REALIZADOS</div>
                <div style={{ marginTop: "10px", fontSize: "2rem", fontWeight: 900, color: "#92400e" }}>{stats.ajustes}</div>
                <div style={{ marginTop: "6px", color: "#98a2b3", fontSize: "0.85rem" }}>Mermas o correcciones</div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  window.location.hash = "#inventario/alertas";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") window.location.hash = "#inventario/alertas";
                }}
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  padding: "18px 20px",
                  border: "1px solid #fee2e2",
                  cursor: "pointer",
                }}
              >
                <div style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.04em" }}>ALERTAS STOCK</div>
                <div style={{ marginTop: "10px", fontSize: "2rem", fontWeight: 900, color: "#d1141f" }}>{alertasCount ?? "—"}</div>
                <div style={{ marginTop: "6px", color: "#d1141f", fontSize: "0.85rem", fontWeight: 700 }}>Requiere atención</div>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ padding: "24px" }}>
                <h3 style={{ margin: 0 }}>Historial de Movimientos</h3>
                <p style={{ margin: "8px 0 0", color: "#667085", fontSize: "0.9rem" }}>Movimientos ordenados por fecha (DESC).</p>
              </div>

              {loading && movimientos.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" }}>Cargando...</div>
              ) : movimientos.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" }}>No hay movimientos registrados.</div>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#475569", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.03em" }}>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Fecha y hora</th>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Ingrediente</th>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Tipo</th>
                        <th style={{ padding: "18px 24px", textAlign: "right" }}>Cantidad</th>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Responsable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((mov) => {
                        const badge = getTipoBadge(mov.tipo);
                        const ingredienteNombre = mov.ingrediente_nombre ?? `Insumo #${mov.ingrediente_id}`;
                        const responsable =
                          mov.usuario_nombre ?? (mov.usuario_id ? `Usuario #${mov.usuario_id}` : "Sistema");
                        const cantidadText =
                          mov.tipo === "SALIDA"
                            ? `-${formatNumberSmart(mov.cantidad, 3)}`
                            : mov.tipo === "AJUSTE"
                              ? `±${formatNumberSmart(mov.cantidad, 3)}`
                              : formatNumberSmart(mov.cantidad, 3);
                        return (
                          <tr key={mov.id} style={{ borderTop: "1px solid #eef2f7" }}>
                            <td style={{ padding: "18px 24px", fontSize: "0.9rem" }}>{formatFecha(mov.fecha_utc)}</td>
                            <td style={{ padding: "18px 24px" }}>
                              <div style={{ display: "grid", gap: "4px" }}>
                                <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>{ingredienteNombre}</span>
                                <span style={{ fontSize: "0.85rem", color: "#667085" }}>{mov.motivo}</span>
                              </div>
                            </td>
                            <td style={{ padding: "18px 24px" }}>
                              <span style={{ padding: "6px 12px", borderRadius: "999px", background: badge.bg, color: badge.color, fontWeight: 700, fontSize: "0.8rem" }}>{badge.label}</span>
                            </td>
                            <td style={{ padding: "18px 24px", textAlign: "right", fontWeight: 800, color: mov.tipo === "SALIDA" ? "#b91c1c" : mov.tipo === "AJUSTE" ? "#92400e" : "#0f172a" }}>
                              {cantidadText}
                            </td>
                            <td style={{ padding: "18px 24px", color: "#667085", fontSize: "0.9rem", fontWeight: 700 }}>
                              {responsable}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", color: "#667085" }}>
                      Mostrando {pageStart}-{pageEnd} de {totalItems} movimientos
                    </span>
                    <button
                      type="button"
                      disabled={page === 1 || loading}
                      onClick={() => setPage(page - 1)}
                      style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", padding: "8px 16px", cursor: page === 1 || loading ? "not-allowed" : "pointer", fontWeight: 800 }}
                    >
                      ‹
                    </button>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {pagesToShow.map((p) => (
                        <button
                          key={p}
                          type="button"
                          disabled={loading}
                          onClick={() => setPage(p)}
                          style={{
                            minWidth: "38px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            background: p === page ? "#d1141f" : "#fff",
                            color: p === page ? "#fff" : "#0f172a",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: 800,
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={page === totalPages || loading}
                      onClick={() => setPage(page + 1)}
                      style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", padding: "8px 16px", cursor: page === totalPages || loading ? "not-allowed" : "pointer", fontWeight: 800 }}
                    >
                      ›
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
