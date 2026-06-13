import { formatCurrency } from "../utils/format";
import { CantidadInput } from "./CantidadInput";
import { NotasInput } from "./NotasInput";

type Props = {
  productoNombre: string;
  categoria: string;
  precio?: number | null;
  cantidad: number;
  notas: string;
  disabled?: boolean;
  errorCantidad?: string | null;
  errorNotas?: string | null;
  onCantidadChange: (cantidad: number) => void;
  onNotasChange: (notas: string) => void;
  onRemove?: () => void;
};

export function LineaDetallePedido({
  productoNombre,
  categoria,
  precio,
  cantidad,
  notas,
  disabled = false,
  errorCantidad,
  errorNotas,
  onCantidadChange,
  onNotasChange,
  onRemove,
}: Props) {
  return (
    <div className="detalle-row detalle-row--pedido">
      <div className="detalle-producto">
        <strong>{productoNombre}</strong>
        <NotasInput value={notas} max={255} disabled={disabled} error={errorNotas} onChange={onNotasChange} />
      </div>
      <span className="detalle-categoria">{categoria}</span>
      <span className="detalle-precio">{precio != null ? formatCurrency(precio) : "-"}</span>
      <CantidadInput
        value={cantidad}
        disabled={disabled}
        onChange={onCantidadChange}
        error={errorCantidad}
      />
      {onRemove ? (
        <button
          type="button"
          className="quitar-linea"
          onClick={onRemove}
          disabled={disabled}
          title="Quitar producto"
        >
          x
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
