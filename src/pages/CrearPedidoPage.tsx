import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Toast } from "../components/Toast";
import { Sidebar } from "../components/Sidebar";
import { getProductosActivos } from "../services/menuService";
import { crearPedido } from "../services/pedidosService";
import type { ApiErrorBody, Mesa, Producto } from "../types";

type Props = {
  mesa: Mesa;
  onVolver: () => void;
  onPedidoCreado: (pedidoId: number) => void;
};

type LineaDetalle = {
  producto_id: number;
  cantidad: number;
};

export function CrearPedidoPage({ mesa, onVolver, onPedidoCreado }: Props) {
  const { rol } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [detalles, setDetalles] = useState<LineaDetalle[]>([
    { producto_id: 0, cantidad: 1 },
  ]);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  // Guard de rol — solo MESERO o ADMIN
  const tieneAcceso = rol === "MESERO" || rol === "ADMIN";

  useEffect(() => {
    void (async () => {
      try {
        const data = await getProductosActivos();
        setProductos(data);
      } catch {
        mostrarToast("No se pudo cargar el catálogo de productos.", "error");
      } finally {
        setLoadingProductos(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  function mostrarToast(message: string, type: "error" | "success" = "error") {
    setToast({ message, type });
  }

  function agregarLinea() {
    setDetalles((prev) => [...prev, { producto_id: 0, cantidad: 1 }]);
  }

  function quitarLinea(index: number) {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  }

  function actualizarLinea(index: number, campo: keyof LineaDetalle, valor: number) {
    setDetalles((prev) =>
      prev.map((linea, i) => (i === index ? { ...linea, [campo]: valor } : linea))
    );
  }

  async function handleCrearPedido() {
    const lineasValidas = detalles.filter((d) => d.producto_id !== 0 && d.cantidad > 0);

    if (lineasValidas.length === 0) {
      mostrarToast("Agrega al menos un producto antes de crear el pedido.");
      return;
    }

    setEnviando(true);

    try {
      const pedido = await crearPedido({
        mesa_id: mesa.id,
        detalles: lineasValidas,
      });
      mostrarToast("Pedido creado correctamente.", "success");
      setTimeout(() => onPedidoCreado(pedido.id), 1000);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const code = error.response?.data?.error;
        const status = error.response?.status;

        if (code === "MESA_NO_ACTIVA") {
          mostrarToast("La mesa no esta activa, abre la mesa primero.");
          return;
        }
        if (code === "PRODUCTO_NO_DISPONIBLE") {
          mostrarToast("Uno o más productos no están disponibles.");
          return;
        }
        if (status === 403) {
          mostrarToast("No tienes permisos para realizar esta acción.");
          return;
        }
      }
      mostrarToast("No se pudo crear el pedido. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <header className="topbar">
          <h1>Nuevo Pedido — Mesa {mesa.numero}</h1>
          <div />
          <div className="session-user">
            <button type="button" className="secondary-button" onClick={onVolver}>
              ← Volver
            </button>
          </div>
        </header>

        <section className="content">
          {!tieneAcceso ? (
            <div className="empty-state">
              <h2>Sin permisos</h2>
              <p>No tienes permisos para crear pedidos.</p>
            </div>
          ) : (
            <div className="crear-pedido-layout">
              {/* Info de la mesa */}
              <div className="pedido-mesa-info">
                <span className={`estado-badge estado-badge--${mesa.estado_color}`}>
                  {mesa.estado}
                </span>
                <p className="mesa-muted">
                  {mesa.mesero_nombre ? `Mesero: ${mesa.mesero_nombre}` : "Sin mesero asignado"}
                </p>
              </div>

              {/* Catálogo / líneas de detalle */}
              <div className="pedido-card">
                <h2>Productos del pedido</h2>

                {loadingProductos ? (
                  <p className="mesa-muted">Cargando catálogo...</p>
                ) : productos.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay productos disponibles en este momento.</p>
                  </div>
                ) : (
                  <>
                    <div className="detalle-header">
                      <span>Producto</span>
                      <span>Categoría</span>
                      <span>Precio</span>
                      <span>Cantidad</span>
                      <span />
                    </div>

                    {detalles.map((linea, index) => {
                      const productoSeleccionado = productos.find(
                        (p) => p.id === linea.producto_id
                      );

                      return (
                        <div key={index} className="detalle-row">
                          <select
                            value={linea.producto_id}
                            onChange={(e) =>
                              actualizarLinea(index, "producto_id", Number(e.target.value))
                            }
                          >
                            <option value={0} disabled>
                              Selecciona un producto
                            </option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}
                              </option>
                            ))}
                          </select>

                          <span className="detalle-categoria">
                            {productoSeleccionado?.categoria ?? "—"}
                          </span>

                          <span className="detalle-precio">
                            {productoSeleccionado
                              ? `$${Number(productoSeleccionado.precio).toLocaleString("es-CO")}`
                              : "—"}
                          </span>

                          <input
                            type="number"
                            min={1}
                            value={linea.cantidad}
                            onChange={(e) =>
                              actualizarLinea(index, "cantidad", Math.max(1, Number(e.target.value)))
                            }
                            className="cantidad-input"
                          />

                          <button
                            type="button"
                            className="quitar-linea"
                            onClick={() => quitarLinea(index)}
                            disabled={detalles.length === 1}
                            title="Quitar línea"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="secondary-button agregar-linea-btn"
                      onClick={agregarLinea}
                    >
                      + Agregar producto
                    </button>
                  </>
                )}
              </div>

              {/* Botón crear pedido */}
              <div className="pedido-actions">
                <button
                  type="button"
                  className="primary-button crear-pedido-btn"
                  onClick={handleCrearPedido}
                  disabled={enviando || loadingProductos}
                >
                  {enviando ? "Creando pedido..." : "Crear Pedido"}
                </button>
              </div>
            </div>
          )}
        </section>

        {toast && <Toast message={toast.message} type={toast.type} />}
      </main>
    </div>
  );
}
