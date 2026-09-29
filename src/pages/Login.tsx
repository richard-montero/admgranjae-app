import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { MensajeError } from "../components/MensajeError";
import { useUsuario } from "../hooks/useUsuario";
import { getUsuarioByTelefono } from "../lib/api";
import { guardarTelefono, leerTelefono } from "../lib/almacenamiento";
import { mensajeDeError } from "../lib/errores";

interface EstadoLogin {
  desde?: string;
}

export function Login() {
  const { sesion, entrar } = useUsuario();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [telefono, setTelefono] = useState(leerTelefono);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const destino = (ubicacion.state as EstadoLogin | null)?.desde ?? "/";

  if (sesion && !cargando) return <Navigate to="/" replace />;

  const ingresar = async (e: FormEvent) => {
    e.preventDefault();
    const t = telefono.replace(/\s/g, "");
    if (!t) return setError("Ingrese su número de teléfono.");
    if (!/^\d+$/.test(t)) return setError("El número solo debe tener dígitos.");

    setError("");
    setCargando(true);
    try {
      const nueva = await getUsuarioByTelefono(t);
      guardarTelefono(t);
      entrar(nueva);
      navegar(destino, { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
      setCargando(false);
    }
  };

  return (
    <main className="login">
      <div className="login__marca">
        <img className="login__logo" src="/ramnsoft.png" alt="RAMN Software" width={64} height={64} />
        <p className="etiqueta">Registro diario de crías</p>
        <h1 className="login__titulo">Administración Granjas de Engorde</h1>
      </div>
      <form className="login__form" onSubmit={ingresar} noValidate>
        <div className={`campo${error ? " campo--error" : ""}`}>
          <label htmlFor="telefono" className="campo__etiqueta">
            Número de teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Ej. 70000000"
            value={telefono}
            disabled={cargando}
            onChange={(e) => setTelefono(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </div>
        {error && <MensajeError>{error}</MensajeError>}
        <button type="submit" className="boton boton--primario boton--grande" disabled={cargando}>
          {cargando ? "Verificando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
