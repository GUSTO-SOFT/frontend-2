import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Toast } from "../components/Toast";
import {getUsuarios,createUsuario,updateUsuario,updateUsuarioEstado,} from "../services/usuariosService";
import type { Usuario, Rol, UsuarioEstado, ApiErrorBody } from "../types";

const PAGE_SIZE = 10;

export function GestionUsuariosPage() {
  const { usuario: currentUser, rol } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Rol | "TODOS">("TODOS");
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [stats, setStats] = useState({ ADMIN: 0, MESERO: 0, CHEF: 0, CAJERO: 0 });
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "MESERO" as Rol
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, [page, roleFilter, search]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
          const response = await getUsuarios({
        rol: roleFilter === "TODOS" ? undefined : roleFilter
      });
      
      // El backend devuelve un array plano de usuarios
      const allUsers = Array.isArray(response) ? response : [];
      
      // Aplicar búsqueda localmente
      const filtered = allUsers.filter(u => 
        u.nombre.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
      );

      setUsuarios(filtered);
      setTotalPages(Math.ceil(filtered.length / PAGE_SIZE));

      // Actualizar estadísticas con todos los datos obtenidos
      updateStats(allUsers);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setToast("Error al cargar usuarios. Verifica los permisos de administrador.");
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data: Usuario[]) => {
    const newStats = { ADMIN: 0, MESERO: 0, CHEF: 0, CAJERO: 0 };
    data.forEach(u => {
      if (u.rol && newStats[u.rol] !== undefined) newStats[u.rol]++;
    });
    setStats(newStats);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nombre) errors.nombre = "El nombre es obligatorio";
    if (!formData.email) errors.email = "El correo es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Correo inválido";
    
    if (!editingUser && (!formData.password || formData.password.length < 8)) {
      errors.password = "Contraseña mínimo 8 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUsuario(editingUser.id, {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol
        });
        setToast("Usuario actualizado con éxito");
      } else {
        await createUsuario(formData);
        setToast("Usuario creado con éxito");
      }
      setShowModal(false);
      resetForm();
      fetchUsuarios();
    } catch (error: any) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const message = error.response?.data?.message;
        setToast(Array.isArray(message) ? message[0] : message || "Error al procesar la solicitud");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: "", email: "", password: "", rol: "MESERO" });
    setFormErrors({});
    setEditingUser(null);
  };

  const handleEdit = (u: Usuario) => {
    setEditingUser(u);
    setFormData({
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol: u.rol ?? "MESERO"
    });
    setShowModal(true);
  };

  const toggleStatus = async (u: Usuario) => {
    const backendEstado: UsuarioEstado = u.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    
    if (!window.confirm(`¿Seguro que deseas ${backendEstado === "ACTIVO" ? "reactivar" : "desactivar"} a ${u.nombre}?`)) return;

    try {
      await updateUsuarioEstado(u.id, backendEstado);
      setToast(`Usuario ${backendEstado === "ACTIVO" ? "reactivado" : "desactivado"}`);
      fetchUsuarios();
    } catch (error) {
      setToast("Error al cambiar estado");
    }
  };

  if (rol !== "ADMIN") {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-panel">
          <div className="content">
            <div className="empty-state">
              <h2>Acceso Denegado</h2>
              <p>Solo los administradores pueden gestionar usuarios.</p>
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
          <h1>Gestión de Usuarios</h1>
          <div className="session-user">
            <strong>{currentUser?.nombre}</strong>
            <span>{rol}</span>
          </div>
        </header>

        <section className="content">
          {/* Tarjetas de Resumen */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
            {Object.entries(stats).map(([role, count]) => (
              <div key={role} className="stat-card" style={{ background: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <span style={{ color: "#667085", fontSize: "0.85rem", fontWeight: "600" }}>{role}S</span>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", marginTop: "8px", color: "#d1141f" }}>{count}</div>
              </div>
            ))}
          </div>

          <div className="toolbar" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "16px", flex: 1 }}>
              <input 
                type="text" 
                placeholder="Buscar por nombre o correo..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid #e3e9f2", width: "300px" }}
              />
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value as any)}
                style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid #e3e9f2" }}
              >
                <option value="TODOS">Todos los roles</option>
                <option value="ADMIN">Administradores</option>
                <option value="MESERO">Meseros</option>
                <option value="CHEF">Chefs</option>
                <option value="CAJERO">Cajeros</option>
              </select>
            </div>
            <button 
              className="primary-button" 
              onClick={() => { resetForm(); setShowModal(true); }}
              style={{ width: "auto", background: "#d1141f", padding: "0 24px" }}
            >
              + Nuevo Usuario
            </button>
          </div>

          <div className="form-error" style={{ marginBottom: "18px", color: "#344054", borderColor: "#d8deea", background: "#f8fafc" }}>
            El codigo de verificacion no se puede consultar en texto plano desde este panel. El backend lo guarda como hash; el flujo disponible es asignar rol, enviar/reintentar codigo por correo y validar el codigo ingresado por el usuario.
          </div>

          {/* Tabla de Usuarios */}
          <div style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: "16px 24px", color: "#667085", fontSize: "0.85rem" }}>Nombre</th>
                  <th style={{ padding: "16px 24px", color: "#667085", fontSize: "0.85rem" }}>Correo</th>
                  <th style={{ padding: "16px 24px", color: "#667085", fontSize: "0.85rem" }}>Rol</th>
                  <th style={{ padding: "16px 24px", color: "#667085", fontSize: "0.85rem" }}>Estado</th>
                  <th style={{ padding: "16px 24px", color: "#667085", fontSize: "0.85rem" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center" }}>Cargando usuarios...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center" }}>No se encontraron usuarios</td></tr>
                ) : (
                  usuarios.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "16px 24px", fontWeight: "600" }}>{u.nombre}</td>
                      <td style={{ padding: "16px 24px" }}>{u.email}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "8px", background: "#f0f0f0", fontSize: "0.75rem", fontWeight: "700" }}>{u.rol ?? "SIN_ROL"}</span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "6px", 
                          padding: "4px 10px", 
                          borderRadius: "8px", 
                          background: u.estado === "ACTIVO" ? "#e6f7ed" : u.estado?.startsWith("PENDIENTE") ? "#fffcf0" : "#fff0f1",
                          color: u.estado === "ACTIVO" ? "#007a2f" : u.estado?.startsWith("PENDIENTE") ? "#7a5b00" : "#d1141f",
                          fontSize: "0.75rem",
                          fontWeight: "700"
                        }}>
                          <i className={`dot ${u.estado === "ACTIVO" ? "dot--verde" : "dot--rojo"}`} />
                          {u.estado}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", display: "flex", gap: "8px" }}>
                        <button onClick={() => handleEdit(u)} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085" }}>✎</button>
                        <button onClick={() => toggleStatus(u)} style={{ background: "none", border: "none", cursor: "pointer", color: u.estado === "ACTIVO" ? "#d1141f" : "#007a2f" }}>
                          {u.estado === "ACTIVO" ? "Desactivar" : "Reactivar"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="pagination" style={{ marginTop: "24px" }}>
            <button disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button disabled={page === totalPages || loading} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>
        </section>

        {/* Modal Formulario */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "500px" }}>
              <header className="modal-header">
                <h2>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
              </header>
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-field" style={{ marginBottom: "16px" }}>
                  <label>Nombre Completo</label>
                  <input 
                    type="text" 
                    value={formData.nombre} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                  />
                  {formErrors.nombre && <span style={{ color: "#d1141f", fontSize: "0.75rem" }}>{formErrors.nombre}</span>}
                </div>
                <div className="form-field" style={{ marginBottom: "16px" }}>
                  <label>Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                  />
                  {formErrors.email && <span style={{ color: "#d1141f", fontSize: "0.75rem" }}>{formErrors.email}</span>}
                </div>
                {!editingUser && (
                  <div className="form-field" style={{ marginBottom: "16px" }}>
                    <label>Contraseña</label>
                    <div style={{ position: "relative" }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        style={{ width: "100%", padding: "10px 40px 10px 10px", borderRadius: "8px", border: "1px solid #ddd" }}
                        placeholder="Contraseña del empleado"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#667085", marginTop: "4px", display: "block" }}>
                      Debe tener al menos 8 caracteres para ser válida.
                    </span>
                    {formErrors.password && <span style={{ color: "#d1141f", fontSize: "0.75rem" }}>{formErrors.password}</span>}
                  </div>
                )}
                <div className="form-field" style={{ marginBottom: "24px" }}>
                  <label>Rol</label>
                  <select 
                    value={formData.rol} 
                    onChange={(e) => setFormData({...formData, rol: e.target.value as Rol})}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="MESERO">Mesero</option>
                    <option value="CHEF">Chef</option>
                    <option value="CAJERO">Cajero</option>
                  </select>
                </div>
                <div className="modal-actions" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button type="button" className="secondary-button" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="primary-button" disabled={submitting} style={{ width: "auto", background: "#d1141f", padding: "0 24px" }}>
                    {submitting ? "Procesando..." : (editingUser ? "Guardar Cambios" : "Crear Usuario")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast message={toast} />}
      </main>
    </div>
  );
}
