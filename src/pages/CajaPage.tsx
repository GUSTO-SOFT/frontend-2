import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { CerrarCuentaModal } from "../components/CerrarCuentaModal";
import { DescuentoModal } from "../components/DescuentoModal";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { cerrarCuenta, getCuentaMesa } from "../services/billingService";
import { getMesas } from "../services/mesasService";
import type { ApiErrorBody, Cuenta, Mesa } from "../types";
import { formatCurrency } from "../utils/format";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

function parseApiMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null;
  const data = error.response?.data;
  const message = data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" | ");
  return null;
}

export function CajaPage() {
  const { usuario, rol } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaId, setMesaId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [loadingMesas, setLoadingMesas] = useState(true);
  const [loadingCuenta, setLoadingCuenta] = useState(false);
  const [sinItems, setSinItems] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [showDescuentoModal, setShowDescuentoModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const canUseCaja = rol === "ADMIN" || rol === "CAJERO";

  const mesasFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    const ordered = [...mesas].sort((a, b) => {
      if (a.estado !== b.estado) return a.estado === "OCUPADA" ? -1 : 1;
      return a.numero - b.numero;
    });

    if (!term) return ordered;
    return ordered.filter((mesa) => String(mesa.numero).includes(term) || mesa.mesero_nombre?.toLowerCase().includes(term));
  }, [busqueda, mesas]);

  const mesaSeleccionada = useMemo(() => {
    const parsed = Number(mesaId);
    return mesas.find((mesa) => mesa.id === parsed) ?? null;
  }, [mesaId, mesas]);

  const cargarMesas = useCallback(async () => {
    setLoadingMesas(true);
    try {
      const response = await getMesas({ page: 1, limit: 100 });
      setMesas(response.data);
      if (!mesaId) {
        const firstOccupied = response.data.find((mesa) => mesa.estado === "OCUPADA");
        if (firstOccupied) setMesaId(String(firstOccupied.id));
      }
    } catch (error) {
      setToast({ message: parseApiMessage(error) ?? "No se pudieron cargar las mesas.", type: "error" });
    } finally {
      setLoadingMesas(false);
    }
  }, [mesaId]);

  const cargarCuenta = useCallback(async () => {
    const parsedMesaId = Number(mesaId);
    if (!Number.isFinite(parsedMesaId) || parsedMesaId <= 0) {
      setToast({ message: "Selecciona una mesa para consultar la cuenta.", type: "error" });
      return;
    }

    setLoadingCuenta(true);
    setSinItems(false);
    setCuenta(null);
    try {
      const data = await getCuentaMesa(parsedMesaId);
      setCuenta(data);
    } catch (error) {
      const code = axios.isAxiosError<ApiErrorBody>(error)
        ? error.response?.data?.code ?? error.response?.data?.error
        : null;
      if (code === "CUENTA_SIN_ITEMS") {
        setSinItems(true);
        return;
      }
      setToast({ message: parseApiMessage(error) ?? "No se pudo cargar la cuenta de la mesa.", type: "error" });
    } finally {
      setLoadingCuenta(false);
    }
  }, [mesaId]);

  useEffect(() => {
    if (!canUseCaja) return;
    void cargarMesas();
  }, [canUseCaja, cargarMesas]);

  useEffect(() => {
    if (!canUseCaja || !mesaId) return;
    void cargarCuenta();
  }, [canUseCaja, mesaId, cargarCuenta]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleCerrarCuenta() {
    if (!cuenta) return;

    setCerrando(true);
    try {
      const data = await cerrarCuenta(cuenta.id);
      setCuenta(data);
      setToast({ message: "Cuenta cerrada y factura generada correctamente.", type: "success" });
      setShowCerrarModal(false);
      await cargarMesas();
      if (data.factura?.id) {
        window.location.hash = `#factura-electronica/${data.factura.id}`;
      }
    } catch (error) {
      setToast({ message: parseApiMessage(error) ?? "No se pudo cerrar la cuenta.", type: "error" });
    } finally {
      setCerrando(false);
    }
  }

  if (!canUseCaja) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <section className="content">
            <div className="empty-state">
              <h2>Acceso denegado</h2>
              <p>Solo administradores y cajeros pueden acceder a caja.</p>
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
        <header className="topbar">
          <div>
            <h1>Caja</h1>
            <p className="topbar__subtitle">Busca una mesa, revisa el consumo y cobra la cuenta.</p>
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        <section className="content">
          <div className="caja-layout">
            <div className="pedido-card">
              <h2>Buscar mesa</h2>
              <div className="search catalogo-search">
                <span>Buscar</span>
                <input
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por numero de mesa o mesero..."
                />
              </div>

              <div className="caja-mesas-list">
                {loadingMesas ? (
                  <p className="mesa-muted">Cargando mesas...</p>
                ) : mesasFiltradas.length === 0 ? (
                  <p className="mesa-muted">No hay mesas para mostrar.</p>
                ) : (
                  mesasFiltradas.map((mesa) => (
                    <button
                      key={mesa.id}
                      type="button"
                      className={`caja-mesa-button ${String(mesa.id) === mesaId ? "caja-mesa-button--active" : ""}`}
                      onClick={() => {
                        setMesaId(String(mesa.id));
                        setCuenta(null);
                        setSinItems(false);
                      }}
                    >
                      <span>
                        <strong>Mesa {mesa.numero}</strong>
                        <small>{mesa.mesero_nombre ? `Mesero: ${mesa.mesero_nombre}` : "Sin mesero"}</small>
                      </span>
                      <span className={`estado-badge estado-badge--${mesa.estado_color}`}>{mesa.estado}</span>
                    </button>
                  ))
                )}
              </div>

              <button className="primary-button" type="button" onClick={cargarCuenta} disabled={loadingCuenta || !mesaId}>
                {loadingCuenta ? "Consultando..." : "Consultar cuenta"}
              </button>
            </div>

            <div className="pedido-card caja-cuenta-panel">
              <div className="caja-panel-header">
                <div>
                  <h2>{mesaSeleccionada ? `Cuenta - Mesa ${mesaSeleccionada.numero}` : "Cuenta"}</h2>
                  <p className="mesa-muted">Productos entregados y totales a cobrar.</p>
                </div>
                {cuenta ? <span className="estado-badge estado-badge--verde">{cuenta.estado}</span> : null}
              </div>

              {loadingCuenta ? (
                <div className="empty-state">
                  <p>Calculando cuenta...</p>
                </div>
              ) : sinItems ? (
                <div className="empty-state">
                  <h2>Sin productos entregados</h2>
                  <p>La mesa todavia no tiene pedidos entregados para cobrar.</p>
                </div>
              ) : !cuenta ? (
                <div className="empty-state">
                  <p>Selecciona una mesa y consulta la cuenta.</p>
                </div>
              ) : (
                <>
                  <div className="caja-items">
                    {cuenta.items.map((item) => (
                      <div className="caja-item" key={item.producto_id}>
                        <div>
                          <strong>{item.producto}</strong>
                          <span>
                            {item.cantidad} x {formatCurrency(item.precio_unitario)}
                          </span>
                        </div>
                        <strong>{formatCurrency(item.subtotal)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="caja-totals">
                    <div>
                      <span>Subtotal</span>
                      <strong>{formatCurrency(cuenta.total_bruto - cuenta.impuestos)}</strong>
                    </div>
                    <div>
                      <span>Impuestos</span>
                      <strong>{formatCurrency(cuenta.impuestos)}</strong>
                    </div>
                    <div>
                      <span>Total bruto</span>
                      <strong>{formatCurrency(cuenta.total_bruto)}</strong>
                    </div>
                    {cuenta.descuento > 0 ? (
                      <div className="caja-discount">
                        <span>Descuento{cuenta.descuento_motivo ? ` - ${cuenta.descuento_motivo}` : ""}</span>
                        <strong>-{formatCurrency(cuenta.descuento)}</strong>
                      </div>
                    ) : null}
                    <div className="caja-total-neto">
                      <span>Total a pagar</span>
                      <strong>{formatCurrency(cuenta.total_neto)}</strong>
                    </div>
                  </div>

                  {cuenta.estado === "ABIERTA" ? (
                    <div className="pedido-actions">
                      <button className="secondary-button" type="button" onClick={() => setShowDescuentoModal(true)} disabled={cerrando}>
                        Aplicar descuento
                      </button>
                      <button className="primary-button" type="button" onClick={() => setShowCerrarModal(true)} disabled={cerrando}>
                        {cerrando ? "Cerrando..." : "Cerrar y facturar"}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>

        {showDescuentoModal && cuenta ? (
          <DescuentoModal
            cuenta={cuenta}
            onClose={() => setShowDescuentoModal(false)}
            onSuccess={(updatedCuenta) => {
              setCuenta(updatedCuenta);
              setShowDescuentoModal(false);
              setToast({ message: "Descuento aplicado correctamente.", type: "success" });
            }}
            onError={(message) => setToast({ message, type: "error" })}
          />
        ) : null}

        {showCerrarModal && cuenta ? (
          <CerrarCuentaModal
            cuenta={cuenta}
            isLoading={cerrando}
            onClose={() => setShowCerrarModal(false)}
            onConfirm={handleCerrarCuenta}
          />
        ) : null}

        {toast && <Toast message={toast.message} type={toast.type} />}
      </main>
    </div>
  );
}
