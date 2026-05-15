import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MesasPage } from "./pages/MesasPage";

export function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MesasPage /> : <LoginPage />;
}
