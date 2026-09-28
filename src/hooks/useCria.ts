import { getCria } from "../lib/api";
import type { CriaDetalle } from "../types/cria";
import { useConsulta, type EstadoConsulta } from "./useConsulta";

/** Datos de la cría, última fecha registrada y rango de fechas permitido. */
export function useCria(idCria: number): EstadoConsulta<CriaDetalle> {
  return useConsulta((token) => getCria(token, idCria), [idCria]);
}
