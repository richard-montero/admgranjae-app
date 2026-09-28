import type { HTMLAttributes } from "react";

interface Props {
  id: string;
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  modo: HTMLAttributes<HTMLInputElement>["inputMode"];
  ayuda?: string;
  error?: string;
  placeholder?: string;
  /** Muestra un botón ± para poder escribir valores negativos en teclados sin signo menos. */
  conSigno?: boolean;
  deshabilitado?: boolean;
}

export function CampoNumero({
  id,
  etiqueta,
  valor,
  onCambio,
  modo,
  ayuda,
  error,
  placeholder,
  conSigno = false,
  deshabilitado = false,
}: Props) {
  const cambiarSigno = () => onCambio(valor.startsWith("-") ? valor.slice(1) : `-${valor}`);
  const idDescripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;

  return (
    <div className={`campo${error ? " campo--error" : ""}`}>
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
      </label>
      <div className="campo__control">
        {conSigno && (
          <button
            type="button"
            className="campo__signo"
            onClick={cambiarSigno}
            disabled={deshabilitado}
            aria-label={`Cambiar signo de ${etiqueta}`}
          >
            ±
          </button>
        )}
        <input
          id={id}
          name={id}
          type="text"
          inputMode={modo}
          autoComplete="off"
          placeholder={placeholder}
          value={valor}
          disabled={deshabilitado}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={idDescripcion}
        />
      </div>
      {error ? (
        <p className="campo__error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        ayuda && (
          <p className="campo__ayuda" id={`${id}-ayuda`}>
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}
