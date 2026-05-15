import type { SocketMode } from "../hooks/useMesasSocket";

type Props = {
  mode: SocketMode;
};

export function ConexionEstadoBadge({ mode }: Props) {
  const isWebsocket = mode === "websocket";

  return (
    <div className="connection-state">
      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <i className={`dot ${isWebsocket ? "dot--verde" : "dot--rojo"}`} />
        {isWebsocket ? "Tiempo real activo (WS)" : "Modo Polling (5s)"}
      </span>
    </div>
  );
}
