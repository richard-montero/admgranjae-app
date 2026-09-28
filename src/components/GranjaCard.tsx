import type { Granja } from "../types/granja";
import { CriaCard } from "./CriaCard";

export function GranjaCard({ granja }: { granja: Granja }) {
  const idTitulo = `granja-${granja.IdGranja}`;
  const n = granja.crias.length;
  return (
    <section className="granja" aria-labelledby={idTitulo}>
      <h2 className="granja__nombre" id={idTitulo}>
        {granja.GrjNombre}
        <span className="granja__conteo">
          {n} {n === 1 ? "cría activa" : "crías activas"}
        </span>
      </h2>
      <ul className="granja__crias">
        {granja.crias.map((c) => (
          <CriaCard key={c.IdCria} cria={c} />
        ))}
      </ul>
    </section>
  );
}
