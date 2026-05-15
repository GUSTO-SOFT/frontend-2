import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { getPedido, updateEstadoPedido } from "../services/pedidosService";

import { formatCurrency } from "../utils/format";
import type { Pedido } from "../types";

type Props = {
  pedidoId: number;
  onVolverMesas: () => void;
};

export function EditarPedidoPage({ pedidoId, onVolverMesas }: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);


  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setLoading(true);
      try {
        const data = await getPedido(pedidoId);
        if (isMounted) setPedido(data);
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

  const total = useMemo(() => {
    return pedido?.detalles.reduce((acc, detalle) => {
      const precio = detalle.precio ?? Number(detalle.precio_unitario ?? 0);
      return acc + precio * detalle.cantidad;
    }, 0) ?? 0;
  }, [pedido]);

  const handleConfirmarEntrega = async () => {
    if (!pedido) return;
    setUpdating(true);
    try {
      const updated = await updateEstadoPedido(pedido.id, "ENTREGADO");
      setPedido(updated);
      setToast({ message: "¡Entrega confirmada exitosamente!", type: "success" });
    } catch {
      setToast({ message: "Error al confirmar la entrega. Intentalo de nuevo.", type: "error" });
    } finally {
      setUpdating(false);
    }
  };


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

                <div className="pedido-detalles-list">
                  {pedido.detalles.map((detalle) => (
                    <div key={detalle.id} className="pedido-detalle-item">
                      <div>
                        <strong>{detalle.producto_nombre ?? `Producto ${detalle.producto_id}`}</strong>
                        <span>{detalle.categoria ?? "Sin categoria"}</span>
                      </div>
                      <span>{detalle.cantidad} und.</span>
                      <strong>{formatCurrency(detalle.precio ?? Number(detalle.precio_unitario ?? 0))}</strong>
                    </div>
                  ))}
                </div>

                {pedido.estado === "LISTO" && (
                  <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
                    <button
                      className="primary-button"
                      style={{ width: "100%", maxWidth: "300px", backgroundColor: "#067647" }}
                      onClick={handleConfirmarEntrega}
                      disabled={updating}
                    >
                      {updating ? "Confirmando..." : "Confirmar Entrega"}
                    </button>
                  </div>
                )}
              </>

            )}
          </div>
        </section>

        {toast && <Toast message={toast.message} type={toast.type} />}

      </main>
    </div>
  );
}
