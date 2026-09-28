import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/Header";
import { useUsuario } from "../hooks/useUsuario";

/** Sin sesión → /login, recordando la ruta para volver a ella después de ingresar. */
export function RutaProtegida() {
  const { sesion } = useUsuario();
  const ubicacion = useLocation();

  if (!sesion) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
