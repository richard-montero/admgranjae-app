import { createHmac, timingSafeEqual } from "node:crypto";
import { ErrorConfiguracion } from "./db";

/**
 * Token de sesión firmado (HMAC-SHA256). Guarda IdPersonal y EmpId para que
 * el celular no pueda cambiarlos y consultar datos de otro encargado.
 */

export interface DatosSesion {
  IdPersonal: number;
  EmpId: number;
  /** Vencimiento en milisegundos desde 1970. */
  exp: number;
}

const DURACION_MS = 12 * 60 * 60 * 1000; // 12 horas

function clave(): string {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new ErrorConfiguracion("SESSION_SECRET no está configurada o tiene menos de 32 caracteres");
  }
  return secreto;
}

function firmar(contenido: string): string {
  return createHmac("sha256", clave()).update(contenido).digest("base64url");
}

export function crearToken(IdPersonal: number, EmpId: number): string {
  const datos: DatosSesion = { IdPersonal, EmpId, exp: Date.now() + DURACION_MS };
  const contenido = Buffer.from(JSON.stringify(datos)).toString("base64url");
  return `${contenido}.${firmar(contenido)}`;
}

/** Devuelve los datos de la sesión o null si el token falta, está alterado o venció. */
export function verificarToken(cabecera: string | null): DatosSesion | null {
  if (!cabecera?.startsWith("Bearer ")) return null;
  const [contenido, firma] = cabecera.slice(7).split(".");
  if (!contenido || !firma) return null;

  const esperada = Buffer.from(firmar(contenido));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  try {
    const datos = JSON.parse(Buffer.from(contenido, "base64url").toString("utf8")) as Partial<DatosSesion>;
    if (
      !Number.isInteger(datos.IdPersonal) ||
      !Number.isInteger(datos.EmpId) ||
      typeof datos.exp !== "number" ||
      datos.exp < Date.now()
    ) {
      return null;
    }
    return { IdPersonal: datos.IdPersonal as number, EmpId: datos.EmpId as number, exp: datos.exp };
  } catch {
    return null;
  }
}
