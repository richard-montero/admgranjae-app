import { esFechaISO } from "../../src/lib/fechas";
import { validarTemperaturas } from "../../src/lib/validacion";
import { actualizarTemperaturas, buscarCriaAsignada, obtenerTemperaturasRegistro } from "../lib/consultas";
import { ErrorHttp, exigirSesion, leerId, leerJson, manejador, responder } from "../lib/respuestas";
import type { DatosSesion } from "../lib/sesion";

/** La cría debe estar activa y asignada a este encargado. */
async function exigirCriaAsignada(idCria: number, sesion: DatosSesion): Promise<void> {
  const cria = await buscarCriaAsignada(idCria, sesion.IdPersonal, sesion.EmpId);
  if (!cria) throw new ErrorHttp(404, "NO_DISPONIBLE");
}

function leerFecha(valor: unknown): string {
  const fecha = typeof valor === "string" ? valor.trim() : "";
  if (!esFechaISO(fecha)) throw new ErrorHttp(422, "DATOS_INVALIDOS", { fecha: "La fecha no es válida." });
  return fecha;
}

function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  if (typeof valor === "string") return valor;
  return "\u0000"; // tipo no admitido: falla la validación
}

/** GET /api/temperatura?id=8&fecha=2026-09-27  →  { registro: RegistroTemperaturas | null } */
const consultar = manejador("GET", async (req) => {
  const sesion = exigirSesion(req);
  const parametros = new URL(req.url).searchParams;
  const idCria = leerId(parametros.get("id"));
  const fecha = leerFecha(parametros.get("fecha"));

  await exigirCriaAsignada(idCria, sesion);
  return responder(200, { registro: await obtenerTemperaturasRegistro(idCria, fecha) });
});

/**
 * POST /api/temperatura
 * { idCria, fecha, DtoTempMna, DtoTempTarde, DtoTempNoche }
 * Modifica SOLO las temperaturas de un registro que ya existe.
 */
const guardar = manejador("POST", async (req) => {
  const sesion = exigirSesion(req);
  const cuerpo = await leerJson(req);
  const idCria = leerId(cuerpo.idCria);
  const fecha = leerFecha(cuerpo.fecha);

  await exigirCriaAsignada(idCria, sesion);

  // Sin registro de esa cría en esa fecha no se permite modificar la temperatura
  if (!(await obtenerTemperaturasRegistro(idCria, fecha))) throw new ErrorHttp(404, "SIN_REGISTRO");

  const resultado = validarTemperaturas({
    tempMna: aTexto(cuerpo.DtoTempMna),
    tempTarde: aTexto(cuerpo.DtoTempTarde),
    tempNoche: aTexto(cuerpo.DtoTempNoche),
  });
  if (!resultado.valido) throw new ErrorHttp(422, "DATOS_INVALIDOS", resultado.errores);

  await actualizarTemperaturas(idCria, fecha, resultado.datos);
  return responder(200, { ok: true });
});

export default (req: Request): Promise<Response> => (req.method === "POST" ? guardar(req) : consultar(req));
