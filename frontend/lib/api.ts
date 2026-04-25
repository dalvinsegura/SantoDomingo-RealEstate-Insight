import type { Inmueble, EstimacionPrecio, SectorHeatmapItem } from "@/types/inmueble";
import type { Usuario, PermisosGlobales } from "@/types/usuario";
import { getStoredToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

// ── Helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T & { ok: false; error?: string }> {
  try {
    const token = getStoredToken();
    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) baseHeaders["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        ...baseHeaders,
        ...(options?.headers as Record<string, string> | undefined),
      },
    });

    const data = await res.json();
    return data;
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor" } as T & {
      ok: false;
      error?: string;
    };
  }
}

// ── Response types ─────────────────────────────────────────────────────────

export interface ListarResponse {
  ok: boolean;
  inmuebles?: Inmueble[];
  total?: number;
  error?: string;
}

export interface ObtenerResponse {
  ok: boolean;
  inmueble?: Inmueble;
  error?: string;
}

export interface CrearResponse {
  ok: boolean;
  id?: number;
  errores?: Record<string, string>;
  error?: string;
}

export interface MutarResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface StatsResponse {
  ok: boolean;
  stats?: {
    total: number;
    precio_promedio: number;
    disponibles: number;
    tipo_mas_comun: string;
  };
  error?: string;
}

export interface HealthResponse {
  ok: boolean;
  status?: string;
}

// ── API functions ──────────────────────────────────────────────────────────

export function listarInmuebles(params?: {
  ubicacion?: string;
  precio_min?: number;
  precio_max?: number;
  limite?: number;
  saltar?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.ubicacion) qs.set("ubicacion", params.ubicacion);
  if (params?.precio_min != null) qs.set("precio_min", String(params.precio_min));
  if (params?.precio_max != null) qs.set("precio_max", String(params.precio_max));
  if (params?.limite != null) qs.set("limite", String(params.limite));
  if (params?.saltar != null) qs.set("saltar", String(params.saltar));

  const query = qs.toString();
  return apiFetch<ListarResponse>(`/api/inmuebles${query ? `?${query}` : ""}`);
}

export function obtenerInmueble(id: number) {
  return apiFetch<ObtenerResponse>(`/api/inmuebles/${id}`);
}

