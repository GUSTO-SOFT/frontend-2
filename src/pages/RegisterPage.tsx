import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import { registerRequest } from "../services/authService";
import { Toast } from "../components/Toast";

export function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [codigoRegistro, setCodigoRegistro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
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
      await registerRequest({
        nombre,
        apellido,
        email,
        password,
        password_confirmacion: passwordConfirmacion,
        codigo_registro: codigoRegistro,
      });

      setToast({ message: "Registro exitoso. Serás redirigido a iniciar sesión.", type: "success" });
      setNombre("");
      setApellido("");
      setEmail("");
      setPassword("");
      setPasswordConfirmacion("");
      setCodigoRegistro("");

      window.setTimeout(() => {
        window.location.hash = "#login";
      }, 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string | string[]; error?: string } | undefined;
        const message =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
            ? data.message.join(" | ")
            : data?.error;

        setError(message ?? "No se pudo completar el registro.");
      } else {
        setError("No se pudo completar el registro. Intenta nuevamente.");
      }
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
            <p>Completa tus datos y usa el código de registro entregado por el administrador.</p>
          </div>

          <div className="login-features">
            <div className="feature-pill">
              <span className="feature-pill__icon">🛡️</span>
              <span>Registro seguro</span>
            </div>
            <div className="feature-pill">
              <span className="feature-pill__icon">📄</span>
              <span>Código de uso único</span>
            </div>
          </div>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-header">
            <span className="login-form-pretitle">GUSTO-SOFT</span>
            <h1>Registro</h1>
            <p>Ingrese sus datos y el código de registro valido.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              Nombre
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ana"
                required
              />
            </label>

            <label className="form-field">
              Apellido
              <input
                type="text"
                value={apellido}
                onChange={(event) => setApellido(event.target.value)}
                placeholder="Ruiz"
                required
              />
            </label>

            <label className="form-field">
              Correo Electrónico
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ana@example.com"
                required
              />
            </label>

            <label className="form-field">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password2026!"
                minLength={8}
                required
              />
            </label>

            <label className="form-field">
              Confirmar Contraseña
              <input
                type="password"
                value={passwordConfirmacion}
                onChange={(event) => setPasswordConfirmacion(event.target.value)}
                placeholder="Password2026!"
                minLength={8}
                required
              />
            </label>

            <label className="form-field">
              Código de Registro
              <input
                type="text"
                value={codigoRegistro}
                onChange={(event) => setCodigoRegistro(event.target.value)}
                placeholder="123456"
                pattern="\d{6}"
                title="Ingresa un código de 6 dígitos"
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button login-submit" disabled={submitting} type="submit">
              {submitting ? "Registrando..." : "Registrarme"}
            </button>

            <div className="login-footer" style={{ justifyContent: "space-between" }}>
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
