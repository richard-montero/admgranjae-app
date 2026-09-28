/** Cría tal como aparece en la lista de la pantalla de inicio. */
export interface CriaResumen {
  IdCria: number;
  GlpNombre: string;
}

/** Rango de fechas permitido para el siguiente registro diario (AAAA-MM-DD). */
export interface RangoFechas {
  fechaMin: string;
  fechaMax: string;
  /** true cuando no queda ninguna fecha disponible (fechaMin > hoy). */
  alDia: boolean;
}

/** Datos de una cría para la pantalla de gestión. */
export interface CriaDetalle extends RangoFechas {
  IdCria: number;
  GlpNombre: string;
  IdGranja: number;
  GrjNombre: string;
  CrFecInicio: string;
  UltFecha: string | null;
}
