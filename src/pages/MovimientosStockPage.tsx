import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { getMovimientosGlobales } from "../services/inventarioService";
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

  useEffect(() => {
    fetchMovimientos(page);
  }, [page]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      setToast({ message: "Error al cargar movimientos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayMovs = movimientos.filter(
      (m) => new Date(m.fecha_utc).toDateString() === today
    );

    const entradas = todayMovs.filter((m) => m.tipo === "ENTRADA").reduce((sum, m) => sum + m.cantidad, 0);
    const salidas = todayMovs.filter((m) => m.tipo === "SALIDA").reduce((sum, m) => sum + m.cantidad, 0);
    const ajustes = todayMovs.filter((m) => m.tipo === "AJUSTE").length;
    
    // Contar alertas: movimientos que indican bajo stock (salidas, o ajustes negativos)
    const alertas = todayMovs.filter((m) => {
      if (m.tipo === "SALIDA") return true;
      if (m.tipo === "AJUSTE" && m.cantidad < 0) return true;
      return false;
    }).length;

    return {
      entradas,
      salidas,
      ajustes,
      alertas,
    };
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
    const date = new Date(fecha);
    return date.toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>Movimientos de Stock</h1>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>Historial detallado de entradas, salidas y ajustes de cocina.</p>
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <section className="content">
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)", borderLeft: "5px solid #047857" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
                  Entradas Hoy
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#047857" }}>
                  {stats.entradas.toFixed(1)}
                </div>
                <p style={{ margin: "8px 0 0", color: "#667085", fontSize: "0.85rem" }}>↑ 12% vs ayer</p>
              </div>

              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)", borderLeft: "5px solid #b91c1c" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
                  Salidas Hoy
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#b91c1c" }}>
                  {stats.salidas.toFixed(1)}
                </div>
                <p style={{ margin: "8px 0 0", color: "#667085", fontSize: "0.85rem" }}>↑ 5% vs ayer</p>
              </div>

              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)", borderLeft: "5px solid #92400e" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
                  Ajustes Realizados
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#92400e" }}>
                  {stats.ajustes}
                </div>
                <p style={{ margin: "8px 0 0", color: "#667085", fontSize: "0.85rem" }}>Hoy</p>
              </div>

              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)", borderLeft: "5px solid #d97706" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
                  Alertas Stock
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#d97706" }}>
                  {stats.alertas}
                </div>
                <p style={{ margin: "8px 0 0", color: "#667085", fontSize: "0.85rem" }}>⚠️ Movimientos hoy</p>
              </div>
            </div>

            {/* Movimientos Table */}
            <div style={{ background: "#fff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Historial de Movimientos</h3>
                    <p style={{ margin: "8px 0 0", color: "#667085", fontSize: "0.9rem" }}>
                      Mostrando {movimientos.length} de {totalItems} movimientos
                    </p>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>
                    Página {page} de {totalPages}
                  </span>
                </div>
              </div>

              {loading && movimientos.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#667085" }}>
                  Cargando movimientos...
                </div>
              ) : movimientos.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#667085" }}>
                  No hay movimientos registrados.
                </div>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", color: "#475569", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.03em" }}>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Fecha y Hora</th>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Ingrediente</th>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Tipo</th>
                        <th style={{ padding: "18px 24px", textAlign: "right" }}>Cantidad</th>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Motivo</th>
                        <th style={{ padding: "18px 24px", textAlign: "left" }}>Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((mov) => {
                        const badge = getTipoBadge(mov.tipo);
                        return (
                          <tr key={mov.id} style={{ borderTop: "1px solid #eef2f7" }}>
                            <td style={{ padding: "18px 24px", fontSize: "0.9rem", color: "#0f172a" }}>
                              {formatFecha(mov.fecha_utc)}
                            </td>
                            <td style={{ padding: "18px 24px", fontSize: "0.9rem", color: "#0f172a", fontWeight: 700 }}>
                              —
                            </td>
                            <td style={{ padding: "18px 24px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "6px 12px",
                                  borderRadius: "999px",
                                  background: badge.bg,
                                  color: badge.color,
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                }}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td style={{ padding: "18px 24px", textAlign: "right", fontWeight: 700, color: mov.tipo === "ENTRADA" ? "#047857" : "#b91c1c" }}>
                              {mov.tipo === "ENTRADA" ? "+" : mov.tipo === "SALIDA" ? "-" : ""}{mov.cantidad.toFixed(3)}
                            </td>
                            <td style={{ padding: "18px 24px", color: "#667085", fontSize: "0.9rem" }}>
                              {mov.motivo}
                            </td>
                            <td style={{ padding: "18px 24px", color: "#667085", fontSize: "0.9rem" }}>
                              {mov.usuario_nombre ?? "Admin"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div style={{ padding: "18px 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      type="button"
                      disabled={page === 1 || loading}
                      onClick={() => setPage(page - 1)}
                      style={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        padding: "10px 18px",
                        cursor: page === 1 || loading ? "not-allowed" : "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Anterior
                    </button>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {Array.from({ length: totalPages }, (_, index) => (
                        <button
                          key={index}
                          type="button"
                          disabled={loading}
                          onClick={() => setPage(index + 1)}
                          style={{
                            minWidth: "38px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            background: index + 1 === page ? "#d1141f" : "#fff",
                            color: index + 1 === page ? "#fff" : "#0f172a",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: index + 1 === page ? 700 : 400,
                          }}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={page === totalPages || loading}
                      onClick={() => setPage(page + 1)}
                      style={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        padding: "10px 18px",
                        cursor: page === totalPages || loading ? "not-allowed" : "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Siguiente
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
