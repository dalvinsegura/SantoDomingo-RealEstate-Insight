"use client";

import { useEffect, useState, useCallback } from "react";
import { listarInmuebles, eliminarInmueble, inicializarBD, getSectorStats, getExportUrl } from "@/lib/api";
import type { SectorStatItem } from "@/lib/api";
import type { Inmueble } from "@/types/inmueble";
import ComparadorDialog from "@/components/dashboard/comparador";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Trash2,
  RefreshCw,
  Database,
  GitCompareArrows,
  Download,
} from "lucide-react";

const POR_PAGINA = 24;

// ── Score de Valor ──────────────────────────────────────────────────────────

type ScoreValor = "ganga" | "justo" | "caro";

function buildStatsMap(stats: SectorStatItem[]): Map<string, number> {
  const map = new Map<string, number>();
  // Clave específica: tipo|sector
  for (const s of stats) {
    map.set(`${s.tipo}|${s.sector}`, s.precio_promedio);
  }
  // Clave global por tipo (promedio ponderado)
  const totales = new Map<string, { suma: number; cant: number }>();
  for (const s of stats) {
    const prev = totales.get(s.tipo) ?? { suma: 0, cant: 0 };
    totales.set(s.tipo, {
      suma: prev.suma + s.precio_promedio * s.cantidad,
      cant: prev.cant + s.cantidad,
    });
  }
  for (const [tipo, { suma, cant }] of totales) {
    map.set(`${tipo}|*`, suma / cant);
  }
  return map;
}

function calcularScore(inmueble: Inmueble, statsMap: Map<string, number>): ScoreValor | null {
  const { precio, tipo, ubicacion } = inmueble;
  if (!precio || !tipo) return null;
  const promedio =
    statsMap.get(`${tipo}|${ubicacion}`) ?? statsMap.get(`${tipo}|*`);
  if (!promedio) return null;
  const ratio = precio / promedio;
  if (ratio <= 0.85) return "ganga";
  if (ratio >= 1.20) return "caro";
  return "justo";
}

