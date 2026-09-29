import { getTemperaturasRegistro } from "../lib/api";
import type { RegistroTemperaturas } from "../types/registro";
import { useConsulta, type EstadoConsulta } from "./useConsulta";

/** Temperaturas del registro de la cría en esa fecha (null si no hay registro ese día). */
export function useTemperaturasRegistro(idCria: number, fecha: string): EstadoConsulta<RegistroTemperaturas | null> {
  return useConsulta((token) => getTemperaturasRegistro(token, idCria, fecha), [idCria, fecha]);
}
