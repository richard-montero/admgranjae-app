import { useSyncExternalStore } from "react";
import { modoInstalacion, suscribirInstalacion, type ModoInstalacion } from "../lib/instalacion";

/** Cómo ofrecer la instalación en este dispositivo; null si no corresponde. */
export function useInstalacion(): ModoInstalacion {
  return useSyncExternalStore(suscribirInstalacion, modoInstalacion, () => null);
}