function ScoreBadge({ score }: { score: ScoreValor | null }) {
  if (!score) return null;
  const cfg: Record<ScoreValor, { label: string; cls: string }> = {
    ganga: { label: "Ganga", cls: "bg-green-100 text-green-800 border border-green-300" },
    justo: { label: "Precio Justo", cls: "bg-blue-100 text-blue-800 border border-blue-300" },
    caro:  { label: "Caro", cls: "bg-red-100 text-red-800 border border-red-300" },
  };
  const { label, cls } = cfg[score];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function formatPrecio(precio: number) {
  return `RD$ ${precio.toLocaleString("es-DO")}`;
}

function colorEstado(estado?: string) {
  switch (estado) {
    case "disponible":
      return "default";
    case "alquilada":
    case "vendida":
      return "secondary";
    case "en-tramite":
      return "outline";
    default:
      return "outline";
  }
}

function InmuebleCard({
  inmueble,
  score,
  seleccionado,
  puedeSeleccionar,
  onEliminar,
  onToggleComparar,
  eliminando,
  puedeEliminar,
}: {
  inmueble: Inmueble;
  score: ScoreValor | null;
  seleccionado: boolean;
  puedeSeleccionar: boolean;
  onEliminar: (id: number) => void;
  onToggleComparar: (id: number) => void;
  eliminando: boolean;
  puedeEliminar: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md ${
        seleccionado ? "ring-2 ring-primary border-primary" : ""
      }`}
    >
      {/* Imagen + contenido → navega a la página de detalle */}
      <Link href={`/inmuebles/${inmueble.id}`} className="flex flex-col flex-1 group">
        {/* Imagen */}
        <div className="relative aspect-video w-full bg-muted overflow-hidden shrink-0">
          <Image
            src="/illustrations/propiedad-fallback.png"
            alt={inmueble.titulo}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Estado badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={colorEstado(inmueble.estado)}
              className="text-[10px] capitalize shadow-sm"
            >
              {inmueble.estado ?? "disponible"}
            </Badge>
          </div>
          {/* Score badge */}
          {score && (
            <div className="absolute top-2 left-2">
              <ScoreBadge score={score} />
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 px-4 pt-3 pb-2 space-y-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {inmueble.titulo}
          </h3>
          <p className="text-xl font-bold text-primary leading-none">
            {formatPrecio(inmueble.precio)}
          </p>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{inmueble.ubicacion}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
              {inmueble.tipo}
            </span>
            {inmueble.habitaciones != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3 w-3" />
                {inmueble.habitaciones}
              </span>
            )}
            {inmueble.banos != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {inmueble.banos}
              </span>
            )}
            {inmueble.area_m2 != null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {inmueble.area_m2} m²
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Acciones */}
      <div className="px-4 pb-4 pt-2 flex gap-2">
        <Button
          variant={seleccionado ? "default" : "outline"}
          size="sm"
          className="flex-1"
          disabled={!seleccionado && !puedeSeleccionar}
          onClick={() => onToggleComparar(inmueble.id)}
          title={!puedeSeleccionar && !seleccionado ? "Máximo 3 propiedades" : ""}
        >
          <GitCompareArrows className="h-3 w-3 mr-1" />
          {seleccionado ? "Seleccionado" : "Comparar"}
        </Button>
        {puedeEliminar && (
          <Button
            variant="destructive"
            size="sm"
            disabled={eliminando}
            onClick={() => onEliminar(inmueble.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Listado() {
  const { canDelete } = useAuth();
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [statsMap, setStatsMap] = useState<Map<string, number>>(new Map());
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [comparadorAbierto, setComparadorAbierto] = useState(false);

  useEffect(() => {
    getSectorStats().then((res) => {
      if (res.ok && res.stats) setStatsMap(buildStatsMap(res.stats));
    });
  }, []);

  function toggleComparar(id: number) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const res = await listarInmuebles({
      limite: POR_PAGINA,
      saltar: pagina * POR_PAGINA,
    });
    if (res.ok && res.inmuebles) {
      setInmuebles(res.inmuebles);
      setTotal(res.total ?? 0);
    } else {
      setError(res.error ?? "Error al cargar propiedades");
    }
    setCargando(false);
  }, [pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleEliminar(id: number) {
    setEliminandoId(id);
    const res = await eliminarInmueble(id);
    if (res.ok) {
      await cargar();
    } else {
      setError(res.error ?? "Error al eliminar");
    }
    setEliminandoId(null);
  }

  async function handleInicializar() {
    setIniciando(true);
    const res = await inicializarBD();
    if (res.ok) {
      setPagina(0);
      await cargar();
    } else {
      setError(res.error ?? "Error al inicializar");
    }
    setIniciando(false);
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {total} propiedad{total !== 1 ? "es" : ""} registrada{total !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
            <RefreshCw className={`h-3 w-3 mr-1 ${cargando ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleInicializar} disabled={iniciando}>
            <Database className="h-3 w-3 mr-1" />
            {iniciando ? "Cargando…" : "Datos de prueba"}
          </Button>
          <a href={getExportUrl()} download="propiedades.csv">
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" />
              Exportar CSV
            </Button>
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : inmuebles.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="relative w-72 h-44 overflow-hidden rounded-xl opacity-70">
            <Image
              src="/illustrations/city-2.png"
              alt="Sin propiedades"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">No hay propiedades aún</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Carga datos de prueba para ver el listado o agrega la primera propiedad manualmente.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleInicializar} disabled={iniciando}>
            <Database className="h-3 w-3 mr-1.5" />
            {iniciando ? "Cargando…" : "Cargar datos de prueba"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inmuebles.map((inm) => (
            <InmuebleCard
              key={inm.id}
              inmueble={inm}
              score={calcularScore(inm, statsMap)}
              seleccionado={seleccionados.has(inm.id)}
              puedeSeleccionar={seleccionados.size < 3}
              onEliminar={handleEliminar}
              onToggleComparar={toggleComparar}
              eliminando={eliminandoId === inm.id}
              puedeEliminar={canDelete}
            />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina === 0 || cargando}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagina + 1} / {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina + 1 >= totalPaginas || cargando}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Barra flotante de comparación */}
      {seleccionados.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border bg-card shadow-xl px-5 py-3">
          <span className="text-sm font-medium">
            {seleccionados.size} propiedad{seleccionados.size !== 1 ? "es" : ""} seleccionada{seleccionados.size !== 1 ? "s" : ""}
          </span>
          <Button size="sm" onClick={() => setComparadorAbierto(true)}>
            <GitCompareArrows className="h-3.5 w-3.5 mr-1.5" />
            Comparar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSeleccionados(new Set())}>
            Limpiar
          </Button>
        </div>
      )}

      <ComparadorDialog
        inmuebles={inmuebles.filter((inm) => seleccionados.has(inm.id))}
        scores={inmuebles
          .filter((inm) => seleccionados.has(inm.id))
          .map((inm) => calcularScore(inm, statsMap))}
        open={comparadorAbierto}
        onClose={() => setComparadorAbierto(false)}
        onDeseleccionar={(id) => {
          toggleComparar(id);
          if (seleccionados.size <= 2) setComparadorAbierto(false);
        }}
      />
    </div>
  );
}
