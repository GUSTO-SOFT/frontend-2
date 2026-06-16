import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { AlertasBanner } from "../components/AlertasBanner";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { cocinaService } from "../services/cocinaService";
import { confirmarEntrega, updateEstadoPedido } from "../services/pedidosService";
import type { Pedido } from "../types";

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "En preparacion",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
};

export function CocinaPage() {
  const { rol } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const canManageKitchen = rol === "ADMIN" || rol === "CHEF";
  const canConfirmDelivery = rol === "ADMIN" || rol === "MESERO";

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cocinaService.getPedidos();
      const sorted = [...data].sort((a, b) => (b.hace_minutos ?? 0) - (a.hace_minutos ?? 0));
      setPedidos(sorted);
    } catch (err: any) {
      const status = err.response?.status;
      setError(status === 403 ? "No tienes permisos para ver estos pedidos." : err.response?.data?.message || "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = window.setInterval(fetchPedidos, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    if (!canManageKitchen) return;

    try {
      await updateEstadoPedido(id, nuevoEstado);
      await fetchPedidos();

      if (nuevoEstado === "LISTO") {
        setToast({ message: "Pedido marcado como listo. Notificando al mesero...", type: "success" });
        window.setTimeout(() => setToast(null), 3000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al actualizar pedido";
      setToast({ message: msg, type: "error" });
      window.setTimeout(() => setToast(null), 5000);
    }
  };

  const handleConfirmarEntrega = async (id: number) => {
    if (!canConfirmDelivery) return;

    try {
      await confirmarEntrega(id);
      await fetchPedidos();
      setToast({ message: "Entrega confirmada correctamente.", type: "success" });
      window.setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "No se pudo confirmar la entrega.";
      setToast({ message: msg, type: "error" });
      window.setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <h1>{canManageKitchen ? "Cocina - Pedidos en preparacion" : "Estado de mis pedidos"}</h1>
          <button className="primary-button" style={{ width: "auto" }} onClick={fetchPedidos}>
            Actualizar
          </button>
        </header>

        <div className="content">
          {canManageKitchen ? <AlertasBanner /> : null}
          {error && <div className="form-error">{error}</div>}

          {loading && pedidos.length === 0 ? (
            <p>Cargando pedidos...</p>
          ) : (
            <div className="kds-grid">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className={`kds-card ${pedido.resaltar_por_antiguedad ? "urgente" : ""}`}>
                  <div className="kds-card__header">
                    <h3>Mesa {pedido.mesa_numero}</h3>
                    <span className={pedido.resaltar_por_antiguedad ? "kds-card__time kds-card__time--late" : "kds-card__time"}>
                      {pedido.hace_minutos ?? 0} min
                    </span>
                  </div>

                  <p>
                    <strong>Mesero:</strong> {pedido.mesero_nombre}
                  </p>
                  <p>
                    <strong>Estado:</strong> {ESTADO_LABELS[pedido.estado] ?? pedido.estado}
                  </p>

                  <hr />

                  <ul className="kds-card__items">
                    {pedido.detalles.map((detalle) => (
                      <li key={detalle.id}>
                        <strong>{detalle.cantidad}x</strong> {detalle.producto_nombre}
                        {detalle.notas ? <div className="kds-note">NOTA: {detalle.notas}</div> : null}
                      </li>
                    ))}
                  </ul>

                  {canManageKitchen ? (
                    <div className="kds-card__actions">
                      {pedido.estado === "PENDIENTE" && (
                        <button className="primary-button" onClick={() => handleUpdateEstado(pedido.id, "EN_PREPARACION")}>
                          Preparar
                        </button>
                      )}
                      {pedido.estado === "EN_PREPARACION" && (
                        <button className="primary-button" onClick={() => handleUpdateEstado(pedido.id, "LISTO")}>
                          Listo
                        </button>
                      )}
                    </div>
                  ) : null}
                  {!canManageKitchen && canConfirmDelivery && pedido.estado === "LISTO" ? (
                    <div className="kds-card__actions">
                      <button className="primary-button" onClick={() => handleConfirmarEntrega(pedido.id)}>
                        Confirmar entrega
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}

              {pedidos.length === 0 && !loading && (
                <p>{canManageKitchen ? "No hay pedidos pendientes en cocina." : "No tienes pedidos pendientes en cocina."}</p>
              )}
            </div>
          )}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </main>
    </div>
  );
}
