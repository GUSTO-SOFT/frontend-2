import { useAuth } from "../auth/AuthContext";
import type { Rol } from "../types";

type NavItem = {
  label: string;
  href: string;
  roles: Rol[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Mesas", href: "#mesas", roles: ["ADMIN", "MESERO"] },
  { label: "Pedidos", href: "#pedidos", roles: ["ADMIN", "MESERO"] },
  { label: "Cocina", href: "#cocina", roles: ["ADMIN", "CHEF"] },
  { label: "Notificaciones", href: "#notificaciones", roles: ["ADMIN", "MESERO"] },
];

export function Sidebar() {
  const { rol, logout } = useAuth();

  const filteredItems = NAV_ITEMS.filter((item) => 
    rol && item.roles.includes(rol)
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>Gusto-Soft</strong>
        <span>Gestion Profesional</span>
      </div>
      <nav className="side-nav">
        {filteredItems.map((item) => (
          <a 
            key={item.label}
            className={`side-nav__item ${item.label === "Mesas" ? "side-nav__item--active" : ""}`} 
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <button className="secondary-button sidebar__logout" type="button" onClick={logout}>
        Cerrar sesion
      </button>
    </aside>
  );
}
