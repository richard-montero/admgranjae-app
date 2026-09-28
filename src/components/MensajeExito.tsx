interface Props {
  titulo: string;
  detalle?: string;
  onCerrar: () => void;
}

export function MensajeExito({ titulo, detalle, onCerrar }: Props) {
  return (
    <div className="aviso aviso--exito" role="status" aria-live="polite">
      <div>
        <p className="aviso__titulo">✔ {titulo}</p>
        {detalle && <p className="aviso__detalle">{detalle}</p>}
      </div>
      <button type="button" className="aviso__cerrar" onClick={onCerrar} aria-label="Cerrar mensaje">
        ×
      </button>
    </div>
  );
}
