import { useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MesasSalonPage } from "./pages/MesasSalonPage";
import { CrearPedidoPage } from "./pages/CrearPedidoPage";
import type { Mesa } from "./types";

type Vista =
  | { nombre: "mesas" }
  | { nombre: "crear-pedido"; mesa: Mesa };

export function App() {
  const { isAuthenticated } = useAuth();
  const [vista, setVista] = useState<Vista>({ nombre: "mesas" });

  if (!isAuthenticated) return <LoginPage />;

  if (vista.nombre === "crear-pedido") {
    return (
      <CrearPedidoPage
        mesa={vista.mesa}
        onVolver={() => setVista({ nombre: "mesas" })}
        onPedidoCreado={(_pedidoId) => {
          // Aquí irá la navegación a la pantalla de edición del pedido (RF05)
          setVista({ nombre: "mesas" });
        }}
      />
    );
  }

  return (
    <MesasSalonPage
      onCrearPedido={(mesa) => setVista({ nombre: "crear-pedido", mesa })}
    />
  );
}
