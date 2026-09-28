import { getGranjasByEncargado } from "../lib/api";
import type { Granja } from "../types/granja";
import { useConsulta, type EstadoConsulta } from "./useConsulta";

export function useGranjas(): EstadoConsulta<Granja[]> {
  return useConsulta(getGranjasByEncargado, []);
}
