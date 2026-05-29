import { useState } from "react";
import { toggleDisponibilidad } from "../services/menuService";

type Props = {
  productoId: number;
  activo: boolean;
  onToggleSuccess: (nuevoEstado: boolean) => void;
  onError: (mensaje: string) => void;
  disabled?: boolean;
};

export function ToggleDisponibilidad({ 
  productoId, 
  activo, 
  onToggleSuccess, 
  onError,
  disabled = false 
}: Props) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const nuevoEstado = !activo;
      await toggleDisponibilidad(productoId, nuevoEstado);
      onToggleSuccess(nuevoEstado);
    } catch (error: any) {
      if (error.response?.status === 403) {
        onError("Sin permisos para esta accion");
      } else {
        onError("Error al cambiar disponibilidad");
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isToggling}
      style={{
        position: "relative",
        width: "48px",
        height: "26px",
        background: activo ? "#007a2f" : "#d1141f",
        borderRadius: "13px",
        border: "none",
        cursor: disabled || isToggling ? "not-allowed" : "pointer",
        transition: "background 0.3s",
        opacity: disabled || isToggling ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: activo ? "25px" : "3px",
          width: "20px",
          height: "20px",
          background: "#fff",
          borderRadius: "50%",
          transition: "left 0.3s",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
