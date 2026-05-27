import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { ProductoAtributosCard } from "../components/ProductoAtributosCard";
import { IngredientesLista } from "../components/IngredientesLista";
import { getProducto } from "../services/menuService";
import type { ApiErrorBody, Producto } from "../types";

type Props = {
  productoId: number;
  onVolver: () => void;
};

export function ProductoDetallePage({ productoId, onVolver }: Props) {
  const { usuario, rol } = useAuth();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const data = await getProducto(productoId);
        if (mounted) setProducto(data);
      } catch (error) {
        if (axios.isAxiosError<ApiErrorBody>(error)) {
          const status = error.response?.status;
          if (status === 404) {
            if (mounted) setToast("Producto no encontrado.");
          } else if (status === 403) {
            if (mounted) setToast("No tienes permisos para ver este producto.");
          } else if (mounted) {
            setToast("No se pudo cargar el detalle del producto.");
          }
        } else if (mounted) {
          setToast("No se pudo cargar el detalle del producto.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [productoId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <div className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden ver el detalle de un producto.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <h1>Producto #{productoId}</h1>
          <div />
          <div className="session-user">
            <button type="button" className="secondary-button" onClick={onVolver}>
              Volver
            </button>
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        <section className="content">
          {loading ? (
            <p className="mesa-muted">Cargando producto...</p>
          ) : !producto ? (
            <div className="empty-state">
              <h2>Producto no disponible</h2>
              <p>Intenta volver al menú y abrir el producto nuevamente.</p>
            </div>
          ) : (
            <div className="crear-pedido-layout">
              <ProductoAtributosCard producto={producto} />
              <IngredientesLista ingredientes={producto.ingredientes ?? []} />
            </div>
          )}
        </section>

        {toast && <Toast message={toast} />}
      </main>
    </div>
  );
}

