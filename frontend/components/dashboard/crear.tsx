"use client";

import { useState } from "react";
import Link from "next/link";
import { crearInmueble } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIPOS_INMUEBLE, ESTADOS_INMUEBLE } from "@/types/inmueble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Lock } from "lucide-react";
import Image from "next/image";

const EMPTY_FORM = {
  titulo: "",
  precio: "",
  ubicacion: "",
  tipo: "",
  estado: "disponible",
  area_m2: "",
  habitaciones: "",
  banos: "",
  descripcion: "",
  caracteristicas: "",
  contacto_nombre: "",
  contacto_telefono: "",
  contacto_email: "",
};

export default function Crear({ onSuccess }: { onSuccess?: () => void } = {}) {
  const { canCreate, usuario } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errores[field]) setErrores((e) => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setErrorGeneral(null);

    const precio = parseFloat(form.precio);
    if (!form.titulo.trim() || form.titulo.trim().length < 5) {
      setErrores({ titulo: "Mínimo 5 caracteres" });
      return;
    }
    if (isNaN(precio) || precio < 0) {
      setErrores({ precio: "Precio inválido" });
      return;
    }
    if (!form.ubicacion.trim() || form.ubicacion.trim().length < 3) {
      setErrores({ ubicacion: "Mínimo 3 caracteres" });
      return;
    }
    if (!form.tipo) {
      setErrores({ tipo: "Selecciona un tipo" });
      return;
    }

    const contacto =
      form.contacto_nombre || form.contacto_telefono || form.contacto_email
        ? {
            nombre: form.contacto_nombre || undefined,
            telefono: form.contacto_telefono || undefined,
            email: form.contacto_email || undefined,
          }
        : undefined;

    const datos = {
      titulo: form.titulo.trim(),
      precio,
      ubicacion: form.ubicacion.trim(),
      tipo: form.tipo as (typeof TIPOS_INMUEBLE)[number],
      estado: form.estado as (typeof ESTADOS_INMUEBLE)[number],
      ...(form.area_m2 && { area_m2: parseFloat(form.area_m2) }),
      ...(form.habitaciones && { habitaciones: parseInt(form.habitaciones) }),
      ...(form.banos && { banos: parseInt(form.banos) }),
      ...(form.descripcion.trim() && { descripcion: form.descripcion.trim() }),
      ...(form.caracteristicas.trim() && {
        caracteristicas: form.caracteristicas
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      }),
      ...(contacto && { contacto }),
    };

    setEnviando(true);
    const res = await crearInmueble(datos);
    setEnviando(false);

    if (res.ok) {
      setExito(true);
      setForm(EMPTY_FORM);
    } else if (res.errores) {
      setErrores(res.errores);
    } else {
      setErrorGeneral(res.error ?? "Error al crear la propiedad");
    }
  }

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center max-w-sm mx-auto">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-base mb-1">Acceso restringido</h3>
          <p className="text-sm text-muted-foreground">
            {usuario
              ? "No tienes permiso para agregar propiedades. Contacta a un administrador."
              : "Debes iniciar sesión y tener permiso para agregar propiedades."}
          </p>
        </div>
        {!usuario && (
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    );
  }

  if (exito) {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center max-w-sm mx-auto">
        <div className="relative w-52 h-52">
          <Image
            src="/illustrations/realtors.png"
            alt="Propiedad publicada"
            fill
            className="object-contain"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold">¡Propiedad publicada!</p>
          <p className="text-sm text-muted-foreground">
            Tu propiedad ha sido creada y ya está visible en el listado.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setExito(false)}>
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Agregar otra
          </Button>
          {onSuccess && (
            <Button variant="outline" onClick={onSuccess}>
              Ver listado
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {errorGeneral && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorGeneral}
        </div>
      )}

      {/* Información principal */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Información principal
        </h3>
        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            value={form.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            placeholder="Ej. Apartamento en Piantini"
            aria-invalid={!!errores.titulo}
          />
          {errores.titulo && <p className="text-xs text-destructive">{errores.titulo}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="precio">Precio (RD$) *</Label>
            <Input
              id="precio"
              type="number"
              min={0}
              value={form.precio}
              onChange={(e) => set("precio", e.target.value)}
              placeholder="0"
              aria-invalid={!!errores.precio}
            />
            {errores.precio && <p className="text-xs text-destructive">{errores.precio}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación *</Label>
            <Input
              id="ubicacion"
              value={form.ubicacion}
              onChange={(e) => set("ubicacion", e.target.value)}
              placeholder="Ej. Santo Domingo, Naco"
              aria-invalid={!!errores.ubicacion}
            />
            {errores.ubicacion && (
              <p className="text-xs text-destructive">{errores.ubicacion}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v ?? "")}>
              <SelectTrigger aria-invalid={!!errores.tipo}>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_INMUEBLE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errores.tipo && <p className="text-xs text-destructive">{errores.tipo}</p>}
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => set("estado", v ?? "disponible")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_INMUEBLE.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Detalles físicos */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Detalles físicos
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="area">Área (m²)</Label>
            <Input
              id="area"
              type="number"
              min={0}
              value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hab">Habitaciones</Label>
            <Input
              id="hab"
              type="number"
              min={0}
              value={form.habitaciones}
              onChange={(e) => set("habitaciones", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banos">Baños</Label>
            <Input
              id="banos"
              type="number"
              min={0}
              value={form.banos}
              onChange={(e) => set("banos", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* Descripción */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Descripción
        </h3>
        <div className="space-y-2">
          <Label htmlFor="desc">Descripción</Label>
          <Textarea
            id="desc"
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Describe la propiedad…"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="caract">
            Características{" "}
            <span className="text-muted-foreground font-normal">(separadas por coma)</span>
          </Label>
          <Input
            id="caract"
            value={form.caracteristicas}
            onChange={(e) => set("caracteristicas", e.target.value)}
            placeholder="Piscina, Parqueo, Seguridad 24h"
          />
        </div>
      </section>

      {/* Contacto */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Contacto <span className="normal-case font-normal">(opcional)</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="c-nombre">Nombre</Label>
            <Input
              id="c-nombre"
              value={form.contacto_nombre}
              onChange={(e) => set("contacto_nombre", e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-tel">Teléfono</Label>
            <Input
              id="c-tel"
              value={form.contacto_telefono}
              onChange={(e) => set("contacto_telefono", e.target.value)}
              placeholder="809-555-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={form.contacto_email}
              onChange={(e) => set("contacto_email", e.target.value)}
              placeholder="juan@ejemplo.com"
            />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={enviando} className="w-full sm:w-auto">
        {enviando ? "Creando…" : "Crear propiedad"}
      </Button>
    </form>
  );
}
