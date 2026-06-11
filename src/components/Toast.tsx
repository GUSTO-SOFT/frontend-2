type Props = {
  message: string | null;
  type?: "error" | "success";
};

export function Toast({ message, type = "error" }: Props) {
  if (!message) return null;

  return (
    <div className={`toast toast--${type}`} role={type === "error" ? "alert" : "status"} aria-live="polite">
      <span className="toast__icon" aria-hidden="true">{type === "success" ? "OK" : "!"}</span>
      <span>{message}</span>
    </div>
  );
}
