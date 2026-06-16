import axios from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Toast } from "../components/Toast";
import {
  getEstadoVerificacion,
  registrarUsuario,
  reenviarCodigoVerificacion,
  verificarUsuario,
  type VerificacionEstadoResponse,
} from "../services/usuariosService";
import type { ApiErrorBody } from "../types";

type RegistroState = {
  usuario_id: number;
  email: string;
  estado: string;
};

const PASSWORD_RULES =
  "La contrasena debe tener minimo 8 caracteres, una mayuscula, un numero y un caracter especial.";

function apiMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null;
  const data = error.response?.data;
  const message = data?.message;
  return {
    code: data?.code ?? data?.error,
    message: Array.isArray(message) ? message.join(" | ") : message,
  };
}

function verificationGuidance(code?: string | null) {
  if (code === "CODIGO_NO_DISPONIBLE") {
    return "Tu cuenta aun requiere que un administrador asigne el rol. Cuando eso ocurra, el codigo se enviara al correo registrado.";
  }
  if (code === "CODIGO_EXPIRADO") return "El codigo expiro. Solicita un reenvio para recibir uno nuevo.";
  if (code === "DEMASIADOS_INTENTOS") return "Hay demasiados intentos recientes. Espera 15 minutos antes de volver a intentar.";
  if (code === "LIMITE_REENVIO_EXCEDIDO") return "Ya se alcanzo el limite de reenvios por hora. Intenta mas tarde.";
  return null;
}

