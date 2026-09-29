import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Cargando } from "../components/Cargando";
import { GranjaCard } from "../components/GranjaCard";
import { MensajeError } from "../components/MensajeError";
import { MensajeExito } from "../components/MensajeExito";
import { useGranjas } from "../hooks/useGranjas";
import { formatearFecha } from "../lib/fechas";

/** Aviso que envían GestionCria y TemperaturaCria después de guardar. */
export interface AvisoGuardado {
  titulo: string;
  galpon: string;
  idCria: number;
  fecha: string;
}

export function Inicio() {
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [exito, setExito] = useState<AvisoGuardado | null>(
    () => (ubicacion.state as { exito?: AvisoGuardado } | null)?.exito ?? null,
  );
  const { datos: granjas, error, cargando, recargar } = useGranjas();

  // Quita el aviso del historial para que no reaparezca al refrescar
  useEffect(() => {
    if (ubicacion.state) navegar(ubicacion.pathname, { replace: true, state: null });
  }, [ubicacion.state, ubicacion.pathname, navegar]);

  return (
    <main className="pagina">
      {exito && (
        <MensajeExito
          titulo={exito.titulo}
          detalle={`${exito.galpon} · Cría N.º ${exito.idCria} · ${formatearFecha(exito.fecha)}`}
          onCerrar={() => setExito(null)}
        />
      )}
      <h2 className="pagina__titulo">Mis crías activas</h2>
      {cargando ? (
        <Cargando texto="Cargando granjas..." />
      ) : error ? (
        <MensajeError onReintentar={recargar}>{error}</MensajeError>
      ) : !granjas || granjas.length === 0 ? (
        <p className="vacio">No tiene crías activas asignadas.</p>
      ) : (
        granjas.map((g) => <GranjaCard key={g.IdGranja} granja={g} />)
      )}
    </main>
  );
}
