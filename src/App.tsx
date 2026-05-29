import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { MesasSalonPage } from "./pages/MesasSalonPage";
import { CrearPedidoPage } from "./pages/CrearPedidoPage";
import { EditarPedidoPage } from "./pages/EditarPedidoPage";
import { MenuPage } from "./pages/MenuPage";
import { CrearProductoPage } from "./pages/CrearProductoPage";
import { ProductoDetallePage } from "./pages/ProductoDetallePage";
import { CocinaPage } from "./pages/CocinaPage";
import { FacturaElectronicaPage } from "./pages/FacturaElectronicaPage";
import { CuentaMesaPage } from "./pages/CuentaMesaPage";
import type { Mesa } from "./types";

type Vista =
  | { nombre: "mesas" }
  | { nombre: "crear-pedido"; mesa: Mesa }
  | { nombre: "editar-pedido"; pedidoId: number }
  | { nombre: "menu" }
  | { nombre: "crear-producto" }
  | { nombre: "producto-detalle"; productoId: number }
  | { nombre: "cocina" }
  | { nombre: "factura-electronica"; facturaId: number | null }
  | { nombre: "cuenta-mesa"; mesa: Mesa };

type AuthVista =
  | { nombre: "login" }
  | { nombre: "forgot-password" }
  | { nombre: "reset-password"; token: string | null };

function vistaDesdeHash(): Vista {
  const hash = window.location.hash;
  const pedidoMatch = hash.match(/^#pedidos\/(\d+)$/);
  const productoMatch = hash.match(/^#menu\/productos\/(\d+)$/);
  const facturaMatch = hash.match(/^#factura-electronica(?:\/(\d+))?$/);

  if (pedidoMatch) {
    return { nombre: "editar-pedido", pedidoId: Number(pedidoMatch[1]) };
  }
  if (productoMatch) {
    return { nombre: "producto-detalle", productoId: Number(productoMatch[1]) };
  }
  if (facturaMatch) {
    return { nombre: "factura-electronica", facturaId: facturaMatch[1] ? Number(facturaMatch[1]) : null };
  }
  if (hash === "#menu") return { nombre: "menu" };
  if (hash === "#crear-producto") return { nombre: "crear-producto" };
  if (hash === "#cocina") return { nombre: "cocina" };
  return { nombre: "mesas" };
}

function tokenDesdeHash(hash: string) {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const [path, query] = normalized.split("?");

  if (query) {
    const params = new URLSearchParams(query);
    const token = params.get("token");
    if (token) return token;
  }

  const parts = path.split("/");
  if (parts.length >= 2 && parts[1]) return parts[1];

  return null;
}

function authVistaDesdeHash(): AuthVista {
  const hash = window.location.hash;
  if (!hash || hash === "#login") return { nombre: "login" };
  if (hash.startsWith("#olvide-contrasena")) return { nombre: "forgot-password" };
  if (hash.startsWith("#restablecer-contrasena")) {
    return { nombre: "reset-password", token: tokenDesdeHash(hash) };
  }
  return { nombre: "login" };
}

export function App() {
  const { isAuthenticated } = useAuth();
  const [vista, setVista] = useState<Vista>(() => vistaDesdeHash());

  useEffect(() => {
    const handleHashChange = () => setVista(vistaDesdeHash());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!isAuthenticated) {
    const authVista = authVistaDesdeHash();
    if (authVista.nombre === "forgot-password") return <ForgotPasswordPage />;
    if (authVista.nombre === "reset-password") return <ResetPasswordPage token={authVista.token} />;
    return <LoginPage />;
  }

  switch (vista.nombre) {
    case "crear-pedido":
      return (
        <CrearPedidoPage
          mesa={vista.mesa}
          onVolver={() => {
            setVista({ nombre: "mesas" });
            window.location.hash = "#mesas";
          }}
          onPedidoCreado={(pedidoId) => {
            setVista({ nombre: "editar-pedido", pedidoId });
            window.location.hash = `#pedidos/${pedidoId}`;
          }}
        />
      );

    case "editar-pedido":
      return (
        <EditarPedidoPage
          pedidoId={vista.pedidoId}
          onVolverMesas={() => {
            setVista({ nombre: "mesas" });
            window.location.hash = "#mesas";
          }}
        />
      );

    case "menu":
      return <MenuPage />;

    case "crear-producto":
      return <CrearProductoPage />;

    case "producto-detalle":
      return (
        <ProductoDetallePage
          productoId={vista.productoId}
          onVolver={() => {
            setVista({ nombre: "menu" });
            window.location.hash = "#menu";
          }}
        />
      );
    case "cocina":
      return <CocinaPage />;

    case "factura-electronica":
      return (
        <FacturaElectronicaPage
          facturaId={vista.facturaId}
          onConsultar={(facturaId) => {
            setVista({ nombre: "factura-electronica", facturaId });
            window.location.hash = `#factura-electronica/${facturaId}`;
          }}
        />
      );

    case "cuenta-mesa":
      return (
        <CuentaMesaPage
          mesa={vista.mesa}
          onVolver={() => {
            setVista({ nombre: "mesas" });
            window.location.hash = "#mesas";
          }}
          onCuentaCerrada={() => {
            setVista({ nombre: "mesas" });
            window.location.hash = "#mesas";
          }}
        />
      );

    case "mesas":
    default:
      return (
        <MesasSalonPage
          onCrearPedido={(mesa) => {
            setVista({ nombre: "crear-pedido", mesa });
            window.location.hash = "#crear-pedido";
          }}
          onVerCuenta={(mesa) => {
            setVista({ nombre: "cuenta-mesa", mesa });
            window.location.hash = "#cuenta-mesa";
          }}
        />
      );
  }
}
