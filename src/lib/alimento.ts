import type { UnidadAlimento } from "../types/cria";

/**
 * Consumo de alimento: el encargado lo escribe en la unidad del galpón
 * (Emp_UndRecAli.UndAliNom) y se guarda en DtoConsumo convertido a kg:
 *   DtoConsumo = valor ingresado × UndAliEqKg
 * Lo usan el formulario (vista previa) y el servidor (valor que se guarda).
 */

export const MENSAJE_SIN_UNIDAD =
  "El galpón no tiene una unidad de alimento configurada. Deje el consumo vacío o consulte con la administración.";

/** La unidad sirve para convertir solo si tiene un factor numérico mayor que cero. */
export function unidadValida(unidad: UnidadAlimento | null): unidad is UnidadAlimento {
  return unidad !== null && Number.isFinite(unidad.UndAliEqKg) && unidad.UndAliEqKg > 0;
}

/** Valor en la unidad del galpón → kg, redondeado a 2 decimales (DtoConsumo). */
export function convertirConsumoAKg(valor: number, unidad: UnidadAlimento): number {
  return Math.round(valor * unidad.UndAliEqKg * 100) / 100;
}

/**
 * Sin unidad válida no hay factor para convertir: solo se acepta consumo 0 (o vacío).
 * Devuelve el mensaje de error o null si el consumo se puede guardar.
 */
export function errorConsumoSinUnidad(valor: number, unidad: UnidadAlimento | null): string | null {
  return valor > 0 && !unidadValida(unidad) ? MENSAJE_SIN_UNIDAD : null;
}
