import { useNavigate } from "react-router-dom";
import { Cargando } from "../components/Cargando";
import { FichaCria } from "../components/FichaCria";
import { MensajeError } from "../components/MensajeError";
import { RegistroCriaForm } from "../components/RegistroCriaForm";
import { VolverAMisCrias } from "../components/VolverAMisCrias";
import { useCria } from "../hooks/useCria";
import { useIdCria } from "../hooks/useIdCria";
import { MENSAJES } from "../lib/errores";
import { formatearFecha } from "../lib/fechas";
import type { DatosRegistro } from "../types/registro";
import type { AvisoGuardado } from "./Inicio";

export function GestionCria() {
  const idCria = useIdCria();

  if (idCria === null) {
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
    const exito: AvisoGuardado = {
      titulo: "Registro guardado",
      galpon: cria.GlpNombre,
      idCria: cria.IdCria,
      fecha: datos.DtoFecha,
    };
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
