import type { Granja } from "../../src/types/granja";
import { listarCriasActivas } from "../lib/consultas";
import { exigirSesion, manejador, responder } from "../lib/respuestas";

/** GET /api/granjas  →  Granja[] (crías activas agrupadas por granja) */
export default manejador("GET", async (req) => {
  const sesion = exigirSesion(req);
  const filas = await listarCriasActivas(sesion.IdPersonal, sesion.EmpId);

  const granjas: Granja[] = [];
  for (const f of filas) {
    let granja = granjas.find((g) => g.IdGranja === f.IdGranja);
    if (!granja) {
      granja = { IdGranja: f.IdGranja, GrjNombre: f.GrjNombre, crias: [] };
      granjas.push(granja);
    }
    granja.crias.push({ IdCria: f.IdCria, GlpNombre: f.GlpNombre });
  }
  return responder(200, granjas);
});
