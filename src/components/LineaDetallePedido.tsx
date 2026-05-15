import { formatCurrency } from "../utils/format";
import { CantidadInput } from "./CantidadInput";

type Props = {
  productoNombre: string;
  categoria: string;
  precio?: number | null;
  cantidad: number;
  disabled?: boolean;
  error?: string | null;
  onCantidadChange: (cantidad: number) => void;
};

export function LineaDetallePedido({
  productoNombre,
  categoria,
  precio,
  cantidad,
  disabled = false,
  error,
  onCantidadChange,
}: Props) {
  return (
    <div className="detalle-row detalle-row--pedido">
      <div className="detalle-producto">
        <strong>{productoNombre}</strong>
      </div>
      <span className="detalle-categoria">{categoria}</span>
      <span className="detalle-precio">{precio != null ? formatCurrency(precio) : "-"}</span>
      <CantidadInput value={cantidad} disabled={disabled} onChange={onCantidadChange} error={error} />
      <span />
    </div>
  );
}
