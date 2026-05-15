export function formatOpenedAt(openedAt: string | null, now = new Date()) {
  if (!openedAt) return "";

  const openedDate = new Date(openedAt);
  if (Number.isNaN(openedDate.getTime())) return "";

  const diffMs = now.getTime() - openedDate.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "Abierta hace menos de 1 min";
  if (minutes < 60) return `Abierta hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `Abierta hace ${hours} h${rest ? ` ${rest} min` : ""}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
