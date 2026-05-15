import React from "react";
import { useAuth } from "../auth/AuthContext";
import type { Rol } from "../types";

type NavItem = {
  label: string;
  href: string;
  roles: Rol[];
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { 
    label: "Menú", 
    href: "#menu", 
    roles: ["ADMIN", "MESERO", "CHEF"],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
  },
  { 
    label: "Mesas", 
    href: "#mesas", 
    roles: ["ADMIN", "MESERO"],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM3 9h18M9 3v18"/></svg>
  },
  { 
    label: "Pedidos", 
    href: "#pedidos", 
    roles: ["ADMIN", "MESERO"],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  },
  { 
    label: "Cocina", 
    href: "#cocina", 
    roles: ["ADMIN", "CHEF"],
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>
  },
];

export function Sidebar() {
  const { rol, logout } = useAuth();
  const currentHash = window.location.hash || "#menu";

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
            className={`side-nav__item ${currentHash === item.href ? "side-nav__item--active" : ""}`} 
            href={item.href}
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            {item.icon}
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
