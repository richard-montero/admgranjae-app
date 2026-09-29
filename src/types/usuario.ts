/** Encargado identificado por su teléfono (Emp_Personal + Empresas). */
export interface Usuario {
  IdPersonal: number;
  PerNombre: string;
  EmpId: number;
  EmpNombre: string;
}

export interface Sesion {
  usuario: Usuario;
  token: string;
}

/** Respuesta de /api/login. */
export type RespuestaLogin =
  | ({ cambioRequerido: false } & Sesion)
  | {
      /** La contraseña es la inicial (123): debe crear una nueva antes de ingresar. */
      cambioRequerido: true;
      /** Token de 10 minutos que solo sirve para /api/cambiar-contrasena. */
      tokenCambio: string;
      PerNombre: string;
    };