export function crearInmueble(datos: Omit<Inmueble, "id">) {
  return apiFetch<CrearResponse>("/api/inmuebles", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function actualizarInmueble(id: number, datos: Partial<Omit<Inmueble, "id">>) {
  return apiFetch<MutarResponse>(`/api/inmuebles/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export function eliminarInmueble(id: number) {
  return apiFetch<MutarResponse>(`/api/inmuebles/${id}`, {
    method: "DELETE",
  });
}

export function inicializarBD() {
  return apiFetch<MutarResponse>("/api/init", { method: "POST" });
}

export function getStats() {
  return apiFetch<StatsResponse>("/api/stats");
}

export function healthCheck() {
  return apiFetch<HealthResponse>("/api/health");
}

// ── Calculator & Heatmap ───────────────────────────────────────────────────

export interface EstimacionResponse {
  ok: boolean;
  precio_estimado?: number;
  precio_min?: number;
  precio_max?: number;
  precio_p25?: number;
  precio_p75?: number;
  precio_m2_promedio?: number | null;
  cantidad_comparables?: number;
  comparables_similares?: number;
  confianza?: number;
  error?: string;
}

export interface HeatmapResponse {
  ok: boolean;
  sectores?: SectorHeatmapItem[];
  error?: string;
}

export function calcularPrecioJusto(params: {
  tipo: string;
  area_m2?: number;
  habitaciones?: number;
  ubicacion?: string;
}) {
  const qs = new URLSearchParams({ tipo: params.tipo });
  if (params.area_m2 != null) qs.set("area_m2", String(params.area_m2));
  if (params.habitaciones != null) qs.set("habitaciones", String(params.habitaciones));
  if (params.ubicacion) qs.set("ubicacion", params.ubicacion);
  return apiFetch<EstimacionResponse>(`/api/calculator/estimate?${qs}`);
}

export function getSectorHeatmap() {
  return apiFetch<HeatmapResponse>("/api/sectores/heatmap");
}

// ── Sector Stats (score de valor) ──────────────────────────────────────────

export interface SectorStatItem {
  tipo: string;
  sector: string;
  precio_promedio: number;
  cantidad: number;
}

export interface SectorStatsResponse {
  ok: boolean;
  stats?: SectorStatItem[];
  error?: string;
}

export function getSectorStats() {
  return apiFetch<SectorStatsResponse>("/api/sectores/stats");
}

// ── Historial de Precio ────────────────────────────────────────────────────

export interface PrecioHistorialItem {
  precio: number;
  moneda: string;
  fecha: string;
}

export interface HistorialResponse {
  ok: boolean;
  historial?: PrecioHistorialItem[];
  error?: string;
}

export function getHistorialPrecio(id: number) {
  return apiFetch<HistorialResponse>(`/api/inmuebles/${id}/historial`);
}

// ── Similares ──────────────────────────────────────────────────────────────

export interface SimilaresResponse {
  ok: boolean;
  similares?: import("@/types/inmueble").Inmueble[];
  error?: string;
}

export function getSimilares(id: number, limite = 4) {
  return apiFetch<SimilaresResponse>(`/api/inmuebles/${id}/similares?limite=${limite}`);
}

// ── Export CSV ─────────────────────────────────────────────────────────────

export function getExportUrl(params?: {
  ubicacion?: string;
  tipo?: string;
  precio_min?: number;
  precio_max?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.ubicacion) qs.set("ubicacion", params.ubicacion);
  if (params?.tipo) qs.set("tipo", params.tipo);
  if (params?.precio_min != null) qs.set("precio_min", String(params.precio_min));
  if (params?.precio_max != null) qs.set("precio_max", String(params.precio_max));
  const query = qs.toString();
  return `${API_URL}/api/inmuebles/export${query ? `?${query}` : ""}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════

export interface AuthResponse {
  ok: boolean;
  token?: string;
  usuario?: Usuario;
  error?: string;
}

export interface PerfilResponse {
  ok: boolean;
  usuario?: Usuario;
  error?: string;
}

export interface PermisosGlobalesResponse {
  ok: boolean;
  permisos?: PermisosGlobales;
  error?: string;
}

export function authRegister(datos: {
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
}) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function authLogin(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function authMe() {
  return apiFetch<PerfilResponse>("/api/auth/me");
}

export function authUpdateProfile(datos: Partial<Pick<Usuario, "nombre" | "apellido" | "telefono" | "bio" | "avatar_url">>) {
  return apiFetch<PerfilResponse>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export function authChangePassword(password_actual: string, password_nuevo: string) {
  return apiFetch<{ ok: boolean; error?: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ password_actual, password_nuevo }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════════════════════

export interface UsuariosResponse {
  ok: boolean;
  usuarios?: Usuario[];
  error?: string;
}

export function adminListarUsuarios() {
  return apiFetch<UsuariosResponse>("/api/admin/usuarios");
}

export function adminCambiarRol(id: number, rol: "admin" | "usuario") {
  return apiFetch<{ ok: boolean; error?: string }>(`/api/admin/usuarios/${id}/rol`, {
    method: "PUT",
    body: JSON.stringify({ rol }),
  });
}

export function adminCambiarPermisos(id: number, permisos: { crear: boolean; editar: boolean; eliminar: boolean }) {
  return apiFetch<{ ok: boolean; error?: string }>(`/api/admin/usuarios/${id}/permisos`, {
    method: "PUT",
    body: JSON.stringify(permisos),
  });
}

export function adminDesactivarUsuario(id: number) {
  return apiFetch<{ ok: boolean; error?: string }>(`/api/admin/usuarios/${id}`, {
    method: "DELETE",
  });
}

export function adminGetPermisosGlobales() {
  return apiFetch<PermisosGlobalesResponse>("/api/admin/permisos-globales");
}

export function adminSetPermisosGlobales(permisos: { crear: boolean; editar: boolean; eliminar: boolean }) {
  return apiFetch<PermisosGlobalesResponse>("/api/admin/permisos-globales", {
    method: "PUT",
    body: JSON.stringify(permisos),
  });
}
