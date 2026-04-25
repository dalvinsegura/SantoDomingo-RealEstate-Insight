"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authUpdateProfile, authChangePassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, User, Lock, Check } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { usuario, cargando, refreshUser, isAdmin } = useAuth();

  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    bio: "",
  });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilOk, setPerfilOk] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({
    password_actual: "",
    password_nuevo: "",
    password_confirmar: "",
  });
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [passOk, setPassOk] = useState(false);
  const [errorPass, setErrorPass] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setPerfil({
        nombre: usuario.nombre ?? "",
        apellido: usuario.apellido ?? "",
        telefono: usuario.telefono ?? "",
        bio: usuario.bio ?? "",
      });
    }
  }, [usuario]);

  useEffect(() => {
    if (!cargando && !usuario) {
      router.push("/login");
    }
  }, [cargando, usuario, router]);

  async function handleGuardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setErrorPerfil(null);
    setPerfilOk(false);
    setGuardandoPerfil(true);
    try {
      const res = await authUpdateProfile(perfil);
      if (!res.ok) {
        setErrorPerfil(res.error ?? "Error al guardar");
        return;
      }
      await refreshUser();
      setPerfilOk(true);
      setTimeout(() => setPerfilOk(false), 3000);
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorPass(null);
    setPassOk(false);
    if (passwords.password_nuevo !== passwords.password_confirmar) {
      setErrorPass("Las contraseñas no coinciden");
      return;
    }
    if (passwords.password_nuevo.length < 6) {
      setErrorPass("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    setGuardandoPass(true);
    try {
      const res = await authChangePassword(passwords.password_actual, passwords.password_nuevo);
      if (!res.ok) {
        setErrorPass(res.error ?? "Error al cambiar la contraseña");
        return;
      }
      setPassOk(true);
      setPasswords({ password_actual: "", password_nuevo: "", password_confirmar: "" });
      setTimeout(() => setPassOk(false), 3000);
    } finally {
      setGuardandoPass(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    );
  }

  if (!usuario) return null;

  const iniciales = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .map((s) => s![0].toUpperCase())
    .join("") || usuario.email[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-10 space-y-8">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      {/* Avatar + info básica */}
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
        <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground shrink-0">
          {iniciales}
        </div>
        <div>
          <p className="font-semibold text-base">
            {usuario.nombre
              ? `${usuario.nombre} ${usuario.apellido ?? ""}`
              : usuario.email}
          </p>
          <p className="text-sm text-muted-foreground">{usuario.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Shield className="h-3 w-3" />
                Administrador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <User className="h-3 w-3" />
                Usuario
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Permisos actuales */}
      <div className="p-4 rounded-xl border bg-card space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Mis permisos
        </h2>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              Todos los permisos (Admin)
            </span>
          ) : (
            <>
              <PermTag label="Crear" active={usuario.permisos?.crear} />
              <PermTag label="Editar" active={usuario.permisos?.editar} />
              <PermTag label="Eliminar" active={usuario.permisos?.eliminar} />
            </>
          )}
        </div>
      </div>

      {/* Formulario de perfil */}
      <form onSubmit={handleGuardarPerfil} className="p-4 rounded-xl border bg-card space-y-4">
        <h2 className="text-base font-semibold">Datos personales</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={perfil.nombre}
              onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              value={perfil.apellido}
              onChange={(e) => setPerfil({ ...perfil, apellido: e.target.value })}
              placeholder="Tu apellido"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={perfil.telefono}
            onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
            placeholder="+1 (809) 000-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={perfil.bio}
            onChange={(e) => setPerfil({ ...perfil, bio: e.target.value })}
            placeholder="Cuéntanos algo sobre ti..."
            rows={3}
          />
        </div>
        {errorPerfil && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {errorPerfil}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={guardandoPerfil}>
            {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
          </Button>
          {perfilOk && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> Guardado
            </span>
          )}
        </div>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={handleCambiarPassword} className="p-4 rounded-xl border bg-card space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Cambiar contraseña
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="pass-actual">Contraseña actual</Label>
          <Input
            id="pass-actual"
            type="password"
            value={passwords.password_actual}
            onChange={(e) => setPasswords({ ...passwords, password_actual: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pass-nuevo">Nueva contraseña</Label>
          <Input
            id="pass-nuevo"
            type="password"
            value={passwords.password_nuevo}
            onChange={(e) => setPasswords({ ...passwords, password_nuevo: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pass-confirmar">Confirmar nueva contraseña</Label>
          <Input
            id="pass-confirmar"
            type="password"
            value={passwords.password_confirmar}
            onChange={(e) => setPasswords({ ...passwords, password_confirmar: e.target.value })}
            required
          />
        </div>
        {errorPass && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {errorPass}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" disabled={guardandoPass}>
            {guardandoPass ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
          {passOk && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> Contraseña actualizada
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function PermTag({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
        active
          ? "bg-green-100 text-green-800 border border-green-300"
          : "bg-muted text-muted-foreground line-through"
      }`}
    >
      {label}
    </span>
  );
}
