import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { ErrorConfiguracion } from "./db";

/**
 * Tokens firmados (HMAC-SHA256) con IdPersonal y EmpId, para que el celular
 * no pueda cambiarlos y consultar datos de otro encargado.
 *  - "sesion": acceso normal a la app (12 horas).
 *  - "cambio": solo permite cambiar la contraseña inicial 123 (10 minutos).
 */

export type TipoToken = "sesion" | "cambio";

export interface DatosSesion {
  IdPersonal: number;
  EmpId: number;
  tipo: TipoToken;
  /** Vencimiento en milisegundos desde 1970. */
  exp: number;
}

const DURACION_MS: Record<TipoToken, number> = {
  sesion: 12 * 60 * 60 * 1000,
  cambio: 10 * 60 * 1000,
};

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

export function crearToken(IdPersonal: number, EmpId: number, tipo: TipoToken = "sesion"): string {
  const datos: DatosSesion = { IdPersonal, EmpId, tipo, exp: Date.now() + DURACION_MS[tipo] };
  const contenido = Buffer.from(JSON.stringify(datos)).toString("base64url");
  return `${contenido}.${firmar(contenido)}`;
}

/** Devuelve los datos del token o null si falta, está alterado, venció o es de otro tipo. */
export function verificarToken(token: string | null | undefined, tipo: TipoToken = "sesion"): DatosSesion | null {
  if (!token) return null;
  const [contenido, firma] = token.split(".");
  if (!contenido || !firma) return null;

  const esperada = Buffer.from(firmar(contenido));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  try {
    const datos = JSON.parse(Buffer.from(contenido, "base64url").toString("utf8")) as Partial<DatosSesion>;
    if (
      !Number.isInteger(datos.IdPersonal) ||
      !Number.isInteger(datos.EmpId) ||
      datos.tipo !== tipo ||
      typeof datos.exp !== "number" ||
      datos.exp < Date.now()
    ) {
      return null;
    }
    return { IdPersonal: datos.IdPersonal as number, EmpId: datos.EmpId as number, tipo, exp: datos.exp };
  } catch {
    return null;
  }
}

/** Token de la cabecera "Authorization: Bearer ...". */
export function tokenDeCabecera(cabecera: string | null): string | null {
  return cabecera?.startsWith("Bearer ") ? cabecera.slice(7) : null;
}

/** Compara contraseñas en tiempo constante (distingue mayúsculas y minúsculas). */
export function contrasenasIguales(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}
