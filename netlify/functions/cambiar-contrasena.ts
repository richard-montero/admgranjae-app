import { CONTRASENA_INICIAL, errorNuevaContrasena } from "../../src/lib/validacion";
import type { Sesion } from "../../src/types/usuario";
import { buscarEncargadoPorId, cambiarContrasenaInicial } from "../lib/consultas";
import { ErrorHttp, leerJson, manejador, responder } from "../lib/respuestas";
import { crearToken, verificarToken } from "../lib/sesion";

/**
 * POST /api/cambiar-contrasena  { tokenCambio, nueva }  →  { usuario, token }
 * Solo reemplaza la contraseña inicial (123). El tokenCambio lo entrega /api/login
 * después de verificar teléfono y contraseña 123, y vence en 10 minutos.
 */
export default manejador("POST", async (req) => {
  const { tokenCambio, nueva } = await leerJson(req);

  const datos = verificarToken(typeof tokenCambio === "string" ? tokenCambio : null, "cambio");
  if (!datos) throw new ErrorHttp(401, "SESION");

  if (typeof nueva !== "string" || errorNuevaContrasena(nueva)) {
    throw new ErrorHttp(422, "CONTRASENA_INVALIDA");
  }

  // Solo se actualiza si la contraseña guardada sigue siendo la inicial
  const cambiada = await cambiarContrasenaInicial(datos.IdPersonal, CONTRASENA_INICIAL, nueva);
  if (!cambiada) throw new ErrorHttp(401, "SESION");

  const encargado = await buscarEncargadoPorId(datos.IdPersonal);
  if (!encargado) throw new ErrorHttp(404, "NO_REGISTRADO");

  const { usuario } = encargado;
  const sesion: Sesion = { usuario, token: crearToken(usuario.IdPersonal, usuario.EmpId) };
  return responder(200, sesion);
});
