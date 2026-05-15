import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MesasSalonPage } from "./pages/MesasSalonPage";

export function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MesasSalonPage /> : <LoginPage />;
}
