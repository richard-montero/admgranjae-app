import { Link } from "react-router-dom";

export function VolverAMisCrias({ deshabilitado = false }: { deshabilitado?: boolean }) {
  return (
    <Link to="/" className="boton boton--fantasma" aria-disabled={deshabilitado || undefined}>
      Volver a mis crías
    </Link>
  );
}
