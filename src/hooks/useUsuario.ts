import { useContext } from "react";
import { UsuarioContext, type ValorUsuarioContext } from "../context/UsuarioContext";

export function useUsuario(): ValorUsuarioContext {
  const valor = useContext(UsuarioContext);
  if (!valor) throw new Error("useUsuario debe usarse dentro de <UsuarioProvider>");
  return valor;
}

/** Para páginas protegidas: la sesión siempre existe (RutaProtegida lo garantiza). */
export function useSesionActiva() {
  const { sesion, salir } = useUsuario();
  if (!sesion) throw new Error("Sesión no identificada");
  return { ...sesion, salir };
}
