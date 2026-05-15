import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { LineaDetallePedido } from "../components/LineaDetallePedido";
import { getProductosActivos } from "../services/menuService";
import { actualizarDetallesPedido, getPedido } from "../services/pedidosService";
import { formatCurrency } from "../utils/format";
import type { ApiErrorBody, Pedido, Producto } from "../types";

type Props = {
  pedidoId: number;
  onVolverMesas: () => void;
};

type LineaDetalle = {
  producto_id: number;
  cantidad: number;
};

export function EditarPedidoPage({ pedidoId, onVolverMesas }: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [detalles, setDetalles] = useState<LineaDetalle[]>([]);
  const [erroresPorLinea, setErroresPorLinea] = useState<(string | null)[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [pedidoNoEditable, setPedidoNoEditable] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setLoading(true);
      try {
        const data = await getPedido(pedidoId);
        if (!isMounted) return;
        setPedido(data);
        setPedidoNoEditable(false);
        const detallesIniciales = data.detalles.map((detalle) => ({
          producto_id: detalle.producto_id,
          cantidad: detalle.cantidad,
        }));
        setDetalles(detallesIniciales);
        setErroresPorLinea(new Array(detallesIniciales.length).fill(null));
      } catch {
        if (isMounted) setToast({ message: "No se pudo cargar el pedido creado.", type: "error" });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pedidoId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    void (async () => {
      setLoadingProductos(true);
      try {
        const data = await getProductosActivos();
        setProductos(data.filter((producto) => producto.activo));
      } catch {
        setToast({ message: "No se pudo cargar el catalogo de productos.", type: "error" });
      } finally {
        setLoadingProductos(false);
      }
    })();
  }, []);

  const productosById = useMemo(() => {
    return new Map(productos.map((producto) => [producto.id, producto]));
  }, [productos]);

  const pedidoDetalleByProductoId = useMemo(() => {
    if (!pedido) return new Map<number, Pedido["detalles"][number]>();
    return new Map(pedido.detalles.map((detalle) => [detalle.producto_id, detalle]));
  }, [pedido]);

  const esEditable = useMemo(() => {
    if (!pedido) return false;
    if (pedidoNoEditable) return false;
    return pedido.estado === "BORRADOR";
  }, [pedido, pedidoNoEditable]);

  const total = useMemo(() => {
    if (!pedido) return 0;

    const lineas = esEditable ? detalles : pedido.detalles.map((detalle) => ({
      producto_id: detalle.producto_id,
      cantidad: detalle.cantidad,
    }));

    return lineas.reduce((acc, linea) => {
      const producto = productosById.get(linea.producto_id);
      const detalle = pedidoDetalleByProductoId.get(linea.producto_id);
      const precioRaw = producto?.precio ?? detalle?.precio ?? Number(detalle?.precio_unitario ?? 0);
      const precio = typeof precioRaw === "number" && Number.isFinite(precioRaw) ? precioRaw : 0;
      return acc + precio * linea.cantidad;
    }, 0);
  }, [detalles, esEditable, pedido, pedidoDetalleByProductoId, productosById]);

  const productosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter((producto) => producto.nombre.toLowerCase().includes(term));
  }, [busqueda, productos]);

  function actualizarCantidad(index: number, cantidad: number) {
    setDetalles((prev) => prev.map((linea, i) => (i === index ? { ...linea, cantidad } : linea)));
    setErroresPorLinea((prev) => prev.map((error, i) => (i === index ? null : error)));
  }

  function agregarProducto(productoId: number) {
    setDetalles((prev) => {
      const index = prev.findIndex((linea) => linea.producto_id === productoId);
      if (index >= 0) {
        return prev.map((linea, i) =>
          i === index ? { ...linea, cantidad: linea.cantidad + 1 } : linea
        );
      }
      return [...prev, { producto_id: productoId, cantidad: 1 }];
    });
    setErroresPorLinea((prev) => [...prev, null]);
  }

  function validarLineas(lineas: LineaDetalle[]) {
    const nextErrors: (string | null)[] = new Array(lineas.length).fill(null);
    let ok = true;

    lineas.forEach((linea, index) => {
      if (!Number.isInteger(linea.cantidad)) {
        nextErrors[index] = "Cantidad debe ser un entero.";
        ok = false;
        return;
      }

      if (linea.cantidad <= 0) {
        nextErrors[index] = "Cantidad debe ser mayor a 0.";
        ok = false;
      }
    });

    setErroresPorLinea(nextErrors);
    return ok;
  }

  function extraerIndiceDeMensaje(msg: string) {
    const match = msg.match(/detalles[\.\[](\d+)/i);
    if (!match) return null;
    const index = Number(match[1]);
    if (!Number.isFinite(index)) return null;
    return index;
  }

  function aplicarErroresBackend(message: string | string[] | undefined) {
    if (!message) return;
    if (typeof message === "string") {
      setToast({ message, type: "error" });
      return;
    }

    if (message.length === 0) return;

    const nextErrors: (string | null)[] = new Array(detalles.length).fill(null);
    message.forEach((msg) => {
      const index = extraerIndiceDeMensaje(msg);
      if (index == null) return;
      if (index < 0 || index >= nextErrors.length) return;
      nextErrors[index] = msg;
    });

    const tieneErroresAsignados = nextErrors.some(Boolean);
    if (tieneErroresAsignados) {
      setErroresPorLinea(nextErrors);
      return;
    }

    setToast({ message: message.join(" | "), type: "error" });
  }

  async function handleGuardarCambios() {
    if (!pedido) return;

    if (pedido.estado !== "BORRADOR" || pedidoNoEditable) {
      setToast({ message: "Este pedido ya no puede editarse", type: "error" });
      return;
    }

    if (!validarLineas(detalles)) {
      return;
    }

    setEnviando(true);
    try {
      const data = await actualizarDetallesPedido(pedidoId, { detalles });
      setPedido(data);
      setToast({ message: "Pedido actualizado correctamente.", type: "success" });
      setPedidoNoEditable(false);
      setErroresPorLinea(new Array(detalles.length).fill(null));
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const code = error.response?.data?.error;
        const status = error.response?.status;

        if (status === 409 || code === "PEDIDO_NO_EDITABLE") {
          setPedidoNoEditable(true);
          setToast({ message: "Este pedido ya no puede editarse", type: "error" });
          return;
        }

        if (status === 400) {
          aplicarErroresBackend(error.response?.data?.message);
          if (!Array.isArray(error.response?.data?.message)) {
            setToast({ message: "Revisa las cantidades ingresadas.", type: "error" });
          }
          return;
        }
      }

      setToast({ message: "No se pudo actualizar el pedido. Intenta nuevamente.", type: "error" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel">
        <header className="topbar">
          <h1>Pedido #{pedidoId}</h1>
          <div />
          <div className="session-user">
            <button type="button" className="secondary-button" onClick={onVolverMesas}>
              Volver a mesas
            </button>
          </div>
        </header>

        <section className="content">
          <div className="crear-pedido-layout">
            <div className="pedido-card pedido-resumen">
            {loading ? (
              <p className="mesa-muted">Cargando pedido...</p>
            ) : !pedido ? (
              <div className="empty-state">
                <h2>Pedido no disponible</h2>
                <p>Intenta volver a mesas y abrir el pedido nuevamente.</p>
              </div>
            ) : (
              <>
                <div className="pedido-resumen__header">
                  <div>
                    <span className="mesa-muted">Mesa</span>
                    <strong>{pedido.mesa_numero ?? pedido.mesa_id}</strong>
                  </div>
                  <div>
                    <span className="mesa-muted">Estado</span>
                    <strong>{pedido.estado}</strong>
                  </div>
                  <div>
                    <span className="mesa-muted">Total</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>

                {!esEditable && (
                  <>
                    <div className="form-error">Este pedido ya no puede editarse.</div>
                    <div className="pedido-detalles-list">
                      {pedido.detalles.map((detalle) => (
                        <div key={detalle.id} className="pedido-detalle-item">
                          <div>
                            <strong>
                              {detalle.producto_nombre ?? `Producto ${detalle.producto_id}`}
                            </strong>
                            <span>{detalle.categoria ?? "Sin categoria"}</span>
                          </div>
                          <span>{detalle.cantidad} und.</span>
                          <strong>
                            {formatCurrency(detalle.precio ?? Number(detalle.precio_unitario ?? 0))}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {!loading && pedido && esEditable && (
            <>
              <div className="pedido-card">
                <h2>Editar productos (BORRADOR)</h2>

                <div className="detalle-header">
                  <span>Producto</span>
                  <span>Categoria</span>
                  <span>Precio</span>
                  <span>Cantidad</span>
                  <span />
                </div>

                {detalles.length === 0 ? (
                  <div className="empty-state">
                    <p>No hay lineas de detalle en este pedido.</p>
                  </div>
                ) : (
                  detalles.map((linea, index) => {
                    const producto = productosById.get(linea.producto_id);
                    const detalle = pedidoDetalleByProductoId.get(linea.producto_id);
                    const productoNombre =
                      producto?.nombre ??
                      detalle?.producto_nombre ??
                      `Producto ${linea.producto_id}`;
                    const categoria = producto?.categoria ?? detalle?.categoria ?? "Sin categoria";
                    const precioRaw =
                      producto?.precio ?? detalle?.precio ?? Number(detalle?.precio_unitario ?? 0);
                    const precio =
                      typeof precioRaw === "number" && Number.isFinite(precioRaw) ? precioRaw : null;

                    return (
                      <LineaDetallePedido
                        key={`${linea.producto_id}-${index}`}
                        productoNombre={productoNombre}
                        categoria={categoria}
                        precio={precio}
                        cantidad={linea.cantidad}
                        disabled={enviando}
                        error={erroresPorLinea[index]}
                        onCantidadChange={(cantidad) => actualizarCantidad(index, cantidad)}
                      />
                    );
                  })
                )}
              </div>

              <div className="pedido-card">
                <h2>Catalogo de productos</h2>

                <div className="catalogo-actions">
                  <div className="search catalogo-search">
                    <span>Buscar</span>
                    <input
                      value={busqueda}
                      onChange={(event) => setBusqueda(event.target.value)}
                      placeholder="Busca un producto..."
                      disabled={loadingProductos || enviando}
                    />
                  </div>
                </div>

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
                      <span>En pedido</span>
                      <span />
                    </div>

                    {productosFiltrados.map((producto) => {
                      const existente = detalles.find((linea) => linea.producto_id === producto.id);
                      return (
                        <div key={producto.id} className="detalle-row">
                          <div className="detalle-producto">
                            <strong>{producto.nombre}</strong>
                          </div>
                          <span className="detalle-categoria">{producto.categoria}</span>
                          <span className="detalle-precio">{formatCurrency(producto.precio)}</span>
                          <span className="detalle-en-pedido">
                            {existente ? `${existente.cantidad} und.` : "-"}
                          </span>
                          <button
                            type="button"
                            className="accion-linea accion-linea--agregar"
                            disabled={enviando}
                            onClick={() => agregarProducto(producto.id)}
                            title="Agregar producto"
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="pedido-actions">
                <button
                  type="button"
                  className="primary-button guardar-pedido-btn"
                  onClick={handleGuardarCambios}
                  disabled={enviando}
                >
                  {enviando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
          </div>
        </section>

        {toast && <Toast message={toast.message} type={toast.type} />}
      </main>
    </div>
  );
}
