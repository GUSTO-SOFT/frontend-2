import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "../api/client";
import type { MesaSocketPayload } from "../types";

export type SocketMode = "connecting" | "websocket" | "polling";

export function useMesasSocket(onMesaEstado: (payload: MesaSocketPayload) => void) {
  const [mode, setMode] = useState<SocketMode>("connecting");
  const callbackRef = useRef(onMesaEstado);

  useEffect(() => {
    callbackRef.current = onMesaEstado;
  }, [onMesaEstado]);

  useEffect(() => {
    if (!("WebSocket" in window)) {
      setMode("polling");
      return;
    }

    const socket: Socket = io(API_URL, {
      path: "/mesas/estado",
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => setMode("websocket"));
    socket.on("connect_error", () => setMode("polling"));
    socket.on("disconnect", () => setMode("polling"));
    socket.on("mesa.estado", (payload: MesaSocketPayload) => {
      callbackRef.current(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { mode };
}
