import type { EntradaTemperaturas, ErroresRegistro } from "../types/registro";
import { CampoNumero } from "./CampoNumero";

interface Props {
  valores: EntradaTemperaturas;
  errores: ErroresRegistro;
  onCambio: (campo: keyof EntradaTemperaturas) => (valor: string) => void;
  deshabilitado?: boolean;
}

/** Temperaturas de mañana (10:00), tarde (15:00) y noche (22:00). Las usan el registro diario y "Registrar temperatura". */
export function CamposTemperatura({ valores, errores, onCambio, deshabilitado = false }: Props) {
  return (
    <fieldset className="grupo">
      <legend>
        Temperaturas (°C) <span className="grupo__nota">opcionales</span>
      </legend>
      <div className="grupo__temps">
        <CampoNumero id="tempMna" etiqueta="Mañana 10:00" modo="numeric" placeholder="—" conSigno
          valor={valores.tempMna} onCambio={onCambio("tempMna")} error={errores.tempMna}
          deshabilitado={deshabilitado} />
        <CampoNumero id="tempTarde" etiqueta="Tarde 15:00" modo="numeric" placeholder="—" conSigno
          valor={valores.tempTarde} onCambio={onCambio("tempTarde")} error={errores.tempTarde}
          deshabilitado={deshabilitado} />
        <CampoNumero id="tempNoche" etiqueta="Noche 22:00" modo="numeric" placeholder="—" conSigno
          valor={valores.tempNoche} onCambio={onCambio("tempNoche")} error={errores.tempNoche}
          deshabilitado={deshabilitado} />
      </div>
      <p className="campo__ayuda">Use ± para temperaturas bajo cero. Vacío = sin dato.</p>
    </fieldset>
  );
}
