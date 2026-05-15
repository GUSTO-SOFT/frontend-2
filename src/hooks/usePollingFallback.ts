import { useEffect } from "react";
import type { SocketMode } from "./useMesasSocket";

export function usePollingFallback(
  mode: SocketMode,
  fetchData: (silent?: boolean) => Promise<void>,
  intervalMs: number = 5000
) {
  useEffect(() => {
    if (mode !== "polling") return;

    const timer = window.setInterval(() => {
      void fetchData(true);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [fetchData, mode, intervalMs]);
}
