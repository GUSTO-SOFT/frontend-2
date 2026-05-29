export function formatIsoDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultDateFrom(days = 30) {
  const today = new Date();
  const from = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  return formatIsoDateInput(from);
}

export function defaultDateTo() {
  return formatIsoDateInput(new Date());
}

export function toUtcStartIso(dateInput: string) {
  return `${dateInput}T00:00:00.000Z`;
}

export function toUtcEndIso(dateInput: string) {
  return `${dateInput}T23:59:59.999Z`;
}

