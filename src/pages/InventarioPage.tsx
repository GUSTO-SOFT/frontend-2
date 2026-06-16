import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { ListaIngredientes } from "../components/ListaIngredientes";
import { AlertasBanner } from "../components/AlertasBanner";
import { getIngredientes } from "../services/inventarioService";
import type { Ingrediente } from "../types";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const PAGE_SIZE = 10;

export function InventarioPage() {
  const { usuario, rol } = useAuth();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (rol === "ADMIN") {
      fetchIngredientes(page);
    } else {
      setLoading(false);
    }
  }, [page, rol]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchIngredientes = async (nextPage: number) => {
    setLoading(true);
    try {
      const response = await getIngredientes({ page: nextPage, limit: PAGE_SIZE });
      setIngredientes(response.data);
      setTotalPages(response.meta.total_pages);
      setTotalItems(response.meta.total);
    } catch (error) {
      console.error(error);
      setToast({ message: "No se pudo cargar el inventario", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (rol !== "ADMIN" && rol !== "CHEF") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <section className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo administradores y chefs pueden acceder a inventario.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const isAdmin = rol === "ADMIN";
  const isChef = rol === "CHEF";
  const isAlertasView = window.location.hash === "#inventario/alertas";

  const stats = {
    total: totalItems,
    activos: ingredientes.filter(i => i.activo).length,
    inactivos: ingredientes.filter(i => i.activo === false).length,
    bajoStock: ingredientes.filter(i => {
      const actual = Number(i.stock_actual ?? (i as any).stockActual ?? 0);
      const minimo = Number(i.stock_minimo ?? (i as any).stockMinimo ?? 0);
      return actual <= minimo;
    }).length
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>Gestión de inventario</h1>
            <p className="topbar__subtitle">Existencias, alertas y movimientos del restaurante.</p>
          </div>
          <div className="session-user"><strong>{usuario?.nombre}</strong><span>{rol}</span></div>
        </header>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <section className="content">
          <div className="page-stack">
            {isAlertasView ? <AlertasBanner mode="page" /> : null}
            {isAlertasView ? null : !isChef ? (
              <>
                <div className="page-actions">
                  <p className="page-intro">Gestión de existencias en tiempo real.</p>
                  {isAdmin && (
                    <button type="button" onClick={() => { window.location.hash = "#inventario/nuevo"; }} className="primary-button primary-button--brand">
                      Agregar ingrediente
                    </button>
                  )}
                </div>

                <div className="metric-grid">
                  {[
                    { label: "Total", value: stats.total, color: "#0f172a" },
                    { label: "Activos", value: stats.activos, color: "#047857" },
                    { label: "Bajo stock", value: stats.bajoStock, color: "#d97706", clickable: true }
                  ].map(s => (
                    <div
                      key={s.label}
                      onClick={s.clickable ? () => { window.location.hash = "#inventario/alertas"; } : undefined}
                      role={s.clickable ? "button" : undefined}
                      tabIndex={s.clickable ? 0 : undefined}
                      onKeyDown={s.clickable ? (e) => { if (e.key === "Enter" || e.key === " ") window.location.hash = "#inventario/alertas"; } : undefined}
                      className={`metric-card ${s.clickable ? "metric-card--clickable" : ""}`}
                    >
                      <span>{s.label}</span>
                      <strong style={{ color: s.color }}>{s.value}</strong>
                    </div>
                  ))}
                </div>

                <ListaIngredientes
                  ingredientes={ingredientes}
                  loading={loading}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={totalItems}
                  canAdjust={isAdmin}
                  onAjusteSuccess={(message) => setToast({ message, type: "success" })}
                  onRefresh={() => fetchIngredientes(page)}
                />
              </>
            ) : (
              <div className="panel panel--center">
                <p>Vista de alertas habilitada para Chef. La gestión completa requiere rol Administrador.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
