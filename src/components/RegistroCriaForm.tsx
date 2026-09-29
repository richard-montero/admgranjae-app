import { useRef, useState, type FormEvent } from "react";
import { useSesionActiva } from "../hooks/useUsuario";
import { insertarRegistroCria } from "../lib/api";
import { ErrorApi, mensajeDeError } from "../lib/errores";
import { formatearFecha } from "../lib/fechas";
import { convertirConsumoAKg, errorConsumoSinUnidad, unidadValida } from "../lib/alimento";
import { validarDecimal2, validarRegistro } from "../lib/validacion";
import type { CriaDetalle } from "../types/cria";
import type { CampoRegistro, DatosRegistro, EntradaRegistro, ErroresRegistro } from "../types/registro";
import { CampoNumero } from "./CampoNumero";
import { CamposTemperatura } from "./CamposTemperatura";
import { MensajeError } from "./MensajeError";
import { VolverAMisCrias } from "./VolverAMisCrias";

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

const FORMATO_KG = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });

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
    const errorUnidad = errorConsumoSinUnidad(resultado.datos.DtoConsumo, cria.unidadAlimento);
    if (errorUnidad) {
      mostrarErrores({ consumo: errorUnidad });
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

  const unidad = cria.unidadAlimento;
  const nombreUnidad = unidadValida(unidad) ? unidad.UndAliNom || "unidad" : "sin unidad";
  const consumoIngresado = validarDecimal2(entrada.consumo);
  const ayudaConsumo = !unidadValida(unidad)
    ? "Sin unidad configurada: deje vacío"
    : consumoIngresado.ok && consumoIngresado.valor > 0
      ? `Se guardará como ${FORMATO_KG.format(convertirConsumoAKg(consumoIngresado.valor, unidad))} kg`
      : "Hasta 2 decimales";

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
          <CampoNumero id="consumo" etiqueta={`Consumo (${nombreUnidad})`} ayuda={ayudaConsumo} modo="decimal"
            placeholder="0" valor={entrada.consumo} onCambio={cambiar("consumo")} error={errores.consumo}
            deshabilitado={guardando} />
        </div>
      </fieldset>

      <CamposTemperatura valores={entrada} errores={errores} onCambio={cambiar} deshabilitado={guardando} />

      {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}

      <div className="formulario__acciones">
        <button type="submit" className="boton boton--primario boton--grande" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        <VolverAMisCrias deshabilitado={guardando} />
      </div>
    </form>
  );
}
