import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { buildApiAssetUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { NotasInput } from "../components/NotasInput";
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
  notas: string;
};

const categorias = ["TODOS", "ENTRADA", "PLATO_FUERTE", "BEBIDA", "POSTRE"] as const;
const notasRapidas = ["Sin cebolla", "Sin salsa", "Sin queso", "Sin picante"];
const maxNotas = 255;

function getProductoImagen(producto: Producto) {
  const rawUrl = producto.imagen_url ?? null;
  return buildApiAssetUrl(rawUrl);
}

export function CrearPedidoPage({ mesa, onVolver, onPedidoCreado }: Props) {
  const { rol } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [detalles, setDetalles] = useState<LineaDetalle[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<(typeof categorias)[number]>("TODOS");
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

  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideCategoria = categoriaActiva === "TODOS" || producto.categoria === categoriaActiva;
      const coincideBusqueda = !query || producto.nombre.toLowerCase().includes(query);
      return coincideCategoria && coincideBusqueda;
    });
  }, [busqueda, categoriaActiva, productos]);

  const totalPedido = useMemo(() => {
    return detalles.reduce((total, detalle) => {
      const producto = productosById.get(detalle.producto_id);
      return total + (producto ? Number(producto.precio) * detalle.cantidad : 0);
    }, 0);
  }, [detalles, productosById]);

  const totalItems = useMemo(() => {
    return detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }, [detalles]);

  const notasInvalidas = useMemo(() => {
    return detalles.some((detalle) => detalle.notas.length > maxNotas);
  }, [detalles]);

  function getIngredientesSinStock(producto: Producto) {
    return (producto.ingredientes ?? []).filter((ingrediente) => Number(ingrediente.stock_actual ?? 1) <= 0);
  }

  function mostrarToast(message: string, type: "error" | "success" = "error") {
    setToast({ message, type });
  }

  function getCantidadProducto(productoId: number) {
    return detalles.find((detalle) => detalle.producto_id === productoId)?.cantidad ?? 0;
  }

  function agregarProducto(producto: Producto) {
    if (enviando) return;

    const ingredientesSinStock = getIngredientesSinStock(producto);
    if (ingredientesSinStock.length > 0) {
      mostrarToast(`Sin stock: ${ingredientesSinStock.map((ingrediente) => ingrediente.nombre).join(", ")}`);
      return;
    }

    setDetalles((prev) => {
      const existe = prev.some((detalle) => detalle.producto_id === producto.id);
      if (existe) {
        return prev.map((detalle) =>
          detalle.producto_id === producto.id
            ? { ...detalle, cantidad: detalle.cantidad + 1 }
            : detalle
        );
      }

      return [...prev, { producto_id: producto.id, cantidad: 1, notas: "" }];
    });
  }

  function actualizarCantidad(productoId: number, cantidad: number) {
    if (cantidad <= 0) {
      quitarProducto(productoId);
      return;
    }

    setDetalles((prev) =>
      prev.map((linea) => (linea.producto_id === productoId ? { ...linea, cantidad } : linea))
    );
  }

  function quitarProducto(productoId: number) {
    setDetalles((prev) => prev.filter((detalle) => detalle.producto_id !== productoId));
  }

  function actualizarNotas(productoId: number, notas: string) {
    setDetalles((prev) =>
      prev.map((linea) => (linea.producto_id === productoId ? { ...linea, notas } : linea))
    );
  }

  function agregarNotaRapida(productoId: number, nota: string) {
    setDetalles((prev) =>
      prev.map((linea) => {
        if (linea.producto_id !== productoId) return linea;
        if (linea.notas.includes(nota)) return linea;

        const separador = linea.notas.trim() ? ", " : "";
        return { ...linea, notas: `${linea.notas.trim()}${separador}${nota}` };
      })
    );
  }

  async function handleCrearPedido() {
    if (!mesaActiva) {
      mostrarToast("La mesa no esta activa, abre la mesa primero");
      return;
    }

    const lineasValidas = detalles.filter((detalle) => detalle.producto_id > 0 && detalle.cantidad > 0);

    if (lineasValidas.length === 0) {
      mostrarToast("Agrega al menos un producto antes de crear el pedido.");
      return;
    }

    if (notasInvalidas) {
      mostrarToast(`Las notas no pueden superar ${maxNotas} caracteres.`);
      return;
    }

    setEnviando(true);

    try {
      const pedido = await crearPedido({
        mesa_id: mesa.id,
        detalles: lineasValidas.map((linea) => ({
          producto_id: linea.producto_id,
          cantidad: linea.cantidad,
          notas: linea.notas.trim() || null,
        })),
      });
      mostrarToast("Pedido creado correctamente.", "success");
      onPedidoCreado(pedido.id);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const code = error.response?.data?.code ?? error.response?.data?.error;
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (code === "MESA_NO_ACTIVA") {
          mostrarToast("La mesa no esta activa, abre la mesa primero");
          return;
        }
        if (code === "PRODUCTO_NO_DISPONIBLE") {
          mostrarToast("Uno o mas productos no estan disponibles");
          return;
        }
        if (code === "STOCK_INSUFICIENTE") {
          mostrarToast(typeof message === "string" ? message : "No hay stock suficiente para este pedido.");
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
              <div className="pedido-mesa-info pedido-mesa-info--pos">
                <span className={`estado-badge estado-badge--${mesa.estado_color}`}>
                  {mesa.estado}
                </span>
                <p className="mesa-muted">
                  {mesa.mesero_nombre ? `Mesero: ${mesa.mesero_nombre}` : "Sin mesero asignado"}
                </p>
                <strong className="pedido-items-badge">{totalItems} items</strong>
              </div>

              {!mesaActiva && (
                <div className="form-error">
                  La mesa no esta activa, abre la mesa primero.
                </div>
              )}

              <div className="pedido-pos-grid">
                <section className="pedido-catalogo-panel">
                  <div className="pedido-catalogo-toolbar">
                    <label className="search pedido-search">
                      <span>Buscar producto</span>
                      <input
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                        placeholder="Buscar producto"
                        disabled={enviando}
                      />
                    </label>

                    <div className="pedido-category-strip" aria-label="Categorias">
                      {categorias.map((categoria) => (
                        <button
                          key={categoria}
                          type="button"
                          className={`pedido-category-button ${
                            categoriaActiva === categoria ? "pedido-category-button--active" : ""
                          }`}
                          onClick={() => setCategoriaActiva(categoria)}
                          disabled={enviando}
                        >
                          {categoria === "TODOS" ? "Todos" : categoria.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingProductos ? (
                    <div className="pedido-products-grid">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="pedido-product-card pedido-product-card--loading">
                          <div className="skeleton pedido-product-skeleton-img" />
                          <div className="skeleton skeleton-line" />
                          <div className="skeleton skeleton-button" />
                        </div>
                      ))}
                    </div>
                  ) : productos.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay productos disponibles en este momento.</p>
                    </div>
                  ) : productosFiltrados.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay productos para este filtro.</p>
                    </div>
                  ) : (
                    <div className="pedido-products-grid">
                      {productosFiltrados.map((producto) => {
                        const imagen = getProductoImagen(producto);
                        const cantidad = getCantidadProducto(producto.id);
                        const ingredientesSinStock = getIngredientesSinStock(producto);
                        const sinStock = ingredientesSinStock.length > 0;

                        return (
                          <button
                            key={producto.id}
                            type="button"
                            className={`pedido-product-card ${
                              cantidad > 0 ? "pedido-product-card--selected" : ""
                            }`}
                            onClick={() => agregarProducto(producto)}
                            disabled={enviando || sinStock}
                          >
                            <span className="pedido-product-image-wrap">
                              {imagen ? (
                                <img src={imagen} alt={producto.nombre} className="pedido-product-image" />
                              ) : (
                                <span className="menu-product-placeholder">Sin foto</span>
                              )}
                              {cantidad > 0 ? <strong className="pedido-product-count">{cantidad}</strong> : null}
                            </span>

                            <span className="pedido-product-info">
                              <strong>{producto.nombre}</strong>
                              <span>{producto.categoria.replace("_", " ")}</span>
                            </span>

                            <span className="pedido-product-footer">
                              <strong>{formatCurrency(producto.precio)}</strong>
                              <span>{sinStock ? "Sin stock" : "Agregar"}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <aside className="pedido-cart-panel">
                  <div className="pedido-cart-header">
                    <div>
                      <h2>Pedido</h2>
                      <p>Mesa {mesa.numero}</p>
                    </div>
                    <strong>{formatCurrency(totalPedido)}</strong>
                  </div>

                  <div className="pedido-cart-list">
                    {detalles.length === 0 ? (
                      <div className="pedido-cart-empty">
                        <strong>Selecciona productos</strong>
                      </div>
                    ) : (
                      detalles.map((linea) => {
                        const producto = productosById.get(linea.producto_id);
                        if (!producto) return null;

                        return (
                          <div key={linea.producto_id} className="pedido-cart-item">
                            <div className="pedido-cart-item-main">
                              <strong>{producto.nombre}</strong>
                              <span>{formatCurrency(producto.precio)} c/u</span>
                            </div>

                            <div className="pedido-qty-control">
                              <button
                                type="button"
                                onClick={() => actualizarCantidad(linea.producto_id, linea.cantidad - 1)}
                                disabled={enviando}
                                aria-label={`Restar ${producto.nombre}`}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={linea.cantidad}
                                disabled={enviando}
                                onChange={(event) =>
                                  actualizarCantidad(
                                    linea.producto_id,
                                    Math.max(1, Number(event.target.value) || 1)
                                  )
                                }
                                aria-label={`Cantidad de ${producto.nombre}`}
                              />
                              <button
                                type="button"
                                onClick={() => actualizarCantidad(linea.producto_id, linea.cantidad + 1)}
                                disabled={enviando}
                                aria-label={`Sumar ${producto.nombre}`}
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              className="pedido-remove-button"
                              onClick={() => quitarProducto(linea.producto_id)}
                              disabled={enviando}
                              aria-label={`Quitar ${producto.nombre}`}
                            >
                              x
                            </button>

                            <div className="pedido-cart-notes">
                              <NotasInput
                                value={linea.notas}
                                max={maxNotas}
                                disabled={enviando}
                                error={linea.notas.length > maxNotas ? `Maximo ${maxNotas} caracteres.` : null}
                                onChange={(notas) => actualizarNotas(linea.producto_id, notas)}
                              />
                              <div className="pedido-note-chips">
                                {notasRapidas.map((nota) => (
                                  <button
                                    key={nota}
                                    type="button"
                                    onClick={() => agregarNotaRapida(linea.producto_id, nota)}
                                    disabled={enviando || linea.notas.includes(nota)}
                                  >
                                    {nota}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pedido-cart-total">
                    <span>Total</span>
                    <strong>{formatCurrency(totalPedido)}</strong>
                  </div>

                  <button
                    type="button"
                    className="primary-button crear-pedido-btn"
                    onClick={handleCrearPedido}
                    disabled={enviando || loadingProductos || !mesaActiva || detalles.length === 0 || notasInvalidas}
                  >
                    {enviando ? "Creando pedido..." : "Crear Pedido"}
                  </button>
                </aside>
              </div>
            </div>
          )}
        </section>

        {toast && <Toast message={toast.message} type={toast.type} />}
      </main>
    </div>
  );
}
