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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [stockActualLocal, setStockActualLocal] = useState<number | null>(null);

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
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const deltaNum = Number(delta);
      const response = await ajustarStock(ingrediente.id!, deltaNum, motivo);
      setStockActualLocal(response.stock_actual);
      setSubmitSuccess("Ajuste registrado correctamente.");
      onSuccess(`Stock ajustado: ${deltaNum > 0 ? "+" : ""}${deltaNum} (${motivo})`);
      setDelta("");
      setMotivo("");
      setErrors({});
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.code === "STOCK_INSUFICIENTE") {
        const message = "Stock insuficiente: el ajuste no puede dejar el stock en negativo.";
        setSubmitError(message);
        onError(`⚠️ ${message}`);
      } else {
        const message = "Error al ajustar stock";
        setSubmitError(message);
        onError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDelta("");
    setMotivo("");
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
    setStockActualLocal(null);
    onClose();
  };

  if (!isOpen) return null;

  const stockActualBase = Number((ingrediente as any).stock_actual ?? (ingrediente as any).stockActual ?? 0);
  const stockActual = stockActualLocal ?? stockActualBase;
  const unidad = ingrediente.unidad_medida ?? ingrediente.unidadMedida ?? "";

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
          maxWidth: "520px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "grid", gap: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Ajustar Stock</h2>
            <p style={{ margin: "8px 0 0", color: "#667085" }}>{ingrediente.nombre}</p>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ background: "#f8fafc", borderRadius: "16px", padding: "16px", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Stock actual (antes del ajuste)</span>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
                {stockActual.toFixed(3)} {unidad}
              </span>
            </div>

            {submitError ? (
              <div style={{ borderRadius: "16px", padding: "14px 16px", background: "#fff0f1", border: "1px solid #fecdd3", color: "#9f1239", fontWeight: 700 }}>
                {submitError}
              </div>
            ) : null}

            {submitSuccess ? (
              <div style={{ borderRadius: "16px", padding: "14px 16px", background: "#e6f7ed", border: "1px solid #bbf7d0", color: "#047857", fontWeight: 700 }}>
                {submitSuccess}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontWeight: 700 }}>Delta (+ o -)</span>
                <input
                  type="number"
                  step="0.001"
                  value={delta}
                  onChange={(e) => {
                    setDelta(e.target.value);
                    setSubmitError(null);
                    setSubmitSuccess(null);
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
                    setSubmitError(null);
                    setSubmitSuccess(null);
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
                  Cerrar
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
                  {isSubmitting ? "Ajustando..." : "Aplicar ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
