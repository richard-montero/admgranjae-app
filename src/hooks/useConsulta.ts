import { useCallback, useEffect, useState } from "react";
import { ErrorApi, mensajeDeError } from "../lib/errores";
import { useSesionActiva } from "./useUsuario";

export interface EstadoConsulta<T> {
  datos: T | null;
  error: string;
  cargando: boolean;
  recargar: () => void;
}

/**
 * Ejecuta una consulta autenticada con estado de carga y error.
 * Si la sesión venció, cierra la sesión y la app vuelve a /login.
 */
export function useConsulta<T>(consulta: (token: string) => Promise<T>, dependencias: unknown[]): EstadoConsulta<T> {
  const { token, salir } = useSesionActiva();
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    setDatos(null);
    consulta(token)
      .then((resultado) => {
        if (vigente) setDatos(resultado);
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        if (err instanceof ErrorApi && err.codigo === "SESION") salir();
        else setError(mensajeDeError(err));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
    // `consulta` cambia en cada render; las dependencias reales se pasan explícitamente
  }, [token, intento, ...dependencias]);

  return { datos, error, cargando, recargar };
}
