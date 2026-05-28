import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { ListaIngredientes } from "../components/ListaIngredientes";
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
    fetchIngredientes(page);
  }, [page]);

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

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <section className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden acceder a inventario.</p>
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
        <header className="topbar" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0 }}>Gestión de inventario</h1>            
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <section className="content">
          <div style={{ display: "grid", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <p style={{ margin: 0, color: "#667085", fontSize: "0.95rem" }}>
                Gestión de existencias en tiempo real para cocina central.
              </p>
              <button
                type="button"
                onClick={() => { window.location.hash = "#inventario/nuevo"; }}
                style={{
                  background: "#d1141f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px 22px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Agregar ingrediente
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "18px" }}>
              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700 }}>
                  Total ingredientes
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>{totalItems}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700 }}>
                  Activos en página
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#047857" }}>{ingredientes.filter((ing) => ing.activo).length}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700 }}>
                  Inactivos en página
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#b91c1c" }}>{ingredientes.filter((ing) => ing.activo === false).length}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: "24px", padding: "22px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
                <span style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 700 }}>
                  Bajo stock
                </span>
                <div style={{ marginTop: "12px", fontSize: "2rem", fontWeight: 800, color: "#d97706" }}>
                  {ingredientes.filter((ing) => typeof ing.stock_actual === "number" && typeof ing.stock_minimo === "number" && ing.stock_actual <= ing.stock_minimo).length}
                </div>
              </div>
            </div>

            <ListaIngredientes
              ingredientes={ingredientes}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              onAjusteSuccess={(message) => setToast({ message, type: "success" })}
              onRefresh={() => fetchIngredientes(page)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
