import { useState } from "react";

interface Props {
  id: string;
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  ayuda?: string;
  deshabilitado?: boolean;
}

/** Campo de contraseña con botón para mostrar u ocultar lo escrito. */
export function CampoContrasena({ id, etiqueta, valor, onCambio, autoComplete, error, ayuda, deshabilitado }: Props) {
  const [visible, setVisible] = useState(false);
  const idDescripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;

  return (
    <div className={`campo${error ? " campo--error" : ""}`}>
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
      </label>
      <div className="campo__control">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={valor}
          disabled={deshabilitado}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={idDescripcion}
        />
        <button
          type="button"
          className="campo__ver"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
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