export function RegistroUsuarioPage() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    password_confirmacion: "",
    codigo: "",
  });
  const [registro, setRegistro] = useState<RegistroState | null>(null);
  const [estadoVerificacion, setEstadoVerificacion] = useState<VerificacionEstadoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [submittingRegistro, setSubmittingRegistro] = useState(false);
  const [submittingCodigo, setSubmittingCodigo] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const canVerify = useMemo(() => Boolean(registro?.usuario_id && form.codigo.trim().length === 6), [form.codigo, registro]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateRegistro() {
    if (!form.nombre.trim() || !form.apellido.trim()) return "Nombre y apellido son obligatorios.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Ingresa un correo valido.";
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) return PASSWORD_RULES;
    if (form.password !== form.password_confirmacion) return "La confirmacion no coincide con la contrasena.";
    return null;
  }

  async function refreshVerificationStatus(usuarioId: number) {
    setCheckingStatus(true);
    try {
      const status = await getEstadoVerificacion(usuarioId);
      setEstadoVerificacion(status);
      setInfo(
        status.codigo_disponible
          ? "Ya hay un codigo vigente. Revisa tu correo e ingresalo en este formulario."
          : "El codigo aun no esta disponible. Primero el administrador debe asignar un rol o reenviar el codigo si ya expiro.",
      );
    } catch (err) {
      const parsed = apiMessage(err);
      setInfo(parsed?.message ?? "No se pudo consultar el estado de verificacion.");
    } finally {
      setCheckingStatus(false);
    }
  }

  async function handleRegistro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (registro) {
      setInfo("El registro ya fue creado. Usa el campo de codigo para completar la verificacion.");
      return;
    }

    const validationError = validateRegistro();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmittingRegistro(true);
    try {
      const response = await registrarUsuario({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email,
        password: form.password,
        password_confirmacion: form.password_confirmacion,
      });
      setRegistro(response);
      setEstadoVerificacion(null);
      setToast({ message: "Registro creado. Espera asignacion de rol y codigo de verificacion.", type: "success" });
      await refreshVerificationStatus(response.usuario_id);
    } catch (err) {
      const parsed = apiMessage(err);
      setError(parsed?.message ?? "No se pudo crear el registro.");
    } finally {
      setSubmittingRegistro(false);
    }
  }

  async function handleVerificar() {
    setError(null);
    setInfo(null);

    if (!registro) {
      setError("Primero crea el registro para obtener tu identificador de usuario.");
      return;
    }

    if (form.codigo.trim().length !== 6) {
      setError("Ingresa el codigo de 6 digitos enviado a tu correo.");
      return;
    }

    setSubmittingCodigo(true);
    try {
      await verificarUsuario(registro.usuario_id, form.codigo.trim());
      setToast({ message: "Cuenta verificada. Ya puedes iniciar sesion.", type: "success" });
      window.setTimeout(() => {
        window.location.hash = "#login";
      }, 900);
    } catch (err) {
      const parsed = apiMessage(err);
      setError(verificationGuidance(parsed?.code) ?? parsed?.message ?? "No se pudo verificar el codigo.");
    } finally {
      setSubmittingCodigo(false);
    }
  }

  async function handleReenviar() {
    if (!registro) {
      setError("Primero crea el registro para solicitar reenvio.");
      return;
    }

    setError(null);
    setInfo(null);
    setSubmittingCodigo(true);
    try {
      const response = await reenviarCodigoVerificacion(registro.usuario_id);
      setEstadoVerificacion((current) => ({
        usuario_id: registro.usuario_id,
        codigo_disponible: true,
        expires_at: response.expires_at,
        envio_estado: current?.envio_estado ?? "ENVIADO",
        detalle_error: null,
        sent_at: current?.sent_at ?? null,
      }));
      setToast({ message: "Codigo reenviado. Revisa el correo registrado.", type: "success" });
    } catch (err) {
      const parsed = apiMessage(err);
      setError(verificationGuidance(parsed?.code) ?? parsed?.message ?? "No se pudo reenviar el codigo.");
    } finally {
      setSubmittingCodigo(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <aside className="login-aside">
          <div className="login-brand">
            <strong>Gusto-Soft</strong>
            <p>Crea tu cuenta y completa la verificacion cuando recibas el codigo por correo.</p>
          </div>

          <div className="login-features">
            <div className="feature-pill">
              <span className="feature-pill__icon">ID</span>
              <span>Registro Seguro</span>
            </div>
            <div className="feature-pill">
              <span className="feature-pill__icon">6</span>
              <span>Codigo por Correo</span>
            </div>
          </div>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-header">
            <span className="login-form-pretitle">GUSTO-SOFT</span>
            <h1>Registro</h1>
            <p>Solicita tu cuenta y escribe el codigo en este mismo formulario cuando llegue a tu correo.</p>
          </div>

          <form className="login-form" onSubmit={handleRegistro}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
              <label className="form-field">
                Nombre
                <input type="text" value={form.nombre} onChange={(event) => updateField("nombre", event.target.value)} placeholder="Nombre" required />
              </label>

              <label className="form-field">
                Apellido
                <input type="text" value={form.apellido} onChange={(event) => updateField("apellido", event.target.value)} placeholder="Apellido" required />
              </label>
            </div>

            <label className="form-field">
              Correo
              <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="correo@ejemplo.com" required />
            </label>

            <label className="form-field">
              Contrasena
              <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="********" required />
            </label>

            <label className="form-field">
              Confirmar contrasena
              <input
                type="password"
                value={form.password_confirmacion}
                onChange={(event) => updateField("password_confirmacion", event.target.value)}
                placeholder="********"
                required
              />
            </label>

            <label className="form-field">
              Codigo de verificacion
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.codigo}
                onChange={(event) => updateField("codigo", event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
              />
            </label>

            {registro && (
              <div className="form-error" style={{ color: "#344054", borderColor: "#d8deea", background: "#f8fafc" }}>
                <strong>Registro #{registro.usuario_id}</strong>
                <br />
                Estado: {registro.estado}
                {estadoVerificacion?.expires_at ? (
                  <>
                    <br />
                    Codigo vigente hasta: {new Date(estadoVerificacion.expires_at).toLocaleString()}
                  </>
                ) : null}
              </div>
            )}

            {info && <p className="form-error" style={{ color: "#344054", borderColor: "#d8deea", background: "#f8fafc" }}>{info}</p>}
            {error && <p className="form-error">{error}</p>}

            <button className="primary-button login-submit" disabled={submittingRegistro || Boolean(registro)} type="submit">
              {submittingRegistro ? "Registrando..." : registro ? "Registro creado" : "Crear registro"}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button type="button" className="secondary-button" onClick={() => registro && refreshVerificationStatus(registro.usuario_id)} disabled={!registro || checkingStatus}>
                {checkingStatus ? "Consultando..." : "Consultar estado"}
              </button>
              <button type="button" className="secondary-button" onClick={handleReenviar} disabled={!registro || submittingCodigo}>
                Reenviar
              </button>
            </div>

            <button type="button" className="primary-button login-submit" onClick={handleVerificar} disabled={!canVerify || submittingCodigo}>
              {submittingCodigo ? "Verificando..." : "Verificar cuenta"}
            </button>

            <div className="login-footer">
              <a className="login-link" href="#login">
                Volver a iniciar sesion
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
