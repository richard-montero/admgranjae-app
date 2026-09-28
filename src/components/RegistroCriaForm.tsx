import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useSesionActiva } from "../hooks/useUsuario";
import { insertarRegistroCria } from "../lib/api";
import { ErrorApi, mensajeDeError } from "../lib/errores";
import { formatearFecha } from "../lib/fechas";
import { validarRegistro } from "../lib/validacion";
import type { CriaDetalle } from "../types/cria";
import type { CampoRegistro, DatosRegistro, EntradaRegistro, ErroresRegistro } from "../types/registro";
import { CampoNumero } from "./CampoNumero";
import { MensajeError } from "./MensajeError";

const ORDEN_CAMPOS: CampoRegistro[] = [
  "fecha",
  "mortalidad",
  "descarte",
  "pesoProm",
  "consumo",
  "tempMna",
  "tempTarde",
  "tempNoche",
];

interface Props {
  cria: CriaDetalle;
  onGuardado: (datos: DatosRegistro) => void;
}

export function RegistroCriaForm({ cria, onGuardado }: Props) {
  const { token, salir } = useSesionActiva();
  const [entrada, setEntrada] = useState<EntradaRegistro>({
    fecha: cria.fechaMin,
    mortalidad: "",
    descarte: "",
    pesoProm: "",
    consumo: "",
    tempMna: "",
    tempTarde: "",
    tempNoche: "",
  });
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const refForm = useRef<HTMLFormElement>(null);

  const cambiar = (campo: CampoRegistro) => (valor: string) => {
    setEntrada((e) => ({ ...e, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const mostrarErrores = (nuevos: ErroresRegistro) => {
    setErrores(nuevos);
    const primero = ORDEN_CAMPOS.find((c) => nuevos[c]);
    if (primero) refForm.current?.querySelector<HTMLElement>(`#${primero}`)?.focus();
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setErrorGeneral("");

    const resultado = validarRegistro(entrada, cria);
    if (!resultado.valido) {
      mostrarErrores(resultado.errores);
      return;
    }

    setGuardando(true);
    try {
      await insertarRegistroCria(token, cria.IdCria, resultado.datos);
      onGuardado(resultado.datos);
    } catch (err) {
      setGuardando(false);
      if (err instanceof ErrorApi && err.codigo === "SESION") {
        salir();
        return;
      }
      if (err instanceof ErrorApi && err.campos) mostrarErrores(err.campos);
      setErrorGeneral(mensajeDeError(err));
    }
  };

  const ayudaFecha =
    cria.fechaMin === cria.fechaMax
      ? `Solo se puede registrar hoy, ${formatearFecha(cria.fechaMax)}.`
      : `Permitido del ${formatearFecha(cria.fechaMin)} al ${formatearFecha(cria.fechaMax)}.`;

  return (
    <form className="formulario" onSubmit={guardar} noValidate ref={refForm}>
      <div className={`campo${errores.fecha ? " campo--error" : ""}`}>
        <label htmlFor="fecha" className="campo__etiqueta">
          Fecha del registro
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          className="campo__fecha"
          min={cria.fechaMin}
          max={cria.fechaMax}
          value={entrada.fecha}
          disabled={guardando}
          onChange={(e) => cambiar("fecha")(e.target.value)}
          aria-invalid={errores.fecha ? true : undefined}
          aria-describedby="fecha-descripcion"
        />
        <p className={errores.fecha ? "campo__error" : "campo__ayuda"} id="fecha-descripcion">
          {errores.fecha ?? ayudaFecha}
        </p>
      </div>

      <fieldset className="grupo">
        <legend>Aves</legend>
        <div className="grupo__fila">
          <CampoNumero id="mortalidad" etiqueta="Mortalidad" ayuda="Vacío = 0" modo="numeric" placeholder="0"
            valor={entrada.mortalidad} onCambio={cambiar("mortalidad")} error={errores.mortalidad}
            deshabilitado={guardando} />
          <CampoNumero id="descarte" etiqueta="Descarte" ayuda="Vacío = 0" modo="numeric" placeholder="0"
            valor={entrada.descarte} onCambio={cambiar("descarte")} error={errores.descarte}
            deshabilitado={guardando} />
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend>Peso y alimento</legend>
        <div className="grupo__fila">
          <CampoNumero id="pesoProm" etiqueta="Peso promedio (g)" ayuda="Hasta 2 decimales" modo="decimal"
            placeholder="0" valor={entrada.pesoProm} onCambio={cambiar("pesoProm")} error={errores.pesoProm}
            deshabilitado={guardando} />
          <CampoNumero id="consumo" etiqueta="Consumo (g)" ayuda="Hasta 2 decimales" modo="decimal"
            placeholder="0" valor={entrada.consumo} onCambio={cambiar("consumo")} error={errores.consumo}
            deshabilitado={guardando} />
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend>
          Temperaturas (°C) <span className="grupo__nota">opcionales</span>
        </legend>
        <div className="grupo__temps">
          <CampoNumero id="tempMna" etiqueta="Mañana 10:00" modo="numeric" placeholder="—" conSigno
            valor={entrada.tempMna} onCambio={cambiar("tempMna")} error={errores.tempMna}
            deshabilitado={guardando} />
          <CampoNumero id="tempTarde" etiqueta="Tarde" modo="numeric" placeholder="—" conSigno
            valor={entrada.tempTarde} onCambio={cambiar("tempTarde")} error={errores.tempTarde}
            deshabilitado={guardando} />
          <CampoNumero id="tempNoche" etiqueta="Noche" modo="numeric" placeholder="—" conSigno
            valor={entrada.tempNoche} onCambio={cambiar("tempNoche")} error={errores.tempNoche}
            deshabilitado={guardando} />
        </div>
        <p className="campo__ayuda">Use ± para temperaturas bajo cero. Vacío = sin dato.</p>
      </fieldset>

      {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}

      <div className="formulario__acciones">
        <button type="submit" className="boton boton--primario boton--grande" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        <Link to="/" className="boton boton--fantasma" aria-disabled={guardando || undefined}>
          Volver a mis crías
        </Link>
      </div>
    </form>
  );
}
