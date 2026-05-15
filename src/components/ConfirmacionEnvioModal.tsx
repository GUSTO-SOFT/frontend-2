type Props = {
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
};

export function ConfirmacionEnvioModal({ onClose, onConfirm, submitting = false }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>Enviar pedido a cocina</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </header>

        <div className="modal-body">
          <p className="mesa-muted">Confirma que deseas enviar este pedido a cocina.</p>

          <div className="modal-actions" style={{ marginTop: "24px" }}>
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="button" className="primary-button" onClick={onConfirm} disabled={submitting}>
              {submitting ? "Enviando..." : "Confirmar envio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
