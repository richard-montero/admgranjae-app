import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CampoContrasena } from "../components/CampoContrasena";
import { MensajeError } from "../components/MensajeError";
import { useUsuario } from "../hooks/useUsuario";
import { cambiarContrasenaInicial, getUsuarioByTelefono } from "../lib/api";
import { guardarTelefono, leerTelefono } from "../lib/almacenamiento";
import { mensajeDeError } from "../lib/errores";
import { CONTRASENA_MAX, CONTRASENA_MIN, errorNuevaContrasena } from "../lib/validacion";
import type { Sesion } from "../types/usuario";

interface EstadoLogin {
  desde?: string;
}

/** Datos para el paso de cambio de la contraseña inicial (123). */
interface CambioPendiente {
  tokenCambio: string;
  PerNombre: string;
}

export function Login() {
  const { sesion, entrar } = useUsuario();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [cambio, setCambio] = useState<CambioPendiente | null>(null);
  const [ingresando, setIngresando] = useState(false);

  const destino = (ubicacion.state as EstadoLogin | null)?.desde ?? "/";

  if (sesion && !ingresando) return <Navigate to="/" replace />;

  const completarIngreso = (nueva: Sesion) => {
    setIngresando(true);
    entrar(nueva);
    navegar(destino, { replace: true });
  };

  return (
    <main className="login">
      <div className="login__marca">
        <p className="etiqueta">Registro diario de crías</p>
        <div className="login__encabezado">
          <img className="login__logo" src="/ramnsoft.png" alt="RAMN Software" width={64} height={64} />
          <h1 className="login__titulo">
            Administración <span className="login__titulo-linea">Granjas de Engorde</span>
          </h1>
        </div>
      </div>
      {cambio ? (
        <FormCambioContrasena cambio={cambio} onListo={completarIngreso} onCancelar={() => setCambio(null)} />
      ) : (
        <FormIngreso onSesion={completarIngreso} onCambioRequerido={setCambio} />
      )}
    </main>
  );
}

interface PropsIngreso {
  onSesion: (sesion: Sesion) => void;
  onCambioRequerido: (cambio: CambioPendiente) => void;
}

function FormIngreso({ onSesion, onCambioRequerido }: PropsIngreso) {
  const [telefono, setTelefono] = useState(leerTelefono);
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const ingresar = async (e: FormEvent) => {
    e.preventDefault();
    if (cargando) return;
    const t = telefono.replace(/\s/g, "");
    if (!t) return setError("Ingrese su número de teléfono.");
    if (!/^\d+$/.test(t)) return setError("El número solo debe tener dígitos.");
    if (!contrasena) return setError("Ingrese su contraseña.");

    setError("");
    setCargando(true);
    try {
      const respuesta = await getUsuarioByTelefono(t, contrasena);
      guardarTelefono(t);
      if (respuesta.cambioRequerido) {
        onCambioRequerido({ tokenCambio: respuesta.tokenCambio, PerNombre: respuesta.PerNombre });
      } else {
        onSesion({ usuario: respuesta.usuario, token: respuesta.token });
      }
    } catch (err) {
      setError(mensajeDeError(err));
      setCargando(false);
    }
  };

  return (
    <form className="login__form" onSubmit={ingresar} noValidate>
      <div className="campo">
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
        />
      </div>
      <CampoContrasena
        id="contrasena"
        etiqueta="Contraseña"
        valor={contrasena}
        onCambio={setContrasena}
        autoComplete="current-password"
        deshabilitado={cargando}
      />
      {error && <MensajeError>{error}</MensajeError>}
      <button type="submit" className="boton boton--primario boton--grande" disabled={cargando}>
        {cargando ? "Verificando..." : "Ingresar"}
      </button>
    </form>
  );
}

interface PropsCambio {
  cambio: CambioPendiente;
  onListo: (sesion: Sesion) => void;
  onCancelar: () => void;
}

function FormCambioContrasena({ cambio, onListo, onCancelar }: PropsCambio) {
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [errorNueva, setErrorNueva] = useState("");
  const [errorRepetida, setErrorRepetida] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setErrorGeneral("");

    const errNueva = errorNuevaContrasena(nueva) ?? "";
    const errRepetida = !errNueva && nueva !== repetida ? "Las contraseñas no coinciden." : "";
    setErrorNueva(errNueva);
    setErrorRepetida(errRepetida);
    if (errNueva || errRepetida) {
      document.getElementById(errNueva ? "nueva" : "repetida")?.focus();
      return;
    }

    setGuardando(true);
    try {
      onListo(await cambiarContrasenaInicial(cambio.tokenCambio, nueva));
    } catch (err) {
      setErrorGeneral(mensajeDeError(err));
      setGuardando(false);
    }
  };

  return (
    <form className="login__form" onSubmit={guardar} noValidate>
      <div className="aviso aviso--info" role="status">
        <p className="aviso__titulo">Cree su nueva contraseña</p>
        <p className="aviso__detalle">
          {cambio.PerNombre}, es su primer ingreso o su contraseña fue reseteada. Desde ahora ingresará con la
          contraseña que cree aquí.
        </p>
      </div>
      <CampoContrasena
        id="nueva"
        etiqueta="Nueva contraseña"
        valor={nueva}
        onCambio={(v) => {
          setNueva(v);
          setErrorNueva("");
        }}
        autoComplete="new-password"
        ayuda={`Entre ${CONTRASENA_MIN} y ${CONTRASENA_MAX} caracteres.`}
        error={errorNueva}
        deshabilitado={guardando}
      />
      <CampoContrasena
        id="repetida"
        etiqueta="Repita la nueva contraseña"
        valor={repetida}
        onCambio={(v) => {
          setRepetida(v);
          setErrorRepetida("");
        }}
        autoComplete="new-password"
        error={errorRepetida}
        deshabilitado={guardando}
      />
      {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}
      <button type="submit" className="boton boton--primario boton--grande" disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar contraseña e ingresar"}
      </button>
      <button type="button" className="boton boton--fantasma" onClick={onCancelar} disabled={guardando}>
        Cancelar
      </button>
    </form>
  );
}
