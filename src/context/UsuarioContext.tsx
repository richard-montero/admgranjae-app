import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { borrarSesion, guardarSesion, leerSesion } from "../lib/almacenamiento";
import type { Sesion } from "../types/usuario";

export interface ValorUsuarioContext {
  sesion: Sesion | null;
  entrar: (sesion: Sesion) => void;
  salir: () => void;
}

export const UsuarioContext = createContext<ValorUsuarioContext | null>(null);

/** Conserva encargado, empresa y token durante la sesión de trabajo. */
export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion());

  const entrar = useCallback((nueva: Sesion) => {
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const salir = useCallback(() => {
    borrarSesion();
    setSesion(null);
  }, []);

  const valor = useMemo(() => ({ sesion, entrar, salir }), [sesion, entrar, salir]);
  return <UsuarioContext.Provider value={valor}>{children}</UsuarioContext.Provider>;
}
