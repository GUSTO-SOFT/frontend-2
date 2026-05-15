import type { Mesa, Rol } from "../types";
import { MesaEstadoBadge } from "./MesaEstadoBadge";
import { formatOpenedAt } from "../utils/format";

type Props = {
  mesa: Mesa;
  rol: Rol | null;
  now: Date;
  isOpening: boolean;
  onAbrirMesa: (mesa: Mesa) => void;
};

export function MesaCard({ mesa, rol, now, isOpening, onAbrirMesa }: Props) {
  const canOpen = mesa.estado === "DISPONIBLE" && (rol === "MESERO" || rol === "ADMIN");

  return (
    <article className={`mesa-card mesa-card--${mesa.estado_color}`}>
      <div className="mesa-card__header">
        <div className={`mesa-number mesa-number--${mesa.estado_color}`}>
          {String(mesa.numero).padStart(2, "0")}
        </div>
        <MesaEstadoBadge estado={mesa.estado} color={mesa.estado_color} />
      </div>

      <div className="mesa-card__body">
        <h3>Mesa {mesa.numero}</h3>
        {mesa.estado === "DISPONIBLE" ? (
          <p className="mesa-muted">Lista para abrir servicio</p>
        ) : (
          <>
            <p className="mesa-time">{formatOpenedAt(mesa.opened_at, now)}</p>
            <p className="mesa-muted">
              {mesa.mesero_nombre ? `Mesero: ${mesa.mesero_nombre}` : "Sin mesero asignado"}
            </p>
          </>
        )}
      </div>

      <div className="mesa-card__footer">
        {canOpen && (
          <button
            className="primary-button"
            type="button"
            disabled={isOpening}
            onClick={() => onAbrirMesa(mesa)}
          >
            {isOpening ? "Abriendo..." : "Abrir Mesa"}
          </button>
        )}
      </div>
    </article>
  );
}
