import { useState, type FormEvent } from "react";
import { useSesionActiva } from "../hooks/useUsuario";
import { actualizarTemperaturas } from "../lib/api";
import { ErrorApi, mensajeDeError } from "../lib/errores";
import { validarTemperaturas } from "../lib/validacion";
import type { EntradaTemperaturas, ErroresRegistro, RegistroTemperaturas } from "../types/registro";
import { CamposTemperatura } from "./CamposTemperatura";
import { MensajeError } from "./MensajeError";
import { VolverAMisCrias } from "./VolverAMisCrias";

const aTexto = (valor: number | null): string => (valor === null ? "" : String(valor));

interface Props {
  idCria: number;
  registro: RegistroTemperaturas;
  onGuardado: () => void;
}

/** Modifica solo las temperaturas de un registro diario que ya existe. */
export function TemperaturasForm({ idCria, registro, onGuardado }: Props) {
  const { token, salir } = useSesionActiva();
  const [entrada, setEntrada] = useState<EntradaTemperaturas>({
    tempMna: aTexto(registro.DtoTempMna),
    tempTarde: aTexto(registro.DtoTempTarde),
    tempNoche: aTexto(registro.DtoTempNoche),
  });
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: keyof EntradaTemperaturas) => (valor: string) => {
    setEntrada((e) => ({ ...e, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setErrorGeneral("");

    const resultado = validarTemperaturas(entrada);
    if (!resultado.valido) {
      setErrores(resultado.errores);
      return;
    }

    setGuardando(true);
    try {
      await actualizarTemperaturas(token, idCria, registro.DtoFecha, resultado.datos);
      onGuardado();
    } catch (err) {
      setGuardando(false);
      if (err instanceof ErrorApi && err.codigo === "SESION") {
        salir();
        return;
      }
      if (err instanceof ErrorApi && err.campos) setErrores(err.campos);
      setErrorGeneral(mensajeDeError(err));
    }
  };

  return (
    <form className="formulario" onSubmit={guardar} noValidate>
      <CamposTemperatura valores={entrada} errores={errores} onCambio={cambiar} deshabilitado={guardando} />
      {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}
      <div className="formulario__acciones">
        <button type="submit" className="boton boton--primario boton--grande" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar temperaturas"}
        </button>
        <VolverAMisCrias deshabilitado={guardando} />
      </div>
    </form>
  );
}
