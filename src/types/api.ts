import type { ErroresRegistro } from "./registro";

export type CodigoError =
  | "CONEXION"
  | "NO_REGISTRADO"
  | "NO_DISPONIBLE"
  | "DUPLICADO"
  | "FECHA_FUERA_RANGO"
  | "DATOS_INVALIDOS"
  | "SESION"
  | "METODO"
  | "INTERNO";

/** Cuerpo de las respuestas de error de la API. */
export interface RespuestaError {
  codigo: CodigoError;
  mensaje: string;
  campos?: ErroresRegistro;
}
