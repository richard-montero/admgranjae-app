import { formatearFecha } from "../lib/fechas";
import type { CriaDetalle } from "../types/cria";

/** Granja, galpón, número de cría, fecha de inicio y último registro. */
export function FichaCria({ cria }: { cria: CriaDetalle }) {
  return (
    <section className="ficha" aria-label="Datos de la cría">
      <p className="etiqueta">{cria.GrjNombre}</p>
      <h2 className="ficha__titulo">
        {cria.GlpNombre} <span className="ficha__id">Cría N.º {cria.IdCria}</span>
      </h2>
      <dl className="ficha__fechas">
        <div>
          <dt>Inicio de la cría</dt>
          <dd>{formatearFecha(cria.CrFecInicio)}</dd>
        </div>
        <div>
          <dt>Último registro</dt>
          <dd>{cria.UltFecha ? formatearFecha(cria.UltFecha) : "Sin registros"}</dd>
        </div>
      </dl>
    </section>
  );
}
