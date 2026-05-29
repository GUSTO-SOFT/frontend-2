import { ReactNode } from "react";

type Props = {
  dateFrom: string;
  dateTo: string;
  onChangeDateFrom: (value: string) => void;
  onChangeDateTo: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  error?: string | null;
  children?: ReactNode;
  actions: ReactNode;
};

export function FiltrosFecha({
  dateFrom,
  dateTo,
  onChangeDateFrom,
  onChangeDateTo,
  onSubmit,
  error,
  children,
  actions,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="login-form" style={{ gap: "12px", marginTop: "14px" }}>
      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <label className="form-field">
          Fecha desde
          <input type="date" value={dateFrom} onChange={(e) => onChangeDateFrom(e.target.value)} />
        </label>
        <label className="form-field">
          Fecha hasta
          <input type="date" value={dateTo} onChange={(e) => onChangeDateTo(e.target.value)} />
        </label>
      </div>

      {children}

      {error && <p className="form-error">{error}</p>}

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>{actions}</div>
    </form>
  );
}

