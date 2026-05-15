import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../auth/AuthContext";
import { getProductos } from "../services/menuService";
import type { Producto, CategoriaProducto } from "../types";
import { Toast } from "../components/Toast";
import { formatCurrency } from "../utils/format";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  TODOS: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  ENTRADA: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  PLATO_FUERTE: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  BEBIDA: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="12" y1="2" x2="12" y2="5"/></svg>,
  POSTRE: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
};

export function MenuPage() {
  const { usuario, rol } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoriaProducto | "TODOS">("TODOS");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const data = await getProductos();
      setProductos(data);
    } catch {
      setToast("Error al cargar el menú");
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = filter === "TODOS" 
    ? productos 
    : productos.filter(p => p.categoria === filter);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <h1>Gestión de Menú</h1>
          <div className="session-user">
            <strong>{usuario?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        <section className="content">
          <div className="toolbar" style={{ marginBottom: "32px" }}>
            <div>
              <h2 style={{ margin: 0 }}>Lista de Productos</h2>
              <p style={{ color: "#667085", margin: "4px 0 0" }}>Gestiona tu oferta gastronómica y disponibilidad.</p>
            </div>
            {rol === "ADMIN" && (
              <button 
                className="primary-button" 
                style={{ width: "auto", background: "#d1141f", padding: "0 24px" }}
                onClick={() => window.location.hash = "#crear-producto"}
              >
                + Nuevo Producto
              </button>
            )}
          </div>

          <div className="filters" style={{ 
            marginBottom: "32px", 
            justifyContent: "flex-start", 
            gap: "16px",
            display: "flex",
            flexWrap: "wrap"
          }}>
            {["TODOS", "ENTRADA", "PLATO_FUERTE", "BEBIDA", "POSTRE"].map((cat) => (
              <button
                key={cat}
                className={`category-card ${filter === cat ? "category-card--active" : ""}`}
                onClick={() => setFilter(cat as any)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  padding: "20px",
                  minWidth: "120px",
                  borderRadius: "20px",
                  border: "2px solid #f0f0f0",
                  background: filter === cat ? "#d1141f" : "#fff",
                  color: filter === cat ? "#fff" : "#8a6d3b",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: filter === cat ? "0 10px 20px rgba(209, 20, 31, 0.2)" : "none"
                }}
              >
                <div style={{ 
                  color: filter === cat ? "#fff" : (filter === "TODOS" ? "#8a6d3b" : "#8a6d3b") 
                }}>
                  {CATEGORY_ICONS[cat]}
                </div>
                <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>
                  {cat === "TODOS" ? "Todos" : cat.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                </span>
              </button>
            ))}
          </div>

          <div style={{ 
            background: "#fff", 
            borderRadius: "24px", 
            overflow: "hidden", 
            boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
            border: "1px solid #f0f0f0"
          }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#fdfdfd", borderBottom: "1px solid #f0f0f0" }}>
                  <th style={{ padding: "20px 24px", color: "#667085", fontWeight: "600", fontSize: "0.85rem" }}>Producto</th>
                  <th style={{ padding: "20px 24px", color: "#667085", fontWeight: "600", fontSize: "0.85rem" }}>Categoría</th>
                  <th style={{ padding: "20px 24px", color: "#667085", fontWeight: "600", fontSize: "0.85rem" }}>Precio ($)</th>
                  <th style={{ padding: "20px 24px", color: "#667085", fontWeight: "600", fontSize: "0.85rem" }}>Estado</th>
                  <th style={{ padding: "20px 24px", color: "#667085", fontWeight: "600", fontSize: "0.85rem" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "#667085" }}>Cargando catálogo de productos...</td></tr>
                ) : filteredProductos.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "#667085" }}>No se encontraron productos en esta categoría.</td></tr>
                ) : (
                  filteredProductos.map((prod) => (
                    <tr key={prod.id} style={{ borderBottom: "1px solid #f8f8f8" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ 
                            width: "48px", 
                            height: "48px", 
                            background: "#f5f5f5", 
                            borderRadius: "12px",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "20px"
                          }}>
                            {prod.categoria === "BEBIDA" ? "🍹" : prod.categoria === "POSTRE" ? "🍰" : "🍽️"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#141a2d", fontSize: "0.95rem" }}>{prod.nombre}</div>
                            <div style={{ fontSize: "0.8rem", color: "#667085", marginTop: "2px" }}>Prep: {prod.tiempo_preparacion} min</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ 
                          padding: "6px 14px", 
                          borderRadius: "10px", 
                          background: "#f0f0f0", 
                          color: "#667085",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.02em"
                        }}>
                          {prod.categoria.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: "800", color: "#141a2d" }}>{formatCurrency(prod.precio)}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          fontSize: "0.85rem",
                          padding: "6px 12px",
                          borderRadius: "10px",
                          background: prod.activo ? "#e6f7ed" : "#fff0f1",
                          color: prod.activo ? "#007a2f" : "#d1141f",
                          fontWeight: "700"
                        }}>
                          <i className={`dot ${prod.activo ? "dot--verde" : "dot--rojo"}`} style={{ width: "8px", height: "8px" }} />
                          {prod.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <button style={{ 
                          background: "#fff", 
                          border: "1px solid #e3e9f2", 
                          borderRadius: "10px",
                          width: "36px",
                          height: "36px",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          color: "#667085",
                          transition: "all 0.2s"
                        }}>
                          ✎
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {toast && <Toast message={toast} />}
      </main>
    </div>
  );
}
