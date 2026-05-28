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
import { GestionUsuariosPage } from "./pages/GestionUsuariosPage";
import { InventarioPage } from "./pages/InventarioPage";
import { CrearIngredientePage } from "./pages/CrearIngredientePage";
import { MovimientosStockPage } from "./pages/MovimientosStockPage";
import { Sidebar } from "./components/Sidebar";
import type { Mesa } from "./types";

type Vista =
  | { nombre: "mesas" }
  | { nombre: "crear-pedido"; mesa: Mesa }
  | { nombre: "editar-pedido"; pedidoId: number }
  | { nombre: "menu" }
  | { nombre: "crear-producto" }
  | { nombre: "producto-detalle"; productoId: number }
  | { nombre: "cocina" }
  | { nombre: "inventario" }
  | { nombre: "crear-ingrediente" }
  | { nombre: "movimientos-stock" }
  | { nombre: "pedidos" }
  | { nombre: "usuarios" }
  | { nombre: "caja" };

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
  if (hash === "#mesas") return { nombre: "mesas" };
  if (hash === "#inventario/nuevo") return { nombre: "crear-ingrediente" };
  if (hash.startsWith("#inventario")) return { nombre: "inventario" };
  if (hash === "#movimientos-stock") return { nombre: "movimientos-stock" };
  if (hash === "#usuarios") return { nombre: "usuarios" };
  if (hash === "#caja") return { nombre: "caja" };
  if (hash === "#pedidos") return { nombre: "pedidos" };
  
  // Default inicial
  return { nombre: "mesas" };
}

export function App() {
  const { isAuthenticated, usuario, rol } = useAuth();
  const [vista, setVista] = useState<Vista>(() => vistaDesdeHash());

  useEffect(() => {
    const handleHashChange = () => setVista(vistaDesdeHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Enrutador basado en el estado 'vista'
  switch (vista.nombre) {
    case "mesas":
      return (rol === "ADMIN" || rol === "MESERO" || rol === "CAJERO") ? (
        <MesasSalonPage
          onCrearPedido={(mesa) => {
            setVista({ nombre: "crear-pedido", mesa });
            window.location.hash = "#crear-pedido";
          }}
        />
      ) : <MenuPage />;

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
      return rol === "ADMIN" ? <CrearProductoPage /> : <MenuPage />;

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

    case "inventario":
      return (rol === "ADMIN" || rol === "CHEF") ? <InventarioPage /> : <MenuPage />;

    case "crear-ingrediente":
      return rol === "ADMIN" ? <CrearIngredientePage /> : <MenuPage />;

    case "movimientos-stock":
      return rol === "ADMIN" ? <MovimientosStockPage /> : <MenuPage />;

    case "cocina":
      return (rol === "ADMIN" || rol === "CHEF") ? <CocinaPage /> : <MenuPage />;

    case "usuarios":
      return rol === "ADMIN" ? <GestionUsuariosPage /> : <MenuPage />;

    case "caja":
      return (rol === "ADMIN" || rol === "CAJERO") ? (
        <div className="app-shell">
          <Sidebar />
          <main className="main-panel">
            <header className="topbar">
              <h1>Panel de Caja</h1>
              <div className="session-user">
                <strong>{usuario?.nombre}</strong>
                <span>{rol}</span>
              </div>
            </header>
            <section className="content">
              <div className="empty-state">
                <h2>Módulo de Caja</h2>
                <p>Este módulo está en desarrollo. Aquí se gestionarán los pagos y facturación.</p>
              </div>
            </section>
          </main>
        </div>
      ) : <MenuPage />;

    case "pedidos":
      return (rol === "ADMIN" || rol === "MESERO" || rol === "CAJERO") ? (
        <div className="app-shell">
          <Sidebar />
          <main className="main-panel">
            <header className="topbar">
              <h1>Gestión de Pedidos</h1>
              <div className="session-user">
                <strong>{usuario?.nombre}</strong>
                <span>{rol}</span>
              </div>
            </header>
            <section className="content">
              <div className="empty-state">
                <h2>Historial de Pedidos</h2>
                <p>Este módulo está en desarrollo. Aquí podrás ver y gestionar todos los pedidos del restaurante.</p>
              </div>
            </section>
          </main>
        </div>
      ) : <MenuPage />;

    default:
      if (rol === "CHEF") return <CocinaPage />;
      return <MenuPage />;
  }
}
