import { BrowserRouter } from "react-router-dom";
import { Desarrollador } from "./components/Desarrollador";
import { UsuarioProvider } from "./context/UsuarioContext";
import { AppRoutes } from "./routes/AppRoutes";

export function App() {
  return (
    <BrowserRouter>
      <UsuarioProvider>
        <div className="app">
          <AppRoutes />
          <Desarrollador />
        </div>
      </UsuarioProvider>
    </BrowserRouter>
  );
}
