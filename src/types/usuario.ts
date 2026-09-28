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
