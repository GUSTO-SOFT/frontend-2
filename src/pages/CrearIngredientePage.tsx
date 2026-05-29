import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import { FormularioIngrediente } from "../components/FormularioIngrediente";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export function CrearIngredientePage() {
  const { usuario, rol } = useAuth();
  const [toast, setToast] = useState<ToastState>(null);

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <section className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden acceder a esta página.</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>Gestión de inventario</h1>
            <p style={{ margin: 0, color: "#667085" }}>Agrega ingredientes nuevos y controla el stock de la cocina central.</p>
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <section className="content">
          <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto", display: "grid", gap: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h2 style={{ margin: 0 }}>Agregar ingrediente</h2>
                <p style={{ margin: "8px 0 0", color: "#667085" }}>Completa el formulario para registrar un nuevo ingrediente.</p>
              </div>
              <button
                type="button"
                onClick={() => { window.location.hash = "#inventario"; }}
                style={{
                  borderRadius: "14px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#0f172a",
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancelar
              </button>
            </div>
            <FormularioIngrediente
              onSuccess={() => {
                setToast({ message: "Ingrediente creado correctamente", type: "success" });
                window.location.hash = "#inventario";
              }}
              onToast={(message, type = "success") => setToast({ message, type })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
