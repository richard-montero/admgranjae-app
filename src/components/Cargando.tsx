export function Cargando({ texto = "Cargando..." }: { texto?: string }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="cargando__rueda" aria-hidden="true"></span>
      <span>{texto}</span>
    </div>
  );
}
