import { useNavigate } from "react-router-dom";
import { useSesionActiva } from "../hooks/useUsuario";

export function Header() {
  const { usuario, salir } = useSesionActiva();
  const navegar = useNavigate();

  const cerrarSesion = () => {
    navegar("/login", { replace: true });
    salir();
  };

  return (
    <header className="cabecera">
      <div className="cabecera__interior">
        <div className="cabecera__textos">
          <h1 className="cabecera__empresa">{usuario.EmpNombre}</h1>
          <p className="cabecera__usuario">
            <span className="etiqueta">Encargado</span> {usuario.PerNombre}
          </p>
        </div>
        <button type="button" className="boton boton--fantasma boton--chico" onClick={cerrarSesion}>
          Salir
        </button>
      </div>
    </header>
  );
}
