import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import { Toast } from "../components/Toast";
import { forgotPasswordRequest } from "../services/passwordRecoveryService";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await forgotPasswordRequest(email);
      setToast({ message: response.message, type: "success" });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as
          | { message?: string | string[]; code?: string; error?: string }
          | undefined;
        const message =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data?.message.join(" | ")
              : undefined;

        if (message) {
          setError(message);
          return;
        }
      }
      setError("No se pudo enviar la solicitud. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <aside className="login-aside">
          <div className="login-brand">
            <strong>Gusto-Soft</strong>
            <p>Recupere el acceso a su cuenta de forma segura. Le enviaremos instrucciones si el correo existe.</p>
          </div>

          <div className="login-features">
            <div className="feature-pill">
              <span className="feature-pill__icon">🔒</span>
              <span>Recuperación Segura</span>
            </div>
            <div className="feature-pill">
              <span className="feature-pill__icon">✉️</span>
              <span>Enlace por Correo</span>
            </div>
          </div>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-header">
            <span className="login-form-pretitle">GUSTO-SOFT</span>
            <h1>Olvidé mi contraseña</h1>
            <p>Ingrese su correo y enviaremos las instrucciones para restablecerla.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              Correo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button login-submit" disabled={submitting} type="submit">
              {submitting ? "Enviando..." : "Enviar"}
            </button>

            <div className="login-footer">
              <a className="login-link" href="#login">
                Volver a iniciar sesión
              </a>
              <span>GASTRO-SYSTEM EXCELLENCE</span>
            </div>
          </form>
        </section>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </main>
  );
}
