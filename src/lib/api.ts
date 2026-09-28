import type { CriaDetalle } from "../types/cria";
import type { Granja } from "../types/granja";
import type { DatosRegistro } from "../types/registro";
import type { Sesion } from "../types/usuario";
import { ErrorApi, esCodigoError } from "./errores";

/**
 * Acceso a datos desde el navegador. Solo llama a las Netlify Functions (/api/*);
 * aquí no hay SQL ni credenciales.
 */

interface Opciones {
  metodo?: "GET" | "POST";
  token?: string;
  cuerpo?: unknown;
}

async function solicitar<T>(ruta: string, { metodo = "GET", token, cuerpo }: Opciones = {}): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch (err) {
    console.error("[api] sin conexión", ruta, err);
    throw new ErrorApi("CONEXION");
  }

  let datos: unknown = null;
  try {
    datos = await respuesta.json();
  } catch {
    /* respuesta sin JSON */
  }

  if (!respuesta.ok) {
    const cuerpoError = (datos ?? {}) as { codigo?: unknown; campos?: unknown };
    const codigo = esCodigoError(cuerpoError.codigo)
      ? cuerpoError.codigo
      : respuesta.status === 401
        ? "SESION"
        : respuesta.status >= 502
          ? "CONEXION"
          : "INTERNO";
    console.error("[api]", ruta, respuesta.status, codigo);
    const campos =
      typeof cuerpoError.campos === "object" && cuerpoError.campos !== null
        ? (cuerpoError.campos as ErrorApi["campos"])
        : undefined;
    throw new ErrorApi(codigo, campos);
  }
  return datos as T;
}

export function getUsuarioByTelefono(telefono: string): Promise<Sesion> {
  return solicitar<Sesion>("login", { metodo: "POST", cuerpo: { telefono } });
}

export function getGranjasByEncargado(token: string): Promise<Granja[]> {
  return solicitar<Granja[]>("granjas", { token });
}

/** Datos de la cría con su última fecha registrada y el rango de fechas permitido. */
export function getCria(token: string, idCria: number): Promise<CriaDetalle> {
  return solicitar<CriaDetalle>(`cria?id=${encodeURIComponent(idCria)}`, { token });
}

export function insertarRegistroCria(token: string, idCria: number, datos: DatosRegistro): Promise<{ ok: true }> {
  return solicitar<{ ok: true }>("registro", { metodo: "POST", token, cuerpo: { idCria, ...datos } });
}
