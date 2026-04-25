"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  adminListarUsuarios,
  adminCambiarRol,
  adminCambiarPermisos,
  adminDesactivarUsuario,
  adminGetPermisosGlobales,
  adminSetPermisosGlobales,
} from "@/lib/api";
import type { Usuario, PermisosGlobales } from "@/types/usuario";
import { Button } from "@/components/ui/button";
import {
  Shield,
  User,
  Trash2,
  RefreshCw,
  Globe,
  Check,
} from "lucide-react";

// ── Fila de usuario ───────────────────────────────────────────────────────────

function FilaUsuario({
  u,
  yo,
  onRolChange,
  onPermisosChange,
  onDesactivar,
}: {
  u: Usuario;
  yo: boolean;
  onRolChange: (id: number, rol: "admin" | "usuario") => Promise<void>;
  onPermisosChange: (id: number, permisos: { crear: boolean; editar: boolean; eliminar: boolean }) => Promise<void>;
  onDesactivar: (id: number) => Promise<void>;
}) {
  const [cargando, setCargando] = useState(false);

  const iniciales = [u.nombre, u.apellido]
    .filter(Boolean)
    .map((s) => s![0].toUpperCase())
    .join("") || u.email[0].toUpperCase();

  async function toggleRol() {
    setCargando(true);
    try {
      await onRolChange(u.id, u.rol === "admin" ? "usuario" : "admin");
    } finally {
      setCargando(false);
    }
  }

  async function togglePerm(campo: "crear" | "editar" | "eliminar") {
    setCargando(true);
    try {
      await onPermisosChange(u.id, {
        ...u.permisos,
        [campo]: !u.permisos[campo],
      });
    } finally {
      setCargando(false);
    }
  }

  async function handleDesactivar() {
    if (!confirm(`¿Desactivar la cuenta de ${u.email}?`)) return;
    setCargando(true);
    try {
      await onDesactivar(u.id);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className={`p-4 rounded-xl border bg-card space-y-3 ${yo ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              u.rol === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {u.nombre ? `${u.nombre} ${u.apellido ?? ""}` : u.email}
              {yo && <span className="ml-1.5 text-xs text-muted-foreground">(tú)</span>}
            </p>
            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleRol}
            disabled={cargando || yo}
            title={u.rol === "admin" ? "Quitar admin" : "Hacer admin"}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              u.rol === "admin"
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/80"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Shield className="h-3 w-3" />
            {u.rol === "admin" ? "Admin" : "Usuario"}
          </button>
          {!yo && (
            <button
              onClick={handleDesactivar}
              disabled={cargando}
              title="Desactivar cuenta"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Permisos individuales (solo si no es admin) */}
      {u.rol !== "admin" && (
        <div className="flex items-center gap-2 flex-wrap pl-12">
          <span className="text-xs text-muted-foreground mr-1">Permisos:</span>
          {(["crear", "editar", "eliminar"] as const).map((p) => (
            <button
              key={p}
              onClick={() => togglePerm(p)}
              disabled={cargando}
              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize transition-colors ${
                u.permisos[p]
                  ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {u.permisos[p] && <Check className="inline h-2.5 w-2.5 mr-0.5 -mt-0.5" />}
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel de permisos globales ────────────────────────────────────────────────

function PanelPermisosGlobales({
  permisos,
  onSave,
}: {
  permisos: PermisosGlobales;
  onSave: (p: PermisosGlobales) => Promise<void>;
}) {
  const [local, setLocal] = useState(permisos);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => setLocal(permisos), [permisos]);

  async function handleSave() {
    setGuardando(true);
    try {
      await onSave(local);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-4 rounded-xl border bg-card space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Permisos globales</h2>
        <span className="text-xs text-muted-foreground">(aplican a todos los usuarios, incluidos no registrados)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["crear", "editar", "eliminar"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setLocal({ ...local, [p]: !local[p] })}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-colors ${
              local[p]
                ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            }`}
          >
            {local[p] && <Check className="inline h-2.5 w-2.5 mr-1 -mt-0.5" />}
            {p}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar permisos globales"}
        </Button>
        {ok && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="h-3.5 w-3.5" /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { usuario, cargando: authCargando, isAdmin, refreshPermisosGlobales } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [permisosGlobales, setPermisosGlobales] = useState<PermisosGlobales>({
    crear: false,
    editar: false,
    eliminar: false,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [resU, resPG] = await Promise.all([
        adminListarUsuarios(),
        adminGetPermisosGlobales(),
      ]);
      if (resU.ok && resU.usuarios) setUsuarios(resU.usuarios);
      if (resPG.ok && resPG.permisos) setPermisosGlobales(resPG.permisos);
    } catch {
      setError("No se pudo cargar la información");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!authCargando && !isAdmin) {
      router.push("/");
    } else if (!authCargando && isAdmin) {
      cargar();
    }
  }, [authCargando, isAdmin, router, cargar]);

  async function handleRolChange(id: number, rol: "admin" | "usuario") {
    const res = await adminCambiarRol(id, rol);
    if (res.ok) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, rol } : u))
      );
    } else {
      alert(res.error ?? "Error al cambiar rol");
    }
  }

  async function handlePermisosChange(
    id: number,
    permisos: { crear: boolean; editar: boolean; eliminar: boolean }
  ) {
    const res = await adminCambiarPermisos(id, permisos);
    if (res.ok) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, permisos } : u))
      );
    } else {
      alert(res.error ?? "Error al cambiar permisos");
    }
  }

  async function handleDesactivar(id: number) {
    const res = await adminDesactivarUsuario(id);
    if (res.ok) {
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } else {
      alert(res.error ?? "Error al desactivar usuario");
    }
  }

  async function handleGuardarGlobales(permisos: PermisosGlobales) {
    const res = await adminSetPermisosGlobales(permisos);
    if (res.ok && res.permisos) {
      setPermisosGlobales(res.permisos);
      await refreshPermisosGlobales();
    } else {
      alert(res.error ?? "Error al guardar permisos globales");
    }
  }

  if (authCargando) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Panel de administración
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestiona usuarios, roles y permisos
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Permisos globales */}
      <PanelPermisosGlobales
        permisos={permisosGlobales}
        onSave={handleGuardarGlobales}
      />

      {/* Lista de usuarios */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            Usuarios registrados{" "}
            <span className="text-muted-foreground font-normal">({usuarios.length})</span>
          </h2>
        </div>
        {cargando ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Cargando usuarios...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay usuarios registrados.</p>
        ) : (
          <div className="space-y-2">
            {usuarios.map((u) => (
              <FilaUsuario
                key={u.id}
                u={u}
                yo={u.id === usuario?.id}
                onRolChange={handleRolChange}
                onPermisosChange={handlePermisosChange}
                onDesactivar={handleDesactivar}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
