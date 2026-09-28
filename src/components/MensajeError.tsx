import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onReintentar?: () => void;
}

export function MensajeError({ children, onReintentar }: Props) {
  return (
    <div className="aviso aviso--error" role="alert">
      <p>{children}</p>
      {onReintentar && (
        <button type="button" className="boton boton--secundario boton--chico" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
