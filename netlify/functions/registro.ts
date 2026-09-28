import { calcularRango } from "../../src/lib/fechas";
import { validarRegistro } from "../../src/lib/validacion";
import type { EntradaRegistro } from "../../src/types/registro";
import { buscarCriaAsignada, insertarRegistroCria, obtenerFechasCria } from "../lib/consultas";
import { ErrorHttp, esDuplicado, exigirSesion, leerId, leerJson, manejador, responder } from "../lib/respuestas";

/** Convierte un valor recibido en texto para aplicar las mismas reglas del formulario. */
function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  if (typeof valor === "string") return valor;
  return "\u0000"; // tipo no admitido: falla la validación
}

/**
 * POST /api/registro
 * { idCria, DtoFecha, DtoMortalidad, DtoDescarte, DtoPesoProm, DtoConsumo,
 *   DtoTempMna, DtoTempTarde, DtoTempNoche }
 */
export default manejador("POST", async (req) => {
  const sesion = exigirSesion(req);
  const cuerpo = await leerJson(req);
  const idCria = leerId(cuerpo.idCria);

  // 1. La cría debe estar activa y asignada a este encargado
  const cria = await buscarCriaAsignada(idCria, sesion.IdPersonal, sesion.EmpId);
  if (!cria) throw new ErrorHttp(404, "NO_DISPONIBLE");

  // 2. Rango de fechas recalculado en el servidor (no se confía en el celular)
  const fechas = await obtenerFechasCria(idCria);
  if (!fechas) throw new ErrorHttp(404, "NO_DISPONIBLE");
  const rango = calcularRango(fechas.UltFecha, fechas.CrFecInicio);

  // 3. Mismas validaciones que el formulario
  const entrada: EntradaRegistro = {
    fecha: aTexto(cuerpo.DtoFecha),
    mortalidad: aTexto(cuerpo.DtoMortalidad),
    descarte: aTexto(cuerpo.DtoDescarte),
    pesoProm: aTexto(cuerpo.DtoPesoProm),
    consumo: aTexto(cuerpo.DtoConsumo),
    tempMna: aTexto(cuerpo.DtoTempMna),
    tempTarde: aTexto(cuerpo.DtoTempTarde),
    tempNoche: aTexto(cuerpo.DtoTempNoche),
  };
  const resultado = validarRegistro(entrada, rango);
  if (!resultado.valido) {
    const soloFecha = Object.keys(resultado.errores).every((c) => c === "fecha");
    if (soloFecha && fechas.UltFecha && entrada.fecha.trim() === fechas.UltFecha) {
      // Otra persona registró esa misma fecha mientras se llenaba el formulario
      throw new ErrorHttp(409, "DUPLICADO");
    }
    throw new ErrorHttp(422, soloFecha ? "FECHA_FUERA_RANGO" : "DATOS_INVALIDOS", resultado.errores);
  }

  // 4. Insertar. El índice UNIQUE CriaFecha (DtoIdCria, DtoFecha) impide duplicados
  try {
    const idDto = await insertarRegistroCria(idCria, resultado.datos);
    return responder(201, { ok: true, IdDto: idDto });
  } catch (err) {
    if (esDuplicado(err)) throw new ErrorHttp(409, "DUPLICADO");
    throw err;
  }
});
