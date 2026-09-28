import type { CriaResumen } from "./cria";

/** Granja con sus crías activas asignadas al encargado. */
export interface Granja {
  IdGranja: number;
  GrjNombre: string;
  crias: CriaResumen[];
}
