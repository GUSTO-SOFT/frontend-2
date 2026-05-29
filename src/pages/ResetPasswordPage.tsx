import axios from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Toast } from "../components/Toast";
import { resetPasswordRequest } from "../services/passwordRecoveryService";
import { PASSWORD_COMPLEXITY_MESSAGE, isStrongPassword } from "../utils/password";

type Props = {
  token: string | null;
};

export function ResetPasswordPage({ token }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const missingToken = useMemo(() => !token || token.trim().length === 0, [token]);

  useEffect(() => {
    if (!success && missingToken && !error) {
      setError("Token no encontrado. Revisa el enlace recibido.");
    }
  }, [error, missingToken, success]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function validar(): string | null {
    if (missingToken) return "Token no encontrado. Revisa el enlace recibido.";
    if (!isStrongPassword(password)) return PASSWORD_COMPLEXITY_MESSAGE;
    if (password !== confirmPassword) return "La confirmación no coincide con la nueva contraseña.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validar();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await resetPasswordRequest(token as string, password);
      setToast({ message: response.message, type: "success" });
      setSuccess(true);
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
          setToast({ message, type: "error" });
          return;
        }
      }

      setToast({ message: "No se pudo restablecer la contraseña. Intenta nuevamente.", type: "error" });
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
            <p>Defina una nueva contraseña segura. El enlace tiene una validez limitada.</p>
          </div>

          <div className="login-features">
            <div className="feature-pill">
              <span className="feature-pill__icon">🔐</span>
              <span>Clave Segura</span>
            </div>
            <div className="feature-pill">
              <span className="feature-pill__icon">✅</span>
              <span>Confirmación</span>
            </div>
          </div>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-header">
            <span className="login-form-pretitle">GUSTO-SOFT</span>
            <h1>Restablecer contraseña</h1>
            <p>Ingrese su nueva contraseña y confírmela para continuar.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              Nueva contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
                disabled={success}
              />
            </label>

            <label className="form-field">
              Confirmar contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="********"
                required
                disabled={success}
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              className="primary-button login-submit"
              disabled={submitting || success || missingToken}
              type="submit"
            >
              {submitting ? "Guardando..." : success ? "Contraseña actualizada" : "Actualizar contraseña"}
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
