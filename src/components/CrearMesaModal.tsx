import { useState } from "react";
import { createMesa } from "../services/mesasService";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function CrearMesaModal({ onClose, onSuccess, onError }: Props) {
  const [numero, setNumero] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numero === "" || numero < 1) return;

    setIsSubmitting(true);
    try {
      await createMesa(numero);
      onSuccess();
      onClose();
    } catch (error: any) {
      const status = error.response?.status;
      const code = error.response?.data?.error;
      if (status === 409 || code === "MESA_DUPLICADA") {
        onError("Ya existe una mesa con ese número");
      } else if (status === 403) {
        onError("No tienes permisos para crear mesas");
      } else {
        onError(error.response?.data?.message || "No se pudo crear la mesa");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Nueva mesa</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body">
          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>Número de mesa</span>
            <input
              value={numero}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setNumero("");
                  return;
                }
                const next = Number(raw);
                setNumero(Number.isFinite(next) ? next : "");
              }}
              inputMode="numeric"
              placeholder="Ej: 12"
              disabled={isSubmitting}
              style={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "12px 14px",
                fontSize: "1rem",
              }}
            />
          </label>

          <div className="modal-actions" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || numero === "" || numero < 1}
            >
              {isSubmitting ? "Creando..." : "Crear mesa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
