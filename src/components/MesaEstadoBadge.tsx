import type { MesaEstado, MesaEstadoColor } from "../types";

const LABELS: Record<MesaEstado, string> = {
  DISPONIBLE: "Libre",
  OCUPADA: "Ocupada",
};

type Props = {
  estado: MesaEstado;
  color: MesaEstadoColor;
};

export function MesaEstadoBadge({ estado, color }: Props) {
  return (
    <span className={`estado-badge estado-badge--${color}`}>
      {LABELS[estado] ?? estado}
    </span>
  );
}
