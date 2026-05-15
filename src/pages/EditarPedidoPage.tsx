import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { getPedido } from "../services/pedidosService";
import { formatCurrency } from "../utils/format";
import type { Pedido } from "../types";

type Props = {
  pedidoId: number;
  onVolverMesas: () => void;
};

export function EditarPedidoPage({ pedidoId, onVolverMesas }: Props) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setLoading(true);
      try {
        const data = await getPedido(pedidoId);
        if (isMounted) setPedido(data);
      } catch {
        if (isMounted) setToast("No se pudo cargar el pedido creado.");
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
              </>
            )}
          </div>
        </section>

        {toast && <Toast message={toast} />}
      </main>
    </div>
  );
}
