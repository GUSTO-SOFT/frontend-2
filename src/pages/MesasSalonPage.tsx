import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { MesaCard } from "../components/MesaCard";
import { MesaSkeleton } from "../components/MesaSkeleton";
import { Toast } from "../components/Toast";
import { AsignarMeseroModal } from "../components/AsignarMeseroModal";
import { Sidebar } from "../components/Sidebar";
import { ConexionEstadoBadge } from "../components/ConexionEstadoBadge";
import { useMesasSocket } from "../hooks/useMesasSocket";
import { usePollingFallback } from "../hooks/usePollingFallback";
import { abrirMesa, getMesas } from "../services/mesasService";
import type { ApiErrorBody, Mesa, MesaSocketPayload, MesaEstado } from "../types";

const PAGE_SIZE = 8;

type FilterState = "todas" | "disponibles" | "ocupadas";

export function MesasSalonPage() {
  const { usuario, rol, logout } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [assigningMesa, setAssigningMesa] = useState<Mesa | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterState>("todas");
  const [totals, setTotals] = useState({ todas: 0, disponibles: 0, ocupadas: 0 });

  const applySocketUpdate = useCallback((payload: MesaSocketPayload) => {
    setMesas((current) => current.map((mesa) => (
      mesa.id === payload.mesa_id
        ? {
            ...mesa,
            estado: payload.estado,
            estado_color: payload.estado_color,
            mesero_id: payload.mesero_id,
            opened_at: payload.opened_at,
          }
        : mesa
    )));
  }, []);

  const { mode } = useMesasSocket(applySocketUpdate);

  const filterToEstado = (value: FilterState): MesaEstado | undefined => {
    if (value === "disponibles") return "DISPONIBLE";
    if (value === "ocupadas") return "OCUPADA";
    return undefined;
  };

  const loadTotals = useCallback(async () => {
    try {
      const [all, disponibles, ocupadas] = await Promise.all([
        getMesas({ page: 1, limit: 1 }),
        getMesas({ page: 1, limit: 1, estado: "DISPONIBLE" }),
        getMesas({ page: 1, limit: 1, estado: "OCUPADA" }),
      ]);

      setTotals({
        todas: all.meta.total,
        disponibles: disponibles.meta.total,
        ocupadas: ocupadas.meta.total,
      });
    } catch {
      // no se necesitan totales exactos si falla la carga
    }
  }, []);

  const fetchMesas = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await getMesas({
        page,
        limit: PAGE_SIZE,
        estado: filterToEstado(filter),
      });
      setMesas(response.data);
      setTotalPages(Math.max(1, response.meta.total_pages));
      if (!silent) {
        await loadTotals();
      }
    } catch {
      setToast("No se pudieron cargar las mesas. Verifica la conexion con el servidor.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, filter, loadTotals]);

  // Integración de Polling Fallback
  usePollingFallback(mode, fetchMesas);

  useEffect(() => {
    void fetchMesas();
  }, [fetchMesas]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mesasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return mesas;

    return mesas.filter((mesa) => String(mesa.numero).includes(term));
  }, [mesas, search]);

  async function handleAbrirMesa(mesa: Mesa) {
    setOpeningId(mesa.id);

    try {
      const updatedMesa = await abrirMesa(mesa.id);
      setMesas((current) => current.map((item) => (
        item.id === updatedMesa.id ? updatedMesa : item
      )));
      await loadTotals();
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const status = error.response?.status;
        const code = error.response?.data?.error;

        if (status === 409 || code === "MESA_YA_OCUPADA") {
          setToast("Esta mesa ya se encuentra ocupada");
          return;
        }

        if (status === 403) {
          window.alert("No tienes permisos para realizar esta accion");
          return;
        }
      }

      setToast("No se pudo abrir la mesa. Intentalo nuevamente.");
    } finally {
      setOpeningId(null);
    }
  }

  function handleAsignarMesero(mesa: Mesa) {
    setAssigningMesa(mesa);
  }

  function handleAssignmentSuccess(updatedMesa: Mesa) {
    setMesas((current) => current.map((item) => (
      item.id === updatedMesa.id ? updatedMesa : item
    )));
  }

  function handleAssignmentError(message: string) {
    setToast(message);
  }

  const canViewTables = rol === "ADMIN" || rol === "MESERO";

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <header className="topbar">
          <h1>Panel de Mesas</h1>
          <label className="search">
            <span>Buscar mesa</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar mesa..."
              inputMode="numeric"
              disabled={!canViewTables}
            />
          </label>
          <div className="session-user">
            <strong>{usuario?.nombre ?? "Usuario"}</strong>
            <span>{rol ?? "Sin rol"}</span>
          </div>
        </header>

        <section className="content">
          {!canViewTables ? (
            <div className="empty-state">
              <h2>Módulo no disponible</h2>
              <p>No tienes permisos para gestionar mesas. Por favor, selecciona un módulo permitido en el menú lateral.</p>
            </div>
          ) : (
            <>
              <div className="toolbar">
                <div className="filters">
                  <button
                    type="button"
                    className={`filter-pill ${filter === "todas" ? "filter-pill--active" : ""}`}
                    onClick={() => setFilter("todas")}
                  >
                    Todas ({totals.todas})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${filter === "disponibles" ? "filter-pill--active" : ""}`}
                    onClick={() => setFilter("disponibles")}
                  >
                    Disponibles ({totals.disponibles})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${filter === "ocupadas" ? "filter-pill--active" : ""}`}
                    onClick={() => setFilter("ocupadas")}
                  >
                    Ocupadas ({totals.ocupadas})
                  </button>
                </div>

                <div className="legend">
                  <span><i className="dot dot--verde" /> Disponible</span>
                  <span><i className="dot dot--rojo" /> Ocupada</span>
                  <ConexionEstadoBadge mode={mode} />
                </div>
              </div>

              {loading ? (
                <div className="mesa-grid">
                  {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <MesaSkeleton key={index} />
                  ))}
                </div>
              ) : mesasFiltradas.length === 0 ? (
                <div className="empty-state">
                  <h2>No hay mesas disponibles</h2>
                  <p>No se encontraron mesas para mostrar en este momento.</p>
                </div>
              ) : (
                <div className="mesa-grid">
                  {mesasFiltradas.map((mesa) => (
                    <MesaCard
                      key={mesa.id}
                      mesa={mesa}
                      rol={rol}
                      now={now}
                      isOpening={openingId === mesa.id}
                      onAbrirMesa={handleAbrirMesa}
                      onAsignarMesero={handleAsignarMesero}
                    />
                  ))}
                </div>
              )}

              <div className="pagination">
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>
                <span>Página {page} de {totalPages}</span>
                <button
                  type="button"
                  disabled={page === totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </section>

        {toast && <Toast message={toast} />}

        {assigningMesa && (
          <AsignarMeseroModal
            mesa={assigningMesa}
            onClose={() => setAssigningMesa(null)}
            onSuccess={handleAssignmentSuccess}
            onError={handleAssignmentError}
          />
        )}
      </main>
    </div>
  );
}
