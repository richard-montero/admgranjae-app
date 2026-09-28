import { Link, useNavigate, useParams } from "react-router-dom";
import { Cargando } from "../components/Cargando";
import { MensajeError } from "../components/MensajeError";
import { RegistroCriaForm } from "../components/RegistroCriaForm";
import { useCria } from "../hooks/useCria";
import { MENSAJES } from "../lib/errores";
import { formatearFecha } from "../lib/fechas";
import type { CriaDetalle } from "../types/cria";
import type { DatosRegistro } from "../types/registro";
import type { AvisoGuardado } from "./Inicio";

function VolverAMisCrias() {
  return (
    <Link to="/" className="boton boton--fantasma">
      Volver a mis crías
    </Link>
  );
}

export function GestionCria() {
  const { id } = useParams();
  const idCria = id && /^\d+$/.test(id) ? Number(id) : null;

  if (idCria === null || idCria <= 0) {
    return (
      <main className="pagina">
        <MensajeError>{MENSAJES.NO_DISPONIBLE}</MensajeError>
        <VolverAMisCrias />
      </main>
    );
  }
  return <GestionCriaValida key={idCria} idCria={idCria} />;
}

function GestionCriaValida({ idCria }: { idCria: number }) {
  const navegar = useNavigate();
  const { datos: cria, error, cargando, recargar } = useCria(idCria);

  if (cargando) {
    return (
      <main className="pagina">
        <Cargando texto="Cargando datos de la cría..." />
      </main>
    );
  }

  if (error || !cria) {
    return (
      <main className="pagina">
        <MensajeError onReintentar={recargar}>{error || MENSAJES.NO_DISPONIBLE}</MensajeError>
        <VolverAMisCrias />
      </main>
    );
  }

  const alGuardar = (datos: DatosRegistro) => {
    const exito: AvisoGuardado = { galpon: cria.GlpNombre, idCria: cria.IdCria, fecha: datos.DtoFecha };
    navegar("/", { state: { exito } });
  };

  return (
    <main className="pagina">
      <FichaCria cria={cria} />
      {cria.alDia ? (
        <div className="aviso aviso--info" role="status">
          <p className="aviso__titulo">Esta cría está al día</p>
          <p className="aviso__detalle">
            Ya se registró el {formatearFecha(cria.UltFecha)}. El próximo registro se podrá cargar desde el{" "}
            {formatearFecha(cria.fechaMin)}.
          </p>
          <VolverAMisCrias />
        </div>
      ) : (
        <RegistroCriaForm cria={cria} onGuardado={alGuardar} />
      )}
    </main>
  );
}

function FichaCria({ cria }: { cria: CriaDetalle }) {
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
