import type { Sesion } from "../types/usuario";

/**
 * Persistencia en el dispositivo:
 *  - teléfono → localStorage (se precarga en el siguiente ingreso)
 *  - sesión   → sessionStorage (sobrevive a un refresco; se borra al cerrar la pestaña)
 * Si el navegador bloquea el almacenamiento, la app sigue funcionando sin él.
 */

const CLAVE_TELEFONO = "admgranja.telefono";
const CLAVE_SESION = "admgranja.sesion";

export function leerTelefono(): string {
  try {
    return localStorage.getItem(CLAVE_TELEFONO) ?? "";
  } catch {
    return "";
  }
}

export function guardarTelefono(telefono: string): void {
  try {
    localStorage.setItem(CLAVE_TELEFONO, telefono);
  } catch {
    /* almacenamiento no disponible */
  }
}

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== "object" || valor === null) return false;
  const s = valor as Partial<Sesion>;
  return (
    typeof s.token === "string" &&
    typeof s.usuario === "object" &&
    s.usuario !== null &&
    typeof s.usuario.IdPersonal === "number" &&
    typeof s.usuario.EmpId === "number" &&
    typeof s.usuario.PerNombre === "string" &&
    typeof s.usuario.EmpNombre === "string"
  );
}

export function leerSesion(): Sesion | null {
  try {
    const valor: unknown = JSON.parse(sessionStorage.getItem(CLAVE_SESION) ?? "null");
    return esSesion(valor) ? valor : null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: Sesion): void {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function borrarSesion(): void {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    /* almacenamiento no disponible */
  }
}
