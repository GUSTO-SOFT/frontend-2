import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MesasSalonPage } from "./pages/MesasSalonPage";
import { CrearPedidoPage } from "./pages/CrearPedidoPage";
import { EditarPedidoPage } from "./pages/EditarPedidoPage";
import { MenuPage } from "./pages/MenuPage";
import { CrearProductoPage } from "./pages/CrearProductoPage";
import { ProductoDetallePage } from "./pages/ProductoDetallePage";
import { CocinaPage } from "./pages/CocinaPage";
import type { Mesa } from "./types";

type Vista =
  | { nombre: "mesas" }
  | { nombre: "crear-pedido"; mesa: Mesa }
  | { nombre: "editar-pedido"; pedidoId: number }
  | { nombre: "menu" }
  | { nombre: "crear-producto" }
  | { nombre: "producto-detalle"; productoId: number }
  | { nombre: "cocina" };

function vistaDesdeHash(): Vista {
  const hash = window.location.hash;
  const pedidoMatch = hash.match(/^#pedidos\/(\d+)$/);
  const productoMatch = hash.match(/^#menu\/productos\/(\d+)$/);

  if (pedidoMatch) {
    return { nombre: "editar-pedido", pedidoId: Number(pedidoMatch[1]) };
  }
  if (productoMatch) {
    return { nombre: "producto-detalle", productoId: Number(productoMatch[1]) };
  }
  if (hash === "#menu") return { nombre: "menu" };
  if (hash === "#crear-producto") return { nombre: "crear-producto" };
  if (hash === "#cocina") return { nombre: "cocina" };
  return { nombre: "mesas" };
}

export function App() {
  const { isAuthenticated } = useAuth();
  const [vista, setVista] = useState<Vista>(() => vistaDesdeHash());

  useEffect(() => {
    const handleHashChange = () => setVista(vistaDesdeHash());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!isAuthenticated) return <LoginPage />;

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

    case "mesas":
    default:
      return (
        <MesasSalonPage
          onCrearPedido={(mesa) => {
            setVista({ nombre: "crear-pedido", mesa });
            window.location.hash = "#crear-pedido";
          }}
        />
      );
  }
}
