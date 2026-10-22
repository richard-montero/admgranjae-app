/**
 * Instalación de la app en el dispositivo (pantalla de inicio / escritorio).
 *  - Chrome y Edge (Android, Windows, Mac): el navegador avisa con "beforeinstallprompt"
 *    cuando la app se puede instalar; ese evento abre su ventana de instalación.
 *    Si la app ya está instalada, el navegador no lo envía.
 *  - iPhone/iPad: no existe instalación por botón; se muestran los pasos en Safari.
 *  - Abierta desde el ícono (modo app): no se ofrece instalar.
 */

/** Evento de Chrome/Edge (no está en los tipos estándar de TypeScript). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** "boton": Chrome/Edge puede instalar · "ios": mostrar pasos de Safari · null: no mostrar nada. */
export type ModoInstalacion = "boton" | "ios" | null;

let eventoInstalacion: BeforeInstallPromptEvent | null = null;
let instalada = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((oyente) => oyente());

/** Se llama una sola vez al arrancar, antes de que el navegador envíe sus eventos. */
export function iniciarInstalacion(): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // se muestra con nuestro botón, no con la barra automática
    eventoInstalacion = e as BeforeInstallPromptEvent;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    instalada = true;
    eventoInstalacion = null;
    avisar();
  });
  window.matchMedia("(display-mode: standalone)").addEventListener("change", avisar);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err: unknown) => console.error("[sw] no se registró", err));
    });
  }
}

/** true si la app se abrió desde su ícono (ya instalada). */
function abiertaComoApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone, iPod o iPad (el iPad moderno se presenta como Mac con pantalla táctil). */
function esIOS(): boolean {
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

/** En iPhone, true si es Safari (Chrome, Firefox y Edge de iOS se identifican aparte). */
export function esSafariIOS(): boolean {
  return esIOS() && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);
}

export function modoInstalacion(): ModoInstalacion {
  if (instalada || abiertaComoApp()) return null;
  if (eventoInstalacion) return "boton";
  if (esIOS()) return "ios";
  return null;
}

export function suscribirInstalacion(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/** Abre la ventana de instalación de Chrome/Edge. El evento solo se puede usar una vez. */
export async function instalarApp(): Promise<void> {
  const evento = eventoInstalacion;
  if (!evento) return;
  eventoInstalacion = null;
  avisar();
  await evento.prompt();
  await evento.userChoice;
}
