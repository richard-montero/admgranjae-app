import type { RangoFechas } from "../types/cria";
import type {
  DatosRegistro,
  EntradaRegistro,
  EntradaTemperaturas,
  ErroresRegistro,
  Temperaturas,
} from "../types/registro";
import { esFechaISO, formatearFecha } from "./fechas";

/**
 * Reglas de validación del registro diario.
 * Las usan el formulario (src/) y el servidor (netlify/functions/registro.ts).
 */

type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

/** Máximo de una columna MEDIUMINT con signo (DtoMortalidad, DtoDescarte). */
export const MAX_MEDIUMINT = 8388607;

export function validarEnteroNoNegativo(texto: string): Resultado<number> {
  const t = texto.trim();
  if (t === "") return { ok: true, valor: 0 };
  if (!/^\d+$/.test(t)) return { ok: false, error: "Ingrese un número entero, sin decimales ni signos." };
  const n = Number(t);
  if (n > MAX_MEDIUMINT) return { ok: false, error: "El valor es demasiado grande." };
  return { ok: true, valor: n };
}

export function validarDecimal2(texto: string): Resultado<number> {
  const t = texto.trim().replace(",", ".");
  if (t === "") return { ok: true, valor: 0 };
  if (t.startsWith("-")) return { ok: false, error: "No se permiten valores negativos." };
  if (!/^\d+(\.\d+)?$/.test(t)) return { ok: false, error: "Ingrese un número válido. Ejemplo: 1250 o 1250,50" };
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return { ok: false, error: "Use como máximo 2 decimales." };
  return { ok: true, valor: Math.round(Number(t) * 100) / 100 };
}

export function validarTemperatura(texto: string): Resultado<number | null> {
  const t = texto.trim();
  if (t === "" || t === "-") return { ok: true, valor: null };
  if (!/^-?\d+$/.test(t)) return { ok: false, error: "Ingrese un número entero, sin decimales." };
  return { ok: true, valor: Number(t) };
}

export function validarFecha(fecha: string, rango: Pick<RangoFechas, "fechaMin" | "fechaMax">): Resultado<string> {
  const f = fecha.trim();
  if (!f) return { ok: false, error: "Seleccione la fecha del registro." };
  if (!esFechaISO(f)) return { ok: false, error: "La fecha no es válida." };
  if (f > rango.fechaMax) return { ok: false, error: "No se pueden registrar fechas futuras." };
  if (f < rango.fechaMin) return { ok: false, error: `La fecha debe ser desde el ${formatearFecha(rango.fechaMin)}.` };
  return { ok: true, valor: f };
}

export type ResultadoTemperaturas =
  | { valido: true; datos: Temperaturas }
  | { valido: false; errores: ErroresRegistro };

/** Validación del botón "Registrar temperatura": solo los 3 campos de temperatura. */
export function validarTemperaturas(entrada: EntradaTemperaturas): ResultadoTemperaturas {
  const tempMna = validarTemperatura(entrada.tempMna);
  const tempTarde = validarTemperatura(entrada.tempTarde);
  const tempNoche = validarTemperatura(entrada.tempNoche);

  if (!tempMna.ok || !tempTarde.ok || !tempNoche.ok) {
    const errores: ErroresRegistro = {};
    if (!tempMna.ok) errores.tempMna = tempMna.error;
    if (!tempTarde.ok) errores.tempTarde = tempTarde.error;
    if (!tempNoche.ok) errores.tempNoche = tempNoche.error;
    return { valido: false, errores };
  }
  return {
    valido: true,
    datos: { DtoTempMna: tempMna.valor, DtoTempTarde: tempTarde.valor, DtoTempNoche: tempNoche.valor },
  };
}

export type ResultadoRegistro =
  | { valido: true; datos: DatosRegistro }
  | { valido: false; errores: ErroresRegistro };

export function validarRegistro(
  entrada: EntradaRegistro,
  rango: Pick<RangoFechas, "fechaMin" | "fechaMax">,
): ResultadoRegistro {
  const fecha = validarFecha(entrada.fecha, rango);
  const mortalidad = validarEnteroNoNegativo(entrada.mortalidad);
  const descarte = validarEnteroNoNegativo(entrada.descarte);
  const pesoProm = validarDecimal2(entrada.pesoProm);
  const consumo = validarDecimal2(entrada.consumo);
  const tempMna = validarTemperatura(entrada.tempMna);
  const tempTarde = validarTemperatura(entrada.tempTarde);
  const tempNoche = validarTemperatura(entrada.tempNoche);

  const errores: ErroresRegistro = {};
  if (!fecha.ok) errores.fecha = fecha.error;
  if (!mortalidad.ok) errores.mortalidad = mortalidad.error;
  if (!descarte.ok) errores.descarte = descarte.error;
  if (!pesoProm.ok) errores.pesoProm = pesoProm.error;
  if (!consumo.ok) errores.consumo = consumo.error;
  if (!tempMna.ok) errores.tempMna = tempMna.error;
  if (!tempTarde.ok) errores.tempTarde = tempTarde.error;
  if (!tempNoche.ok) errores.tempNoche = tempNoche.error;

  if (
    !fecha.ok || !mortalidad.ok || !descarte.ok || !pesoProm.ok ||
    !consumo.ok || !tempMna.ok || !tempTarde.ok || !tempNoche.ok
  ) {
    return { valido: false, errores };
  }

  return {
    valido: true,
    datos: {
      DtoFecha: fecha.valor,
      DtoMortalidad: mortalidad.valor,
      DtoDescarte: descarte.valor,
      DtoPesoProm: pesoProm.valor,
      DtoConsumo: consumo.valor,
      DtoTempMna: tempMna.valor,
      DtoTempTarde: tempTarde.valor,
      DtoTempNoche: tempNoche.valor,
    },
  };
}

/* ---------- Contraseña del encargado (Emp_Personal.PerPassw, varchar(25)) ---------- */

/** Contraseña inicial al crear el encargado o al resetear su contraseña. */
export const CONTRASENA_INICIAL = "123";
export const CONTRASENA_MIN = 6;
export const CONTRASENA_MAX = 25;

/** Caracteres imprimibles que admite la columna (latin1): letras, números, símbolos, tildes y ñ. */
const CARACTERES_PERMITIDOS = /^[\x20-\x7E -ÿ]*$/;

/** Devuelve el error de la nueva contraseña o null si es válida. */
export function errorNuevaContrasena(nueva: string): string | null {
  if (nueva.length < CONTRASENA_MIN) return `Use al menos ${CONTRASENA_MIN} caracteres.`;
  if (nueva.length > CONTRASENA_MAX) return `Use como máximo ${CONTRASENA_MAX} caracteres.`;
  if (nueva !== nueva.trim()) return "No use espacios al inicio ni al final.";
  if (!CARACTERES_PERMITIDOS.test(nueva)) return "Use solo letras, números y símbolos comunes (sin emojis).";
  if (nueva === CONTRASENA_INICIAL) return "La nueva contraseña no puede ser 123.";
  return null;
}
