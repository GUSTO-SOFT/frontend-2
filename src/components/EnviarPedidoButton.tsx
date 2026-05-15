import { useEffect, useState } from "react";
import { ConfirmacionEnvioModal } from "./ConfirmacionEnvioModal";

type Props = {
  visible: boolean;
  disabled?: boolean;
  submitting?: boolean;
  detallesCount: number;
  onConfirm: () => void;
};

export function EnviarPedidoButton({
  visible,
  disabled = false,
  submitting = false,
  detallesCount,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (detallesCount > 0) setInlineError(null);
  }, [detallesCount]);

  if (!visible) return null;

  function handleClick() {
    if (detallesCount <= 0) {
      setInlineError("Agrega al menos un producto antes de enviar");
      return;
    }
    setOpen(true);
  }

  function handleClose() {
    if (submitting) return;
    setOpen(false);
  }

  function handleConfirm() {
    setOpen(false);
    onConfirm();
  }

  return (
    <div className="enviar-pedido">
      <button
        type="button"
        className="secondary-button enviar-pedido-btn"
        onClick={handleClick}
        disabled={disabled || submitting}
      >
        {submitting ? "Enviando..." : "Enviar a cocina"}
      </button>
      {inlineError ? <div className="inline-warning">{inlineError}</div> : null}
      {open ? (
        <ConfirmacionEnvioModal onClose={handleClose} onConfirm={handleConfirm} submitting={submitting} />
      ) : null}
    </div>
  );
}
