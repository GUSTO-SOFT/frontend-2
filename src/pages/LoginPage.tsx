import axios from "axios";
import { FormEvent, useState } from "react";
import { loginRequest } from "../services/authService";
import { useAuth } from "../auth/AuthContext";
import type { ApiErrorBody } from "../types";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await loginRequest(email, password);
      login(response.usuario, response.access_token);
      
      // La redirección se maneja en App.tsx basándose en el estado de autenticación y rol
    } catch (err) {
      if (axios.isAxiosError<ApiErrorBody>(err)) {
        const message = err.response?.data?.message;
        setError(Array.isArray(message) ? message[0] : message || "Credenciales incorrectas");
      } else {
        setError("Error de conexión con el servidor");
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
            <p>La excelencia gastronómica gestionada con precisión y pasión. Controle su restaurante desde cualquier lugar.</p>
          </div>

          <div className="login-features">
            <div className="feature-pill">
              <span className="feature-pill__icon">⚡</span>
              <span>Alta Eficiencia</span>
            </div>
            <div className="feature-pill">
              <span className="feature-pill__icon">✕</span>
              <span>Control Total</span>
            </div>
          </div>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-header">
            <span className="login-form-pretitle">GUSTO-SOFT</span>
            <h1>Bienvenido</h1>
            <p>Ingrese sus credenciales para acceder al sistema.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              Correo Electrónico
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ejemplo@gustosoft.com"
                required
              />
            </label>

            <label className="form-field">
              Contraseña
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button login-submit" disabled={submitting} type="submit">
              {submitting ? "Ingresando..." : "Iniciar Sesión"}
            </button>

            <div className="login-footer">
              <a className="login-link" href="#olvide-contrasena">
                Olvidé mi contraseña
              </a>
              <a className="login-link" href="#registro">
                Crear cuenta
              </a>
              <span>GASTRO-SYSTEM EXCELLENCE</span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
