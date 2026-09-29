/** Valores tal como los escribe el usuario en el formulario. */
export interface EntradaRegistro {
  fecha: string;
  mortalidad: string;
  descarte: string;
  pesoProm: string;
  consumo: string;
  tempMna: string;
  tempTarde: string;
  tempNoche: string;
}

export type CampoRegistro = keyof EntradaRegistro;

/** Errores de validación por campo del formulario. */
export type ErroresRegistro = Partial<Record<CampoRegistro, string>>;

/** Campos de temperatura del formulario (texto tal como se escribe). */
export type EntradaTemperaturas = Pick<EntradaRegistro, "tempMna" | "tempTarde" | "tempNoche">;

/** Temperaturas validadas (columnas de AVEnG_Cria_Dto). */
export interface Temperaturas {
  DtoTempMna: number | null;
  DtoTempTarde: number | null;
  DtoTempNoche: number | null;
}

/** Temperaturas de un registro existente de una fecha. */
export interface RegistroTemperaturas extends Temperaturas {
  DtoFecha: string;
}

/** Datos validados, con los nombres de columna de AVEnG_Cria_Dto. */
export interface DatosRegistro {
  DtoFecha: string;
  DtoMortalidad: number;
  DtoDescarte: number;
  DtoPesoProm: number;
  DtoConsumo: number;
  DtoTempMna: number | null;
  DtoTempTarde: number | null;
  DtoTempNoche: number | null;
}
