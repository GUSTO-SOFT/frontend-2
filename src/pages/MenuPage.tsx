import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../auth/AuthContext";
import { getProductos } from "../services/menuService";
import type { Producto, CategoriaProducto } from "../types";
import { Toast } from "../components/Toast";

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

          <div className="filters" style={{ marginBottom: "32px", justifyContent: "flex-start" }}>
            {["TODOS", "ENTRADA", "PLATO_FUERTE", "BEBIDA", "POSTRE"].map((cat) => (
              <button
                key={cat}
                className={`filter-pill ${filter === cat ? "filter-pill--active" : ""}`}
                onClick={() => setFilter(cat as any)}
                style={{ minWidth: "100px" }}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: "16px 24px" }}>Producto</th>
                  <th style={{ padding: "16px 24px" }}>Categoría</th>
                  <th style={{ padding: "16px 24px" }}>Precio</th>
                  <th style={{ padding: "16px 24px" }}>Estado</th>
                  <th style={{ padding: "16px 24px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center" }}>Cargando productos...</td></tr>
                ) : filteredProductos.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center" }}>No hay productos en esta categoría.</td></tr>
                ) : (
                  filteredProductos.map((prod) => (
                    <tr key={prod.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "40px", height: "40px", background: "#f0f0f0", borderRadius: "8px" }} />
                          <div>
                            <div style={{ fontWeight: "bold" }}>{prod.nombre}</div>
                            <div style={{ fontSize: "0.8rem", color: "#667085" }}>{prod.tiempo_preparacion} min preparacion</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "99px", background: "#f0f0f0", fontSize: "0.8rem" }}>
                          {prod.categoria}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: "bold" }}>${prod.precio.toFixed(2)}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
                          <i className={`dot ${prod.activo ? "dot--verde" : "dot--rojo"}`} />
                          {prod.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#667085" }}>✎</button>
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
