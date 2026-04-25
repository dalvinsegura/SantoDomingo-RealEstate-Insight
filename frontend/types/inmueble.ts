export type TipoInmueble =
  | "Casa"
  | "Apartamento"
  | "Villa"
  | "Comercio"
  | "Terreno"
  | "Penthouse"
  | "Oficina";

export type EstadoInmueble =
  | "disponible"
  | "alquilada"
  | "vendida"
  | "en-tramite";

export const TIPOS_INMUEBLE: TipoInmueble[] = [
  "Casa",
  "Apartamento",
  "Villa",
  "Comercio",
  "Terreno",
  "Penthouse",
  "Oficina",
];

export const ESTADOS_INMUEBLE: EstadoInmueble[] = [
  "disponible",
  "alquilada",
  "vendida",
  "en-tramite",
];

export interface Contacto {
  nombre?: string;
  telefono?: string;
  email?: string;
}

export interface EstimacionPrecio {
  precio_estimado: number;
  precio_min: number;
  precio_max: number;
  precio_p25: number;
  precio_p75: number;
  precio_m2_promedio: number | null;
  cantidad_comparables: number;
  comparables_similares: number;
  confianza: number; // 0–100
}

export interface SectorHeatmapItem {
  sector: string;
  cantidad: number;
  precio_promedio: number;
  precio_min: number;
  precio_max: number;
  precio_m2_promedio: number | null;
  area_promedio: number | null;
}

export interface Inmueble {
  id: number;
  titulo: string;
  precio: number;
  ubicacion: string;
  tipo: TipoInmueble;
  descripcion?: string;
  habitaciones?: number;
  banos?: number;
  area_m2?: number;
  estado?: EstadoInmueble;
  caracteristicas?: string[];
  contacto?: Contacto;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  // Scraping fields
  lat?: number;
  lng?: number;
  sector_normalizado?: string;
  precio_m2?: number;
  url_fuente?: string;
  fuente?: string;
  moneda?: string;
  tipo_operacion?: string;
}
