type Props = {
  message: string | null;
  type?: "error" | "success";
};

export function Toast({ message, type = "error" }: Props) {
  if (!message) return null;

  return (
    <div className={`toast toast--${type}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
