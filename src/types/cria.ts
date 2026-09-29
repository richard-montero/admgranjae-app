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

/** Unidad en que se registra el consumo de alimento del galpón (Emp_UndRecAli). */
export interface UnidadAlimento {
  IdUndAli: number;
  /** Nombre de la unidad que ve el encargado. */
  UndAliNom: string;
  /** Factor de conversión a kg: kg = valor ingresado × UndAliEqKg. */
  UndAliEqKg: number;
}

/** Datos de una cría para la pantalla de gestión. */
export interface CriaDetalle extends RangoFechas {
  IdCria: number;
  GlpNombre: string;
  IdGranja: number;
  GrjNombre: string;
  CrFecInicio: string;
  UltFecha: string | null;
  /** null si el galpón no tiene unidad de alimento configurada. */
  unidadAlimento: UnidadAlimento | null;
}
