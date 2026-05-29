import axios from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { enviarFacturaPorCorreo, getFacturaEnvios, getFacturaEstado } from "../services/billingService";
import type { ApiErrorBody, FacturaEnvioResponse, FacturaEstadoResponse } from "../types";
import { isRfc5321Email } from "../utils/email";

type Props = {
  facturaId: number | null;
  onConsultar: (facturaId: number) => void;
};

function badgeClass(estado: string) {
  if (estado === "ACEPTADA" || estado === "ENVIADO") return "estado-badge estado-badge--verde";
  if (estado === "RECHAZADA" || estado === "ERROR") return "estado-badge estado-badge--rojo";
  if (estado === "PENDIENTE_REINTENTO") return "estado-badge estado-badge--amarillo";
  return "estado-badge";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function parseApiMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null;
  const data = error.response?.data;
  const message = data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" | ");
  return null;
}

function stringifyErrorBody(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function FacturaElectronicaPage({ facturaId, onConsultar }: Props) {
  const { rol } = useAuth();
  const [consultaId, setConsultaId] = useState(facturaId ? String(facturaId) : "");
  const [factura, setFactura] = useState<FacturaEstadoResponse | null>(null);
  const [envios, setEnvios] = useState<FacturaEnvioResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const retrying = factura?.estado === "PENDIENTE_REINTENTO";

  const ultimoEnvio = useMemo(() => {
    if (envios.length === 0) return null;
    const sorted = [...envios].sort((a, b) => {
      const aTime = a.sent_at ? new Date(a.sent_at).getTime() : 0;
      const bTime = b.sent_at ? new Date(b.sent_at).getTime() : 0;
      return bTime - aTime;
    });
    return sorted[0] ?? null;
  }, [envios]);

  useEffect(() => {
    setConsultaId(facturaId ? String(facturaId) : "");
  }, [facturaId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function cargarFactura(id: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await getFacturaEstado(id);
      setFactura(data);
    } catch (err) {
      setFactura(null);
      setEnvios([]);
      setError(parseApiMessage(err) ?? "No se pudo consultar el estado de la factura.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarEnvios(id: number) {
    setLoadingEnvios(true);
    try {
      const data = await getFacturaEnvios(id);
      setEnvios(data);
    } catch (err) {
      setEnvios([]);
      const message = parseApiMessage(err);
      if (message) setToast({ message, type: "error" });
    } finally {
      setLoadingEnvios(false);
    }
  }

  useEffect(() => {
    if (!facturaId) {
      setFactura(null);
      setEnvios([]);
      setError(null);
      return;
    }

    cargarFactura(facturaId);
    cargarEnvios(facturaId);
  }, [facturaId]);

  useEffect(() => {
    if (!facturaId) return;
    if (!retrying) return;

    const timer = window.setInterval(() => {
      cargarFactura(facturaId);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [facturaId, retrying]);

  function handleConsultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = Number(consultaId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Ingresa un ID de factura válido.");
      return;
    }
    onConsultar(parsed);
  }

  async function handleEnviarCorreo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(null);

    if (!facturaId) {
      setEmailError("Primero consulta una factura.");
      return;
    }

    if (!isRfc5321Email(email)) {
      setEmailError("Correo inválido. Verifica el formato.");
      return;
    }

    setSending(true);
    try {
      const envio = await enviarFacturaPorCorreo(facturaId, email);
      setToast({ message: "Factura enviada por correo.", type: "success" });
      setEmail("");
      setEnvios((prev) => [envio, ...prev]);
    } catch (err) {
      setToast({ message: parseApiMessage(err) ?? "No se pudo enviar la factura por correo.", type: "error" });
    } finally {
      setSending(false);
    }
  }

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <div className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden acceder a la factura electrónica.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <h1>Factura electrónica</h1>
          <div />
          <div className="session-user" />
        </header>

        <section className="content">
          <div className="pedido-card" style={{ maxWidth: "920px" }}>
            <h2 style={{ margin: 0 }}>Consulta</h2>
            <p className="mesa-muted">Consulta el estado de una factura y gestiona el envío por correo.</p>

            <form onSubmit={handleConsultar} className="login-form" style={{ gap: "12px" }}>
              <label className="form-field">
                ID de factura
                <input
                  inputMode="numeric"
                  value={consultaId}
                  onChange={(event) => setConsultaId(event.target.value)}
                  placeholder="Ej: 12"
                />
              </label>

              {error && <p className="form-error">{error}</p>}

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Consultando..." : "Consultar"}
              </button>
            </form>
          </div>

          {factura && (
            <div className="pedido-card" style={{ maxWidth: "920px", marginTop: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0 }}>Panel de factura</h2>
                  <p className="mesa-muted">Información de transmisión y estado.</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className={badgeClass(factura.estado)}>{factura.estado}</span>
                  {retrying && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <span className="spinner" aria-label="Reintentando automáticamente" />
                      <span className="mesa-muted" style={{ fontWeight: 700 }}>
                        Reintento automático
                      </span>
                    </span>
                  )}
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ width: "auto", padding: "0 18px" }}
                    onClick={() => cargarFactura(factura.id)}
                    disabled={loading}
                  >
                    Actualizar
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "12px" }}>
                  <strong>CUFE</strong>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                    {factura.cufe ?? "—"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "12px" }}>
                  <strong>Timestamp</strong>
                  <span>{formatDateTime(factura.timestamp_utc)}</span>
                </div>

                {factura.estado === "RECHAZADA" && (
                  <details className="expandable">
                    <summary>Detalle del error</summary>
                    <pre className="code-block">{stringifyErrorBody(factura.error_body)}</pre>
                  </details>
                )}

                {factura.estado === "PENDIENTE_REINTENTO" && (
                  <div className="mesa-muted">
                    Intentos: <strong>{factura.intentos}</strong> · Próximo reintento:{" "}
                    <strong>{formatDateTime(factura.next_retry_at)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {factura && (
            <div className="pedido-card" style={{ maxWidth: "920px", marginTop: "18px" }}>
              <h2 style={{ margin: 0 }}>Envío por correo</h2>
              <p className="mesa-muted">Envía la factura a un correo destino.</p>

              {ultimoEnvio && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span className={badgeClass(ultimoEnvio.estado)}>{ultimoEnvio.estado}</span>
                  <span className="mesa-muted">
                    {ultimoEnvio.estado === "ENVIADO" ? "Enviado el" : "Error el"}{" "}
                    <strong>{formatDateTime(ultimoEnvio.sent_at)}</strong>
                  </span>

                  {ultimoEnvio.estado === "ERROR" && (
                    <details className="expandable">
                      <summary>Detalle consultable</summary>
                      <pre className="code-block">{ultimoEnvio.detalle_error ?? "—"}</pre>
                    </details>
                  )}
                </div>
              )}

              <form onSubmit={handleEnviarCorreo} className="login-form" style={{ gap: "12px", marginTop: "14px" }}>
                <label className="form-field">
                  Correo destino
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="cliente@correo.com"
                    required
                  />
                </label>

                {emailError && <p className="form-error">{emailError}</p>}

                <button className="primary-button" type="submit" disabled={sending}>
                  {sending ? "Enviando..." : "Enviar por correo"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={loadingEnvios}
                  onClick={() => cargarEnvios(factura.id)}
                >
                  {loadingEnvios ? "Cargando..." : "Consultar envíos"}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

