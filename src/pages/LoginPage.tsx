import { FormEvent, useState } from "react";
import { loginRequest } from "../services/authService";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@gustosoft.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await loginRequest(email, password);
      login(response.usuario, response.access_token);
    } catch {
      setError("Credenciales incorrectas. Revisa el correo y la contrasena.");
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
              Usuario
              <input
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Nombre de usuario"
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
              <span>GASTRO-SYSTEM EXCELLENCE</span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
