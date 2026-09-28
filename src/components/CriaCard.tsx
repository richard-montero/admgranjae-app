import { Link } from "react-router-dom";
import type { CriaResumen } from "../types/cria";

export function CriaCard({ cria }: { cria: CriaResumen }) {
  return (
    <li className="cria">
      <div className="cria__datos">
        <span className="cria__galpon">{cria.GlpNombre}</span>
        <span className="cria__id">Cría N.º {cria.IdCria}</span>
      </div>
      <Link className="boton boton--primario" to={`/cria/${cria.IdCria}`}>
        Registrar datos
      </Link>
    </li>
  );
}
