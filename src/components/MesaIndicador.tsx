import type { MesaEstado, MesaEstadoColor } from "../types";

const LABELS: Record<MesaEstado, string> = {
  DISPONIBLE: "Disponible",
  OCUPADA: "Ocupada",
};

type Props = {
  estado: MesaEstado;
  color: MesaEstadoColor;
};

export function MesaIndicador({ estado, color }: Props) {
  return (
    <span className={`estado-badge estado-badge--${color}`}>
      {LABELS[estado] ?? estado}
    </span>
  );
}
