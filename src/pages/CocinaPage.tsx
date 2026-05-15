import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { cocinaService } from "../services/cocinaService";
import type { Pedido } from "../types";

export function CocinaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cocinaService.getPedidos();
      // Asegurar que estén ordenados por antigüedad ASC (los más viejos primero)
      const sorted = [...data].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setPedidos(sorted);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    // Podríamos agregar un setInterval o WebSockets aquí
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    try {
      await cocinaService.updateEstadoPedido(id, nuevoEstado);
      await fetchPedidos();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al actualizar pedido");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <h1>Kitchen Display System (KDS)</h1>
          <button className="primary-button" style={{ width: "auto" }} onClick={fetchPedidos}>Actualizar</button>
        </header>

        <div className="content">
        {error && <div className="error-message">{error}</div>}
        
        {loading && pedidos.length === 0 ? (
          <p>Cargando pedidos...</p>
        ) : (
          <div className="kds-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
            {pedidos.map((pedido) => (
              <div 
                key={pedido.id} 
                className={`card kds-card ${pedido.resaltar_por_antiguedad ? 'urgente' : ''}`}
                style={{ 
                  borderTop: pedido.resaltar_por_antiguedad ? "4px solid red" : "4px solid var(--primary-color)",
                  backgroundColor: pedido.resaltar_por_antiguedad ? "#fff5f5" : "white"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <h3>Mesa {pedido.mesa_numero}</h3>
                  <span style={{ fontWeight: "bold", color: pedido.resaltar_por_antiguedad ? "red" : "inherit" }}>
                    {pedido.hace_minutos} min
                  </span>
                </div>
                
                <p><strong>Mesero:</strong> {pedido.mesero_nombre}</p>
                <p><strong>Estado:</strong> {pedido.estado}</p>
                
                <hr style={{ margin: "10px 0" }} />
                
                <ul style={{ paddingLeft: "20px", marginBottom: "15px" }}>
                  {pedido.detalles.map((detalle) => (
                    <li key={detalle.id} style={{ marginBottom: "8px" }}>
                      <strong>{detalle.cantidad}x</strong> {detalle.producto_nombre}
                      {detalle.notas && (
                        <div style={{ 
                          marginTop: "6px",
                          padding: "6px 10px",
                          backgroundColor: "#fff3cd",
                          borderLeft: "4px solid #ffc107",
                          color: "#856404",
                          fontWeight: "bold",
                          fontSize: "0.9em",
                          borderRadius: "4px",
                          display: "inline-block"
                        }}>
                          ⚠️ NOTA: {detalle.notas}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                  {pedido.estado === "PENDIENTE" && (
                    <button 
                      className="primary-button" 
                      style={{ flex: 1 }}
                      onClick={() => handleUpdateEstado(pedido.id, "EN_PREPARACION")}
                    >
                      Preparar
                    </button>
                  )}
                  {pedido.estado === "EN_PREPARACION" && (
                    <button 
                      className="primary-button" 
                      style={{ flex: 1, backgroundColor: "#28a745" }}
                      onClick={() => handleUpdateEstado(pedido.id, "LISTO")}
                    >
                      Listo
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {pedidos.length === 0 && !loading && (
              <p>No hay pedidos pendientes en cocina.</p>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
