import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cargando } from "../components/Cargando";
import { FichaCria } from "../components/FichaCria";
import { MensajeError } from "../components/MensajeError";
import { TemperaturasForm } from "../components/TemperaturasForm";
import { VolverAMisCrias } from "../components/VolverAMisCrias";
import { useCria } from "../hooks/useCria";
import { useIdCria } from "../hooks/useIdCria";
import { useTemperaturasRegistro } from "../hooks/useTemperaturasRegistro";
import { MENSAJES } from "../lib/errores";
import { esFechaISO, formatearFecha } from "../lib/fechas";
import type { CriaDetalle } from "../types/cria";
import type { AvisoGuardado } from "./Inicio";

/** /cria/:id/temperatura — modificar temperaturas de fechas ya registradas. */
export function TemperaturaCria() {
  const idCria = useIdCria();

  if (idCria === null) {
    return (
      <main className="pagina">
        <MensajeError>{MENSAJES.NO_DISPONIBLE}</MensajeError>
        <VolverAMisCrias />
      </main>
    );
  }
  return <TemperaturaCriaValida key={idCria} idCria={idCria} />;
}

function TemperaturaCriaValida({ idCria }: { idCria: number }) {
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

  return (
    <main className="pagina">
      <FichaCria cria={cria} />
      <h2 className="pagina__titulo">Registrar temperatura</h2>
      {cria.UltFecha ? (
        <SelectorFecha cria={cria} ultFecha={cria.UltFecha} />
      ) : (
        <div className="aviso aviso--info" role="status">
          <p className="aviso__titulo">Esta cría todavía no tiene registros</p>
          <p className="aviso__detalle">
            Las temperaturas solo se pueden modificar en fechas ya registradas. Primero cargue los datos del día con
            «Registrar datos».
          </p>
          <VolverAMisCrias />
        </div>
      )}
    </main>
  );
}

function SelectorFecha({ cria, ultFecha }: { cria: CriaDetalle; ultFecha: string }) {
  const [fecha, setFecha] = useState(ultFecha);
  const fueraDeRango = !esFechaISO(fecha) || fecha < cria.CrFecInicio || fecha > ultFecha;

  return (
    <>
      <div className={`campo${fueraDeRango ? " campo--error" : ""}`}>
        <label htmlFor="fecha" className="campo__etiqueta">
          Fecha del registro
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          className="campo__fecha"
          min={cria.CrFecInicio}
          max={ultFecha}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          aria-invalid={fueraDeRango || undefined}
          aria-describedby="fecha-descripcion"
        />
        <p className={fueraDeRango ? "campo__error" : "campo__ayuda"} id="fecha-descripcion">
          {fueraDeRango
            ? `Elija una fecha entre el ${formatearFecha(cria.CrFecInicio)} y el ${formatearFecha(ultFecha)}.`
            : "Solo se modifican las temperaturas; los demás datos del día no cambian."}
        </p>
      </div>
      {fueraDeRango ? <VolverAMisCrias /> : <EditorTemperaturas key={fecha} cria={cria} fecha={fecha} />}
    </>
  );
}

function EditorTemperaturas({ cria, fecha }: { cria: CriaDetalle; fecha: string }) {
  const navegar = useNavigate();
  const { datos: registro, error, cargando, recargar } = useTemperaturasRegistro(cria.IdCria, fecha);

  if (cargando) return <Cargando texto="Buscando el registro de esa fecha..." />;
  if (error) return <MensajeError onReintentar={recargar}>{error}</MensajeError>;

  if (!registro) {
    return (
      <>
        <div className="aviso aviso--error" role="alert">
          <p>{MENSAJES.SIN_REGISTRO}</p>
        </div>
        <VolverAMisCrias />
      </>
    );
  }

  const alGuardar = () => {
    const exito: AvisoGuardado = {
      titulo: "Temperaturas actualizadas",
      galpon: cria.GlpNombre,
      idCria: cria.IdCria,
      fecha,
    };
    navegar("/", { state: { exito } });
  };

  return <TemperaturasForm idCria={cria.IdCria} registro={registro} onGuardado={alGuardar} />;
}
