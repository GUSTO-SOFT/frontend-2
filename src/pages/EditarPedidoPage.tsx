import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { EnviarPedidoButton } from "../components/EnviarPedidoButton";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { LineaDetallePedido } from "../components/LineaDetallePedido";
import { getProductosActivos } from "../services/menuService";
import {
  actualizarDetallesPedido,
  confirmarEntrega,
  enviarPedido,
  getPedido,
} from "../services/pedidosService";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../utils/format";
import type { ApiErrorBody, Pedido, Producto } from "../types";

type Props = {
  pedidoId: number;
  onVolverMesas: () => void;
};

type LineaDetalle = {
  producto_id: number;
  cantidad: number;
  notas: string;
  notasTouched: boolean;
};

export function EditarPedidoPage({ pedidoId, onVolverMesas }: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [detalles, setDetalles] = useState<LineaDetalle[]>([]);
  const [erroresCantidadPorLinea, setErroresCantidadPorLinea] = useState<(string | null)[]>([]);
  const [erroresNotasPorLinea, setErroresNotasPorLinea] = useState<(string | null)[]>([]);
  const [notasOriginalPorProducto, setNotasOriginalPorProducto] = useState<Map<number, string>>(
    new Map()
  );
  const [enviando, setEnviando] = useState(false);
  const [enviandoEnvio, setEnviandoEnvio] = useState(false);
  const [pedidoNoEditable, setPedidoNoEditable] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const { rol } = useAuth();

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setLoading(true);
      try {
        const data = await getPedido(pedidoId);
        if (!isMounted) return;
        setPedido(data);
        setPedidoNoEditable(false);
        const nextNotasOriginal = new Map<number, string>();
        data.detalles.forEach((detalle) => {
          nextNotasOriginal.set(detalle.producto_id, detalle.notas ?? "");
        });
        setNotasOriginalPorProducto(nextNotasOriginal);

        const detallesIniciales = data.detalles.map((detalle) => ({
          producto_id: detalle.producto_id,
          whitespace: false,
          cantidad: detalle.cantidad,
          notas: detalle.notas ?? "",
          notasTouched: false,
        }));
        setDetalles(detallesIniciales);
        setErroresCantidadPorLinea(new Array(detallesIniciales.length).fill(null));
        setErroresNotasPorLinea(new Array(detallesIniciales.length).fill(null));
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
      notas: detalle.notas ?? "",
      notasTouched: false,
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
    setErroresCantidadPorLinea((prev) => prev.map((error, i) => (i === index ? null : error)));
  }

  function actualizarNotas(index: number, notas: string) {
    setDetalles((prev) =>
      prev.map((linea, i) => {
        if (i !== index) return linea;
        const original = notasOriginalPorProducto.get(linea.producto_id) ?? "";
        return { ...linea, notas, notasTouched: notas !== original };
      })
    );
    setErroresNotasPorLinea((prev) => prev.map((error, i) => (i === index ? null : error)));
  }

  function agregarProducto(productoId: number) {
    setDetalles((prev) => {
      const index = prev.findIndex((linea) => linea.producto_id === productoId);
      if (index >= 0) {
        return prev.map((linea, i) =>
          i === index ? { ...linea, cantidad: linea.cantidad + 1 } : linea
        );
      }
      return [...prev, { producto_id: productoId, cantidad: 1, notas: "", notasTouched: false }];
    });
    setErroresCantidadPorLinea((prev) => [...prev, null]);
    setErroresNotasPorLinea((prev) => [...prev, null]);
  }

  function validarLineas(lineas: LineaDetalle[]) {
    const nextCantidadErrors: (string | null)[] = new Array(lineas.length).fill(null);
    const nextNotasErrors: (string | null)[] = new Array(lineas.length).fill(null);
    let ok = true;

    lineas.forEach((linea, index) => {
      if (!Number.isInteger(linea.cantidad)) {
        nextCantidadErrors[index] = "Cantidad debe ser un entero.";
        ok = false;
      }

      if (linea.cantidad <= 0) {
        nextCantidadErrors[index] = "Cantidad debe ser mayor a 0.";
        ok = false;
      }

      if (linea.notas.length > 255) {
        nextNotasErrors[index] = "Maximo 255 caracteres.";
        ok = false;
      }
    });

    setErroresCantidadPorLinea(nextCantidadErrors);
    setErroresNotasPorLinea(nextNotasErrors);
    return ok;
  }

  function extraerIndiceDeMensaje(msg: string) {
    const match = msg.match(/detalles[\.\[](\d+)/i);
    if (!match) return null;
    const index = Number(match[1]);
    if (!Number.isFinite(index)) return null;
    return index;
  }

  function extraerCampoDeMensaje(msg: string) {
    const match = msg.match(/detalles[\.\[]\d+[\]\.]([a-zA-Z_]+)/);
    if (!match) return null;
    return match[1]?.toLowerCase() ?? null;
  }

  function aplicarErroresBackend(message: string | string[] | undefined) {
    if (!message) return;
    if (typeof message === "string") {
      setToast({ message, type: "error" });
      return;
    }

    if (message.length === 0) return;

    const nextCantidadErrors: (string | null)[] = new Array(detalles.length).fill(null);
    const nextNotasErrors: (string | null)[] = new Array(detalles.length).fill(null);
    message.forEach((msg) => {
      const index = extraerIndiceDeMensaje(msg);
      if (index == null) return;
      if (index < 0 || index >= nextCantidadErrors.length) return;
      const campo = extraerCampoDeMensaje(msg);
      if (campo === "notas") {
        nextNotasErrors[index] = msg;
      } else {
        nextCantidadErrors[index] = msg;
      }
    });

    const tieneErroresAsignados =
      nextCantidadErrors.some(Boolean) || nextNotasErrors.some(Boolean);
    if (tieneErroresAsignados) {
      setErroresCantidadPorLinea(nextCantidadErrors);
      setErroresNotasPorLinea(nextNotasErrors);
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
      const detallesPayload = detalles.map((linea) => {
        const base = { producto_id: linea.producto_id, cantidad: linea.cantidad };
        if (!linea.notasTouched) return base;
        const normalizada = linea.notas.trim();
        return { ...base, notas: normalizada.length === 0 ? null : normalizada };
      });

      const data = await actualizarDetallesPedido(pedidoId, { detalles: detallesPayload });
      setPedido(data);
      setToast({ message: "Pedido actualizado correctamente.", type: "success" });
      setPedidoNoEditable(false);
      const nextNotasOriginal = new Map<number, string>();
      data.detalles.forEach((detalle) => {
        nextNotasOriginal.set(detalle.producto_id, detalle.notas ?? "");
      });
      setNotasOriginalPorProducto(nextNotasOriginal);

      const detallesActualizados = data.detalles.map((detalle) => ({
        producto_id: detalle.producto_id,
        whitespace: false,
        cantidad: detalle.cantidad,
        notas: detalle.notas ?? "",
        notasTouched: false,
      }));
      setDetalles(detallesActualizados);
      setErroresCantidadPorLinea(new Array(detallesActualizados.length).fill(null));
      setErroresNotasPorLinea(new Array(detallesActualizados.length).fill(null));
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const code = error.response?.data?.error;
        const status = error.response?.status;

        if (status === 409 || code === "PEDIDO_NO_EDITABLE") {
          setPedidoNoEditable(true);
          setToast({ message: "Este pedido ya no puede editarse", type: "error" });
          return;
        }

        if (status === 422 || status === 400) {
          aplicarErroresBackend(error.response?.data?.message);
          if (code === "NOTAS_DEMASIADO_LARGAS") {
            setToast({ message: "Hay notas que superan el maximo permitido.", type: "error" });
            return;
          }
          return;
        }
      }

      setToast({ message: "No se pudo actualizar el pedido. Intenta nuevamente.", type: "error" });
    } finally {
      setEnviando(false);
    }
  }

  async function handleEnviarACocina() {
    if (!pedido) return;
    if (pedido.estado !== "BORRADOR" || pedidoNoEditable) {
      setToast({ message: "Este pedido ya fue enviado a cocina", type: "error" });
      return;
    }

    if (detalles.length === 0) {
      setToast({ message: "No puedes enviar un pedido sin productos", type: "error" });
      return;
    }

    setEnviandoEnvio(true);
    try {
      const data = await enviarPedido(pedidoId);
      setPedido(data);
      setToast({ message: "Pedido enviado a cocina correctamente", type: "success" });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as unknown as { code?: string; error?: string; message?: string };
        const code = data?.error ?? data?.code;

        if (status === 422 && code === "PEDIDO_SIN_ITEMS") {
          setToast({ message: "No puedes enviar un pedido sin productos", type: "error" });
          return;
        }

        if (status === 409 && code === "PEDIDO_YA_ENVIADO") {
          setPedidoNoEditable(true);
          setToast({ message: "Este pedido ya fue enviado a cocina", type: "error" });
          try {
            const refreshed = await getPedido(pedidoId);
            setPedido(refreshed);
          } catch {}
          return;
        }
      }

      setToast({ message: "No se pudo enviar el pedido. Intenta nuevamente.", type: "error" });
    } finally {
      setEnviandoEnvio(false);
    }
  }

  async function handleConfirmarEntrega() {
    if (!pedido) return;
    setUpdating(true);
    try {
      const data = await confirmarEntrega(pedidoId);
      setPedido(data);
      setToast({ message: "Entrega del pedido confirmada correctamente.", type: "success" });
    } catch {
      setToast({ message: "No se pudo confirmar la entrega del pedido.", type: "error" });
    } finally {
      setUpdating(false);
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
                      <div className="form-error">
                        {pedidoNoEditable || pedido.estado === "BORRADOR"
                          ? "Este pedido ya no puede editarse."
                          : "Pedido enviado a cocina. Ya no puede editarse."}
                      </div>
                      <div className="pedido-detalles-list">
                        {pedido.detalles.map((detalle) => (
                          <div key={detalle.id} className="pedido-detalle-item">
                            <div>
                              <strong>
                                {detalle.producto_nombre ?? `Producto ${detalle.producto_id}`}
                              </strong>
                              <span>{detalle.categoria ?? "Sin categoria"}</span>
                              {detalle.notas ? <em className="nota-especial">{detalle.notas}</em> : null}
                            </div>
                            <span>{detalle.cantidad} und.</span>
                            <strong>
                              {formatCurrency(detalle.precio ?? Number(detalle.precio_unitario ?? 0))}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {pedido.estado === "LISTO" && (rol === "MESERO" || rol === "ADMIN") && (
                        <div className="entrega-alert" style={{
                          marginTop: "20px",
                          padding: "20px",
                          background: "linear-gradient(135deg, #c3f5ca 0%, #e8fced 100%)",
                          border: "1px solid #007a2f",
                          borderRadius: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          alignItems: "start"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>🍽️</span>
                            <strong style={{ color: "#007a2f", fontSize: "1.1rem" }}>
                              ¡El pedido está listo para ser entregado!
                            </strong>
                          </div>
                          <p style={{ margin: 0, color: "#1e4620", fontSize: "0.95rem" }}>
                            Una vez que lleves los platos a la mesa, confirma la entrega para actualizar el estado del pedido a <strong>ENTREGADO</strong>.
                          </p>
                          <button
                            type="button"
                            className="primary-button"
                            style={{
                              marginTop: "4px",
                              boxShadow: "0 4px 12px rgba(0, 122, 47, 0.2)",
                              maxWidth: "280px"
                            }}
                            onClick={handleConfirmarEntrega}
                            disabled={updating}
                          >
                            {updating ? "Confirmando..." : "Confirmar Entrega ✅"}
                          </button>
                        </div>
                      )}

                      {pedido.estado === "ENTREGADO" && (
                        <div className="entrega-alert" style={{
                          marginTop: "20px",
                          padding: "20px",
                          background: "linear-gradient(135deg, #e4e8f0 0%, #f5f7fb 100%)",
                          border: "1px solid #cbd5e1",
                          borderRadius: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          alignItems: "start"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>✅</span>
                            <strong style={{ color: "#344054", fontSize: "1.1rem" }}>
                              Entrega Confirmada
                            </strong>
                          </div>
                          <p style={{ margin: 0, color: "#667085", fontSize: "0.95rem" }}>
                            Este pedido ya ha sido entregado exitosamente a la mesa.
                          </p>
                        </div>
                      )}
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
                          notas={linea.notas}
                          disabled={enviando}
                          errorCantidad={erroresCantidadPorLinea[index]}
                          errorNotas={erroresNotasPorLinea[index]}
                          onCantidadChange={(cantidad) => actualizarCantidad(index, cantidad)}
                          onNotasChange={(notas) => actualizarNotas(index, notas)}
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
                  <EnviarPedidoButton
                    visible={pedido.estado === "BORRADOR"}
                    detallesCount={detalles.length}
                    disabled={enviando || enviandoEnvio || detalles.some((linea) => linea.notas.length > 255)}
                    submitting={enviandoEnvio}
                    onConfirm={handleEnviarACocina}
                  />
                  <button
                    type="button"
                    className="primary-button guardar-pedido-btn"
                    onClick={handleGuardarCambios}
                    disabled={enviando || enviandoEnvio || detalles.some((linea) => linea.notas.length > 255)}
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