import { useEffect, useState } from "react";
import { getBloqueoProducto } from "../services/menuService";
import type { BloqueoProducto } from "../types";

export function BloqueoIndicator({ productoId }: { productoId: number }) {
  const [bloqueo, setBloqueo] = useState<BloqueoProducto | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchBloqueo = async () => {
    try {
      const data = await getBloqueoProducto(productoId);
      setBloqueo(data);
    } catch (error) {
      console.error("Error fetching blocking status:", error);
    }
  };

  useEffect(() => {
    fetchBloqueo();
    const interval = setInterval(fetchBloqueo, 15000); 
    return () => clearInterval(interval);
  }, [productoId]);

  if (!bloqueo?.bloqueado) return null;

  return (
    <div 
      style={{ position: "relative", display: "inline-block", marginLeft: "8px" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span style={{ 
        cursor: "help", 
        fontSize: "1.2rem", 
        color: "#ff4d4f",
        display: "flex",
        alignItems: "center"
      }}>
        ⚠️
      </span>
      
      {showTooltip && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#262626",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "0.75rem",
          whiteSpace: "nowrap",
          zIndex: 100,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          marginBottom: "8px"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            Producto Bloqueado: {bloqueo.motivo}
          </div>
          {bloqueo.ingredientes_agotados.length > 0 && (
            <div>
              Agotados: {bloqueo.ingredientes_agotados.map(i => i.nombre).join(", ")}
            </div>
          )}
          <div style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            marginLeft: "-5px",
            borderWidth: "5px",
            borderStyle: "solid",
            borderColor: "#262626 transparent transparent transparent"
          }} />
        </div>
      )}
    </div>
  );
}
