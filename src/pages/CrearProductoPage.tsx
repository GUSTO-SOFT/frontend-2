import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../auth/AuthContext";
import { ProductoForm } from "../components/ProductoForm";
import { useState, useEffect } from "react";
import { Toast } from "../components/Toast";

export function CrearProductoPage() {
  const { usuario, rol } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <div className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden registrar nuevos productos.</p>
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#667085", fontSize: "0.85rem" }}>MENÚ &gt; GESTIÓN DE PRODUCTO</span>
          </div>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        <section className="content">
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "32px" }}>Registrar Nuevo Platillo</h1>
            
            <div style={{ 
              background: "#fff", 
              padding: "40px", 
              borderRadius: "24px", 
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)" 
            }}>
              <ProductoForm 
                onSuccess={() => window.location.hash = "#menu"} 
                onCancel={() => window.location.hash = "#menu"}
                onToast={setToast}
              />
            </div>
          </div>
        </section>

        {toast && <Toast message={toast} />}
      </main>
    </div>
  );
}
