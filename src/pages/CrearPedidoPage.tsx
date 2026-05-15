import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { getProductosActivos } from "../services/menuService";
import { crearPedido } from "../services/pedidosService";
import { formatCurrency } from "../utils/format";
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

  const tieneAcceso = rol === "MESERO" || rol === "ADMIN";
  const mesaActiva = mesa.estado === "OCUPADA";

  useEffect(() => {
    void (async () => {
      try {
        const data = await getProductosActivos();
        setProductos(data.filter((producto) => producto.activo));
      } catch {
        mostrarToast("No se pudo cargar el catalogo de productos.", "error");
      } finally {
        setLoadingProductos(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const productosById = useMemo(() => {
    return new Map(productos.map((producto) => [producto.id, producto]));
  }, [productos]);

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
    if (!mesaActiva) {
      mostrarToast("La mesa no esta activa, abre la mesa primero");
      return;
    }

    const lineasValidas = detalles.filter((detalle) => (
      detalle.producto_id > 0 && detalle.cantidad > 0
    ));

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
      window.setTimeout(() => onPedidoCreado(pedido.id), 700);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const code = error.response?.data?.error;
        const status = error.response?.status;

        if (code === "MESA_NO_ACTIVA") {
          mostrarToast("La mesa no esta activa, abre la mesa primero");
          return;
        }
        if (code === "PRODUCTO_NO_DISPONIBLE") {
          mostrarToast("Uno o mas productos no estan disponibles");
          return;
        }
        if (status === 403) {
          mostrarToast("No tienes permisos para crear pedidos.");
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
          <h1>Nuevo Pedido - Mesa {mesa.numero}</h1>
          <div />
          <div className="session-user">
            <button type="button" className="secondary-button" onClick={onVolver}>
              Volver
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
              <div className="pedido-mesa-info">
                <span className={`estado-badge estado-badge--${mesa.estado_color}`}>
                  {mesa.estado}
                </span>
                <p className="mesa-muted">
                  {mesa.mesero_nombre ? `Mesero: ${mesa.mesero_nombre}` : "Sin mesero asignado"}
                </p>
              </div>

              <div className="pedido-card">
                <h2>Productos del pedido</h2>

                {!mesaActiva && (
                  <div className="form-error">
                    La mesa no esta activa, abre la mesa primero.
                  </div>
                )}

                {loadingProductos ? (
                  <p className="mesa-muted">Cargando catalogo...</p>
                ) : productos.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay productos disponibles en este momento.</p>
                  </div>
                ) : (
                  <>
                    <div className="detalle-header">
                      <span>Producto</span>
                      <span>Categoria</span>
                      <span>Precio</span>
                      <span>Cantidad</span>
                      <span />
                    </div>

                    {detalles.map((linea, index) => {
                      const productoSeleccionado = productosById.get(linea.producto_id);

                      return (
                        <div key={`${index}-${linea.producto_id}`} className="detalle-row">
                          <select
                            value={linea.producto_id}
                            disabled={enviando}
                            onChange={(event) =>
                              actualizarLinea(index, "producto_id", Number(event.target.value))
                            }
                          >
                            <option value={0} disabled>
                              Selecciona un producto
                            </option>
                            {productos.map((producto) => (
                              <option key={producto.id} value={producto.id}>
                                {producto.nombre}
                              </option>
                            ))}
                          </select>

                          <span className="detalle-categoria">
                            {productoSeleccionado?.categoria ?? "-"}
                          </span>

                          <span className="detalle-precio">
                            {productoSeleccionado
                              ? formatCurrency(productoSeleccionado.precio)
                              : "-"}
                          </span>

                          <input
                            type="number"
                            min={1}
                            value={linea.cantidad}
                            disabled={enviando}
                            onChange={(event) =>
                              actualizarLinea(
                                index,
                                "cantidad",
                                Math.max(1, Number(event.target.value) || 1)
                              )
                            }
                            className="cantidad-input"
                          />

                          <button
                            type="button"
                            className="quitar-linea"
                            onClick={() => quitarLinea(index)}
                            disabled={detalles.length === 1 || enviando}
                            title="Quitar linea"
                          >
                            x
                          </button>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="secondary-button agregar-linea-btn"
                      onClick={agregarLinea}
                      disabled={enviando}
                    >
                      + Agregar producto
                    </button>
                  </>
                )}
              </div>

              <div className="pedido-actions">
                <button
                  type="button"
                  className="primary-button crear-pedido-btn"
                  onClick={handleCrearPedido}
                  disabled={enviando || loadingProductos || !mesaActiva}
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
