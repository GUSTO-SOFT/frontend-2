import { useEffect, useState } from "react";
import { getAlertasActivas } from "../services/inventarioService";
import type { AlertaInventario } from "../types";
import { useAuth } from "../auth/AuthContext";
import { formatDate } from "../utils/format";

type Props = {
  mode?: "inline" | "page";
};

type Status = "CRITICO" | "PROXIMO_AL_MINIMO" | "AGOTADO";

function getStatus(stockActual: number, stockMinimo: number): Status {
  if (stockActual === 0) return "AGOTADO";
  if (stockMinimo > 0 && stockActual / stockMinimo <= 0.1) return "CRITICO";
  return "PROXIMO_AL_MINIMO";
}

function getStatusStyle(status: Status) {
  switch (status) {
    case "AGOTADO":
      return { label: "AGOTADO", bg: "#fff0f1", color: "#d1141f", icon: "⛔" };
    case "CRITICO":
      return { label: "CRÍTICO", bg: "#fffbeb", color: "#d97706", icon: "⚠️" };
    default:
      return { label: "PRÓXIMO AL MÍNIMO", bg: "#fef3c7", color: "#92400e", icon: "⏳" };
  }
}

export function AlertasBanner({ mode = "inline" }: Props) {
  const { rol, isAuthenticated } = useAuth();
  const [alertas, setAlertas] = useState<AlertaInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [filter, setFilter] = useState<Status | "TODAS">("TODAS");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const fetchAlertas = async (silent = false) => {
    if (!isAuthenticated || (rol !== "ADMIN" && rol !== "CHEF")) return;
    if (!silent) setLoading(true);
    try {
      const data = await getAlertasActivas();
      setAlertas(data);
      setUnauthorized(false);
      setLastUpdatedAt(new Date());
    } catch (error: any) {
      if (error.response?.status === 401) {
        setUnauthorized(true);
        if (!silent) setAlertas([]);
        return;
      }
      console.error("Error fetching alerts:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || (rol !== "ADMIN" && rol !== "CHEF")) return;

    fetchAlertas();

    const interval = setInterval(() => {
      fetchAlertas(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, rol]);

  if (rol !== "ADMIN" && rol !== "CHEF") return null;
  if (mode === "inline" && alertas.length === 0 && !loading) return null;

  const enriched = alertas.map((a) => {
    const status = getStatus(a.stock_actual, a.stock_minimo);
    return { alerta: a, status, style: getStatusStyle(status) };
  });

  const visibles =
    filter === "TODAS" ? enriched : enriched.filter((a) => a.status === filter);

  const stats = enriched.reduce(
    (acc, a) => {
      acc.total += 1;
      if (a.status === "AGOTADO") acc.agotados += 1;
      else if (a.status === "CRITICO") acc.criticos += 1;
      else acc.proximos += 1;
      return acc;
    },
    { total: 0, criticos: 0, agotados: 0, proximos: 0 }
  );

  const header = (
    <div
      style={{
        background: "#d1141f",
        borderRadius: "18px",
        padding: "18px",
        color: "#fff",
        boxShadow: "0 10px 30px rgba(209, 20, 31, 0.18)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <span
            style={{
              width: "fit-content",
              background: "rgba(255,255,255,0.18)",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.02em",
            }}
          >
            ATENCIÓN INMEDIATA
          </span>
          <div style={{ fontSize: "1.25rem", fontWeight: 900 }}>Stock Crítico Detectado</div>
          <div style={{ opacity: 0.95, fontSize: "0.92rem" }}>
            Hay {stats.total} insumos activos en alerta ({stats.criticos + stats.agotados} críticos/agotados).
          </div>
        </div>
        {rol === "ADMIN" && (
          <button
            type="button"
            onClick={() => {
              window.location.hash = "#inventario";
            }}
            style={{
              background: "#fff",
              color: "#d1141f",
              border: "none",
              borderRadius: "14px",
              padding: "12px 16px",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Ver Inventario
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="alertas-banner-container" style={{ marginBottom: mode === "page" ? "0" : "24px" }}>
      {mode === "page" ? (
        <div style={{ display: "grid", gap: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px", alignItems: "stretch" }}>
            {header}
            <div
              style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "18px",
                border: "1px solid #f0f0f0",
                boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
                display: "grid",
                gap: "10px",
              }}
            >
              <div style={{ fontWeight: 800, color: "#0f172a" }}>Estado</div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#667085" }}>
                <span>Última actualización</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {lastUpdatedAt ? formatDate(lastUpdatedAt.toISOString()) : "—"}
                </span>
              </div>
              <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: "55%", height: "100%", background: "#d1141f" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, color: "#141a2d" }}>Alertas Activas</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {([
                { key: "TODAS", label: "Todas" },
                { key: "CRITICO", label: "Crítico" },
                { key: "PROXIMO_AL_MINIMO", label: "Próximo al mínimo" },
                { key: "AGOTADO", label: "Agotado" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFilter(opt.key as any)}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: filter === opt.key ? "#d1141f" : "#fff",
                    color: filter === opt.key ? "#fff" : "#475569",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {unauthorized ? (
            <div style={{ background: "#fff", borderRadius: "18px", padding: "18px", border: "1px solid #f0f0f0", color: "#667085" }}>
              Sesión no autorizada. Vuelve a iniciar sesión para ver alertas.
            </div>
          ) : loading && enriched.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "18px", padding: "18px", border: "1px solid #f0f0f0", color: "#667085" }}>
              Cargando alertas...
            </div>
          ) : visibles.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "18px", padding: "18px", border: "1px solid #f0f0f0", color: "#667085" }}>
              No hay alertas activas para este filtro.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {visibles.map(({ alerta, style }) => (
                <div
                  key={alerta.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #f0f0f0",
                    borderRadius: "18px",
                    padding: "18px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: style.bg, display: "grid", placeItems: "center", fontSize: "20px", color: style.color }}>
                        {style.icon}
                      </div>
                      <div style={{ display: "grid", gap: "2px" }}>
                        <div style={{ fontWeight: 900, color: "#141a2d" }}>{alerta.nombre}</div>
                        <div style={{ fontSize: "0.8rem", color: "#98a2b3" }}>ID: {alerta.ingrediente_id}</div>
                      </div>
                    </div>
                    <div style={{ height: "fit-content", background: style.bg, color: style.color, padding: "6px 10px", borderRadius: "999px", fontWeight: 900, fontSize: "0.72rem" }}>
                      {style.label}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#98a2b3", fontWeight: 900 }}>STOCK ACTUAL</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: style.color }}>{alerta.stock_actual}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "#98a2b3", fontWeight: 900 }}>MÍNIMO REQUERIDO</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#141a2d" }}>{alerta.stock_minimo}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                    <div style={{ fontSize: "0.78rem", color: "#98a2b3" }}>
                      {formatDate(alerta.generada_at)}
                    </div>
                    {rol === "ADMIN" && (
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = "#inventario";
                        }}
                        style={{
                          border: "none",
                          background: "#d1141f",
                          color: "#fff",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Gestionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            {[
              { label: "Alertas Totales", value: stats.total, color: "#0f172a", bg: "#f8fafc" },
              { label: "Stock Bajo", value: stats.proximos, color: "#92400e", bg: "#fef3c7" },
              { label: "Críticos/Agotados", value: stats.criticos + stats.agotados, color: "#d1141f", bg: "#fff0f1" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#fff", borderRadius: "18px", padding: "16px", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ color: "#98a2b3", fontWeight: 900, fontSize: "0.75rem" }}>{s.label}</div>
                    <div style={{ marginTop: "8px", fontWeight: 900, fontSize: "1.6rem", color: s.color }}>{s.value}</div>
                  </div>
                  <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: s.bg }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            borderRadius: "12px",
            padding: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#ff4d4f", color: "#fff", padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 900 }}>
              ALERTA
            </div>
            <div style={{ fontWeight: 900, color: "#d1141f" }}>
              {stats.total} alertas activas ({stats.criticos + stats.agotados} críticos/agotados)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
