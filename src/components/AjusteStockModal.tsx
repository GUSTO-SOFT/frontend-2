import { useState } from "react";
import { ajustarStock } from "../services/inventarioService";
import type { Ingrediente } from "../types";

type Props = {
  ingrediente: Ingrediente;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const MOTIVOS = [
  "Reconteo de inventario",
  "Merma o desperdicio",
  "Donación",
  "Vencimiento",
  "Error de registro anterior",
  "Compra adicional",
  "Devolucion a proveedor",
  "Otro",
];

export function AjusteStockModal({ ingrediente, isOpen, onClose, onSuccess, onError }: Props) {
  const [delta, setDelta] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!delta || delta === "0") {
      newErrors.delta = "Ingresa un valor diferente a 0";
    }
    if (!motivo.trim()) {
      newErrors.motivo = "El motivo es obligatorio";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const deltaNum = Number(delta);
      await ajustarStock(ingrediente.id!, deltaNum, motivo);
      onSuccess(
        `Stock ajustado: ${deltaNum > 0 ? "+" : ""}${deltaNum} (${motivo})`
      );
      handleClose();
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.code === "STOCK_INSUFICIENTE") {
        onError(
          "⚠️ Stock insuficiente: el ajuste no puede dejar el stock en negativo"
        );
      } else {
        onError("Error al ajustar stock");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDelta("");
    setMotivo("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const stockActual = ingrediente.stock_actual ?? 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "grid", gap: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Ajustar Stock</h2>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>{ingrediente.nombre}</p>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: "16px", padding: "16px", display: "grid", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Stock actual</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
              {stockActual.toFixed(3)} {ingrediente.unidad_medida ?? ingrediente.unidadMedida}
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            <label style={{ display: "grid", gap: "8px" }}>
              <span style={{ fontWeight: 700 }}>Delta (+ o -)</span>
              <input
                type="number"
                step="0.001"
                value={delta}
                onChange={(e) => {
                  setDelta(e.target.value);
                  if (errors.delta) setErrors({ ...errors, delta: "" });
                }}
                placeholder="Ej. -5.5 o +10"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: `1px solid ${errors.delta ? "#d1141f" : "#d1d5db"}`,
                  fontSize: "1rem",
                }}
              />
              {errors.delta && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.delta}</span>}
            </label>

            <label style={{ display: "grid", gap: "8px" }}>
              <span style={{ fontWeight: 700 }}>Motivo *</span>
              <select
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (errors.motivo) setErrors({ ...errors, motivo: "" });
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: `1px solid ${errors.motivo ? "#d1141f" : "#d1d5db"}`,
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                <option value="">-- Selecciona un motivo --</option>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.motivo && <span style={{ color: "#d1141f", fontSize: "0.85rem" }}>{errors.motivo}</span>}
            </label>

            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#d1141f",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {isSubmitting ? "Ajustando..." : "Ajustar Stock"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
