import { MENSAJES } from "../../src/lib/errores";
import type { CodigoError, RespuestaError } from "../../src/types/api";
import type { ErroresRegistro } from "../../src/types/registro";
import { ErrorConfiguracion } from "./db";
import { tokenDeCabecera, verificarToken, type DatosSesion } from "./sesion";

/** Error controlado que se devuelve al celular con un código y un mensaje claro. */
export class ErrorHttp extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: CodigoError,
    readonly campos?: ErroresRegistro,
  ) {
    super(MENSAJES[codigo]);
    this.name = "ErrorHttp";
  }
}

const CABECERAS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

export function responder(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: CABECERAS });
}

function responderError(estado: number, codigo: CodigoError, campos?: ErroresRegistro): Response {
  const cuerpo: RespuestaError = { codigo, mensaje: MENSAJES[codigo], ...(campos ? { campos } : {}) };
  return responder(estado, cuerpo);
}

/** Errores de mysql2/Node que indican que no se pudo llegar a la base de datos. */
const ERRORES_CONEXION = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_DBACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_HOST_NOT_PRIVILEGED",
  "ER_CON_COUNT_ERROR",
]);

function codigoDe(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err) {
    const c = (err as { code: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

export function esDuplicado(err: unknown): boolean {
  return codigoDe(err) === "ER_DUP_ENTRY";
}

/** Convierte cualquier error en una respuesta. El detalle técnico solo va al log de Netlify. */
function convertirError(err: unknown): Response {
  if (err instanceof ErrorHttp) return responderError(err.estado, err.codigo, err.campos);

  if (err instanceof ErrorConfiguracion) {
    console.error("[config]", err.message);
    return responderError(503, "CONEXION");
  }
  const codigo = codigoDe(err);
  if (codigo && ERRORES_CONEXION.has(codigo)) {
    console.error("[mysql-conexion]", codigo, err instanceof Error ? err.message : err);
    return responderError(503, "CONEXION");
  }
  console.error("[error-interno]", err);
  return responderError(500, "INTERNO");
}

export function exigirSesion(req: Request): DatosSesion {
  const sesion = verificarToken(tokenDeCabecera(req.headers.get("authorization")), "sesion");
  if (!sesion) throw new ErrorHttp(401, "SESION");
  return sesion;
}

export async function leerJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const cuerpo: unknown = await req.json();
    if (typeof cuerpo === "object" && cuerpo !== null && !Array.isArray(cuerpo)) {
      return cuerpo as Record<string, unknown>;
    }
  } catch {
    /* cuerpo vacío o no es JSON */
  }
  throw new ErrorHttp(400, "DATOS_INVALIDOS");
}

/** Número entero positivo a partir de un valor recibido (query o JSON). */
export function leerId(valor: unknown): number {
  const n = typeof valor === "number" ? valor : typeof valor === "string" && /^\d+$/.test(valor) ? Number(valor) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new ErrorHttp(404, "NO_DISPONIBLE");
  return n;
}

/** Envuelve una Netlify Function: controla el método HTTP y los errores. */
export function manejador(metodo: "GET" | "POST", fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== metodo) return responderError(405, "METODO");
    try {
      return await fn(req);
    } catch (err) {
      return convertirError(err);
    }
  };
}
