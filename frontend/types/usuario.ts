export type RolUsuario = "admin" | "usuario";

export interface Permisos {
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface PermisosGlobales {
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface Usuario {
  id: number;
  email: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  bio?: string;
  avatar_url?: string;
  rol: RolUsuario;
  permisos: Permisos;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}
