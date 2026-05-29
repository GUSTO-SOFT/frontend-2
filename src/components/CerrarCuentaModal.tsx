import { useState } from "react";
import type { Cuenta } from "../types";
import { formatCurrency } from "../utils/format";

type Props = {
  cuenta: Cuenta;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CerrarCuentaModal({ cuenta, isLoading, onClose, onConfirm }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>¿Seguro que quieres cerrar la cuenta?</h2>
          <button className="modal-close" onClick={onClose} disabled={isLoading}>
            &times;
          </button>
        </header>

        <div className="modal-body">
          <h3>Mesa {cuenta.mesa_id}</h3>
          <div style={{ marginBottom: "12px" }}>
            <p>
              <strong>Total bruto:</strong> {formatCurrency(cuenta.total_bruto)}
            </p>
            {cuenta.descuento > 0 && (
              <p style={{ color: "#d1141f" }}>
                <strong>Descuento aplicado:</strong>{" "}
                {cuenta.descuento_tipo === "PORCENTAJE"
                  ? `${cuenta.descuento}%`
                  : formatCurrency(cuenta.descuento)}
                {cuenta.descuento_motivo && ` - ${cuenta.descuento_motivo}`}
              </p>
            )}
          </div>
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
            Total neto a cobrar: {formatCurrency(cuenta.total_neto)}
          </p>
        </div>

        <div className="modal-actions" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{ background: "#d1141f", borderColor: "#d1141f" }}
          >
            {isLoading ? "Cerrando..." : "Confirmar cierre"}
          </button>
        </div>
      </div>
    </div>
  );
}
