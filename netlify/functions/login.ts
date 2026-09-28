import { buscarEncargadoPorTelefono } from "../lib/consultas";
import { ErrorHttp, leerJson, manejador, responder } from "../lib/respuestas";
import { crearToken } from "../lib/sesion";

/** POST /api/login  { telefono }  →  { usuario, token } */
export default manejador("POST", async (req) => {
  const { telefono } = await leerJson(req);
  const t = typeof telefono === "string" ? telefono.replace(/\s/g, "") : "";
  if (!/^\d{1,20}$/.test(t)) throw new ErrorHttp(422, "DATOS_INVALIDOS");

  const usuario = await buscarEncargadoPorTelefono(t);
  if (!usuario) throw new ErrorHttp(404, "NO_REGISTRADO");

  return responder(200, { usuario, token: crearToken(usuario.IdPersonal, usuario.EmpId) });
});
