import type { RangoFechas } from "../types/cria";

/** "Hoy" se calcula siempre con la hora de Bolivia. */
export const ZONA_HORARIA = "America/La_Paz";

const FORMATO_ISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha actual en Bolivia con formato AAAA-MM-DD. */
export function hoyISO(ahora: Date = new Date()): string {
  return FORMATO_ISO.format(ahora);
}

export function esFechaISO(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

export function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** AAAA-MM-DD → DD/MM/AAAA */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/**
 * Regla de negocio §12:
 *   fecha mínima = UltFecha + 1 día, o CrFecInicio si no hay registros
 *   fecha máxima = hoy
 */
export function calcularRango(ultFecha: string | null, crFecInicio: string, hoy: string = hoyISO()): RangoFechas {
  const fechaMin = ultFecha ? sumarDias(ultFecha.slice(0, 10), 1) : crFecInicio.slice(0, 10);
  return { fechaMin, fechaMax: hoy, alDia: fechaMin > hoy };
}
