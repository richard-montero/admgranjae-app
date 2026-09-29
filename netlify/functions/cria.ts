import { calcularRango } from "../../src/lib/fechas";
import type { CriaDetalle } from "../../src/types/cria";
import { buscarCriaAsignada, obtenerFechasCria, obtenerUnidadAlimento } from "../lib/consultas";
import { ErrorHttp, exigirSesion, leerId, manejador, responder } from "../lib/respuestas";

/** GET /api/cria?id=8  →  CriaDetalle (datos, última fecha y rango permitido) */
export default manejador("GET", async (req) => {
  const sesion = exigirSesion(req);
  const idCria = leerId(new URL(req.url).searchParams.get("id"));

  const cria = await buscarCriaAsignada(idCria, sesion.IdPersonal, sesion.EmpId);
  if (!cria) throw new ErrorHttp(404, "NO_DISPONIBLE");

  const fechas = await obtenerFechasCria(idCria);
  if (!fechas) throw new ErrorHttp(404, "NO_DISPONIBLE");

  const detalle: CriaDetalle = {
    ...cria,
    CrFecInicio: fechas.CrFecInicio,
    UltFecha: fechas.UltFecha,
    ...calcularRango(fechas.UltFecha, fechas.CrFecInicio),
    unidadAlimento: await obtenerUnidadAlimento(idCria),
  };
  return responder(200, detalle);
});
