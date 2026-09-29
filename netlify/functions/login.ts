import { CONTRASENA_INICIAL } from "../../src/lib/validacion";
import type { RespuestaLogin } from "../../src/types/usuario";
import { buscarEncargadoPorTelefono } from "../lib/consultas";
import { ErrorHttp, leerJson, manejador, responder } from "../lib/respuestas";
import { contrasenasIguales, crearToken } from "../lib/sesion";

/**
 * POST /api/login  { telefono, contrasena }
 *  → { cambioRequerido: false, usuario, token }            acceso normal
 *  → { cambioRequerido: true, tokenCambio, PerNombre }     contraseña inicial 123: debe cambiarla
 */
export default manejador("POST", async (req) => {
  const { telefono, contrasena } = await leerJson(req);
  const t = typeof telefono === "string" ? telefono.replace(/\s/g, "") : "";
  if (!/^\d{1,20}$/.test(t)) throw new ErrorHttp(422, "DATOS_INVALIDOS");
  if (typeof contrasena !== "string" || contrasena.length === 0 || contrasena.length > 100) {
    throw new ErrorHttp(401, "CONTRASENA_INCORRECTA");
  }

  const encargado = await buscarEncargadoPorTelefono(t);
  if (!encargado) throw new ErrorHttp(404, "NO_REGISTRADO");

  // Contraseña NULL: no puede ingresar hasta que la administración la resetee
  if (encargado.PerPassw === null) throw new ErrorHttp(403, "CONTRASENA_BLOQUEADA");

  if (!contrasenasIguales(contrasena, encargado.PerPassw)) throw new ErrorHttp(401, "CONTRASENA_INCORRECTA");

  const { usuario } = encargado;
  const respuesta: RespuestaLogin =
    encargado.PerPassw === CONTRASENA_INICIAL
      ? {
          cambioRequerido: true,
          tokenCambio: crearToken(usuario.IdPersonal, usuario.EmpId, "cambio"),
          PerNombre: usuario.PerNombre,
        }
      : { cambioRequerido: false, usuario, token: crearToken(usuario.IdPersonal, usuario.EmpId) };
  return responder(200, respuesta);
});
