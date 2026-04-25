"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { listarInmuebles, eliminarInmueble } from "@/lib/api";
import type { Inmueble } from "@/types/inmueble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Trash2,
  Search,
  X,
} from "lucide-react";

const POR_PAGINA = 24;

function formatPrecio(precio: number) {
  return `RD$ ${precio.toLocaleString("es-DO")}`;
}

function colorEstado(estado?: string) {
  switch (estado) {
    case "disponible": return "default";
    case "alquilada":
    case "vendida": return "secondary";
    default: return "outline";
  }
}

export default function Buscar() {
  const [filtros, setFiltros] = useState({ ubicacion: "", precioMin: "", precioMax: "" });
  const [resultados, setResultados] = useState<Inmueble[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  async function buscar(pag = 0) {
    setBuscando(true);
    setError(null);
    const res = await listarInmuebles({
      ubicacion: filtros.ubicacion.trim() || undefined,
      precio_min: filtros.precioMin ? parseFloat(filtros.precioMin) : undefined,
      precio_max: filtros.precioMax ? parseFloat(filtros.precioMax) : undefined,
      limite: POR_PAGINA,
      saltar: pag * POR_PAGINA,
    });
    if (res.ok && res.inmuebles) {
      setResultados(res.inmuebles);
      setTotal(res.total ?? 0);
      setPagina(pag);
    } else {
      setError(res.error ?? "Error al buscar");
    }
    setBuscando(false);
    setBuscado(true);
  }

  function limpiar() {
    setFiltros({ ubicacion: "", precioMin: "", precioMax: "" });
    setResultados([]);
    setTotal(0);
    setPagina(0);
    setBuscado(false);
    setError(null);
  }

  async function handleEliminar(id: number) {
    setEliminandoId(id);
    const res = await eliminarInmueble(id);
    if (res.ok) {
      await buscar(pagina);
    } else {
      setError(res.error ?? "Error al eliminar");
    }
    setEliminandoId(null);
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ub">Ubicación</Label>
            <Input
              id="ub"
              value={filtros.ubicacion}
              onChange={(e) => setFiltros((f) => ({ ...f, ubicacion: e.target.value }))}
              placeholder="Ej. Piantini"
              onKeyDown={(e) => e.key === "Enter" && buscar(0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pmin">Precio mínimo (RD$)</Label>
            <Input
              id="pmin"
              type="number"
              min={0}
              value={filtros.precioMin}
              onChange={(e) => setFiltros((f) => ({ ...f, precioMin: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pmax">Precio máximo (RD$)</Label>
            <Input
              id="pmax"
              type="number"
              min={0}
              value={filtros.precioMax}
              onChange={(e) => setFiltros((f) => ({ ...f, precioMax: e.target.value }))}
              placeholder="Sin límite"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => buscar(0)} disabled={buscando}>
            <Search className="h-3 w-3 mr-1" />
            {buscando ? "Buscando…" : "Buscar"}
          </Button>
          <Button variant="outline" onClick={limpiar} disabled={buscando}>
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {buscado && !buscando && (
        <p className="text-sm text-muted-foreground">
          {total} resultado{total !== 1 ? "s" : ""}
        </p>
      )}

      {buscando ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : buscado && resultados.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="relative w-72 h-44 overflow-hidden rounded-xl opacity-70">
            <Image
              src="/illustrations/city-2.png"
              alt="Sin resultados"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">Sin resultados</p>
            <p className="text-xs text-muted-foreground">
              No encontramos propiedades con esos filtros. Intenta con términos más amplios.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((inm) => (
            <div key={inm.id} className="rounded-xl border bg-card shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all">
              <Link href={`/inmuebles/${inm.id}`} className="flex flex-col flex-1 group">
                {/* Imagen */}
                <div className="relative aspect-video w-full bg-muted overflow-hidden shrink-0">
                  <Image
                    src="/illustrations/propiedad-fallback.png"
                    alt={inm.titulo}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={colorEstado(inm.estado)} className="text-[10px] capitalize shadow-sm">
                      {inm.estado ?? "disponible"}
                    </Badge>
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 px-4 pt-3 pb-3 space-y-2">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2">{inm.titulo}</h3>
                  <p className="text-xl font-bold text-primary leading-none">{formatPrecio(inm.precio)}</p>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{inm.ubicacion}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{inm.tipo}</span>
                    {inm.habitaciones != null && (
                      <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{inm.habitaciones}</span>
                    )}
                    {inm.banos != null && (
                      <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{inm.banos}</span>
                    )}
                    {inm.area_m2 != null && (
                      <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{inm.area_m2} m²</span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Eliminar */}
              <div className="px-4 pb-4">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={eliminandoId === inm.id}
                  onClick={() => handleEliminar(inm.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {eliminandoId === inm.id ? "Eliminando…" : "Eliminar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina === 0 || buscando}
            onClick={() => buscar(pagina - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">{pagina + 1} / {totalPaginas}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina + 1 >= totalPaginas || buscando}
            onClick={() => buscar(pagina + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
