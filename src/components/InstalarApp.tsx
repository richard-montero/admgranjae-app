import { useState } from "react";
import { useInstalacion } from "../hooks/useInstalacion";
import { esSafariIOS, instalarApp } from "../lib/instalacion";

/** Ícono "Compartir" de Safari (cuadro con flecha hacia arriba). */
function IconoCompartir() {
  return (
    <svg className="instalar__icono" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v8.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Botón "Instalar en este dispositivo". No aparece si la app ya está instalada. */
export function InstalarApp() {
  const modo = useInstalacion();
  const [pasosVisibles, setPasosVisibles] = useState(false);

  if (modo === null) return null;

  if (modo === "boton") {
    return (
      <div className="instalar">
        <button type="button" className="boton boton--secundario" onClick={() => void instalarApp()}>
          Instalar en este dispositivo
        </button>
      </div>
    );
  }

  // iPhone / iPad: Apple solo permite agregarla desde el menú Compartir
  return (
    <div className="instalar">
      <button
        type="button"
        className="boton boton--secundario"
        onClick={() => setPasosVisibles((v) => !v)}
        aria-expanded={pasosVisibles}
        aria-controls="pasos-instalar"
      >
        Instalar en este dispositivo
      </button>
      {pasosVisibles && (
        <div className="aviso aviso--info" id="pasos-instalar">
          <p className="aviso__titulo">Agregar a la pantalla de inicio</p>
          <ol className="instalar__pasos">
            <li>
              Toque el botón <b>Compartir</b> <IconoCompartir /> en la barra de Safari.
            </li>
            <li>
              Deslice hacia abajo y elija <b>Agregar a inicio</b>.
            </li>
            <li>
              Toque <b>Agregar</b>. El ícono de la app quedará en su pantalla de inicio.
            </li>
          </ol>
          {!esSafariIOS() && (
            <p className="aviso__detalle">Si no ve la opción, abra esta dirección en Safari y repita los pasos.</p>
          )}
          <button type="button" className="boton boton--secundario boton--chico" onClick={() => setPasosVisibles(false)}>
            Entendido
          </button>
        </div>
      )}
    </div>
  );
}
