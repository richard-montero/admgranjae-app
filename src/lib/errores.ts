import type { CodigoError } from "../types/api";
import type { ErroresRegistro } from "../types/registro";

/** Mensajes que ve el encargado. Los usan la app y las Netlify Functions. */
export const MENSAJES: Record<CodigoError, string> = {
  CONEXION: "No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.",
  NO_REGISTRADO: "Este número no está registrado. Verifique el número o consulte con la administración.",
  CONTRASENA_INCORRECTA: "La contraseña es incorrecta. Verifique e intente de nuevo.",
  CONTRASENA_BLOQUEADA:
    "No tiene una contraseña habilitada. Solicite a la administración que resetee su contraseña para poder ingresar.",
  CONTRASENA_INVALIDA:
    "La nueva contraseña debe tener entre 6 y 25 caracteres, sin espacios al inicio o al final, y no puede ser 123.",
  NO_DISPONIBLE: "Esta cría no está disponible o no está asignada a usted.",
  DUPLICADO: "Ya existe un registro para esa fecha en esta cría. Elija otra fecha.",
  SIN_REGISTRO:
    "No hay un registro de esta cría en esa fecha. Primero cargue los datos del día con «Registrar datos».",
  FECHA_FUERA_RANGO: "La fecha ya no está permitida. Vuelva a abrir la cría para ver el rango actualizado.",
  DATOS_INVALIDOS: "Revise los datos marcados.",
  SESION: "Su sesión terminó. Ingrese nuevamente.",
  METODO: "Operación no permitida.",
  INTERNO: "Ocurrió un error inesperado. Intente de nuevo en unos minutos.",
};

const CODIGOS = new Set<string>(Object.keys(MENSAJES));

export function esCodigoError(valor: unknown): valor is CodigoError {
  return typeof valor === "string" && CODIGOS.has(valor);
}

/** Error de la API ya traducido a un mensaje comprensible. */
export class ErrorApi extends Error {
  readonly codigo: CodigoError;
  readonly campos?: ErroresRegistro;

  constructor(codigo: CodigoError, campos?: ErroresRegistro, mensaje?: string) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = "ErrorApi";
    this.codigo = codigo;
    this.campos = campos;
  }
}

export function mensajeDeError(err: unknown): string {
  return err instanceof ErrorApi ? err.message : MENSAJES.INTERNO;
}
