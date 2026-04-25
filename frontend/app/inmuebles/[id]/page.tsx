"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { obtenerInmueble, getSimilares, getSectorStats } from "@/lib/api";
import type { SectorStatItem } from "@/lib/api";
import type { Inmueble } from "@/types/inmueble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PrecioHistorialChart from "@/components/dashboard/precio-historial-chart";
import {
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Phone,
  Mail,
  ArrowLeft,
  ExternalLink,
  Building2,
} from "lucide-react";

// ── Score de valor ───────────────────────────────────────────────────────────

type ScoreValor = "ganga" | "justo" | "caro";

function buildStatsMap(stats: SectorStatItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of stats) map.set(`${s.tipo}|${s.sector}`, s.precio_promedio);
  const totales = new Map<string, { suma: number; cant: number }>();
  for (const s of stats) {
    const prev = totales.get(s.tipo) ?? { suma: 0, cant: 0 };
    totales.set(s.tipo, { suma: prev.suma + s.precio_promedio * s.cantidad, cant: prev.cant + s.cantidad });
  }
  for (const [tipo, { suma, cant }] of totales) map.set(`${tipo}|*`, suma / cant);
  return map;
}

function calcularScore(inmueble: Inmueble, statsMap: Map<string, number>): ScoreValor | null {
  const { precio, tipo, ubicacion } = inmueble;
  if (!precio || !tipo) return null;
  const promedio = statsMap.get(`${tipo}|${ubicacion}`) ?? statsMap.get(`${tipo}|*`);
  if (!promedio) return null;
  const ratio = precio / promedio;
  if (ratio <= 0.85) return "ganga";
  if (ratio >= 1.20) return "caro";
  return "justo";
}

function ScoreBadge({ score }: { score: ScoreValor | null }) {
  if (!score) return null;
  const cfg: Record<ScoreValor, { label: string; cls: string }> = {
    ganga: { label: "Ganga",        cls: "bg-green-100 text-green-800 border border-green-300" },
    justo: { label: "Precio Justo", cls: "bg-blue-100 text-blue-800 border border-blue-300" },
    caro:  { label: "Caro",         cls: "bg-red-100 text-red-800 border border-red-300" },
  };
  const { label, cls } = cfg[score];
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
}

function formatPrecio(precio: number, moneda = "USD") {
  const sym = moneda === "DOP" ? "RD$" : "$";
  return `${sym}${precio.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

// ── Similar card ─────────────────────────────────────────────────────────────

function SimilarCard({ inm, score }: { inm: Inmueble; score: ScoreValor | null }) {
  return (
    <Link
      href={`/inmuebles/${inm.id}`}
      className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all group flex flex-col"
    >
      <div className="relative aspect-video w-full bg-muted overflow-hidden shrink-0">
        <Image
          src="/illustrations/propiedad-fallback.png"
          alt={inm.titulo}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
      <div className="p-3 space-y-1.5 flex-1">
        <p className="font-semibold text-sm line-clamp-2 leading-tight">{inm.titulo}</p>
        <p className="text-primary font-bold text-sm">{formatPrecio(inm.precio, inm.moneda)}</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inm.ubicacion}</span>
          {inm.habitaciones != null && <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{inm.habitaciones}</span>}
          {inm.area_m2 != null && <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{inm.area_m2} m²</span>}
        </div>
        <ScoreBadge score={score} />
      </div>
    </Link>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function DetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [inmueble, setInmueble] = useState<Inmueble | null>(null);
  const [similares, setSimilares] = useState<Inmueble[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, number>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const numId = parseInt(id);
      if (isNaN(numId)) {
        await Promise.resolve();
        setError("ID inválido");
        setCargando(false);
        return;
      }
      const [resInm, resSim, resStats] = await Promise.all([
        obtenerInmueble(numId),
        getSimilares(numId, 4),
        getSectorStats(),
      ]);
      if (!resInm.ok || !resInm.inmueble) {
        setError(resInm.error ?? "Propiedad no encontrada");
      } else {
        setInmueble(resInm.inmueble);
        setSimilares(resSim.ok && resSim.similares ? resSim.similares : []);
        if (resStats.ok && resStats.stats) setStatsMap(buildStatsMap(resStats.stats));
      }
      setCargando(false);
    }
    load();
  }, [id]);

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-4">
        <div className="h-6 w-28 rounded bg-muted animate-pulse" />
        <div className="aspect-[16/7] rounded-2xl bg-muted animate-pulse" />
        <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !inmueble) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-16 text-center space-y-4">
        <p className="text-muted-foreground">{error ?? "Propiedad no encontrada"}</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al inicio
        </Button>
      </div>
    );
  }

  const score = calcularScore(inmueble, statsMap);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">

      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al listado
      </Link>

      {/* Hero image */}
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
        <Image
          src="/illustrations/propiedad-fallback.png"
          alt={inmueble.titulo}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 896px) 100vw, 896px"
        />
        {/* Badges overlay */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <ScoreBadge score={score} />
          <Badge variant="outline" className="capitalize bg-white/90 backdrop-blur-sm text-xs">
            {inmueble.estado ?? "disponible"}
          </Badge>
        </div>
        {inmueble.tipo_operacion && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary/90 backdrop-blur-sm text-xs capitalize">
              {inmueble.tipo_operacion}
            </Badge>
          </div>
        )}
      </div>

      {/* Título, precio y ubicación */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{inmueble.titulo}</h1>

        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-3xl sm:text-4xl font-bold text-primary">
            {formatPrecio(inmueble.precio, inmueble.moneda)}
          </p>
          {inmueble.precio_m2 && (
            <span className="text-sm text-muted-foreground">
              ${inmueble.precio_m2.toLocaleString("es-DO", { maximumFractionDigits: 0 })}/m²
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{inmueble.ubicacion}</span>
          {inmueble.sector_normalizado && inmueble.sector_normalizado !== inmueble.ubicacion && (
            <span className="text-xs">({inmueble.sector_normalizado})</span>
          )}
        </div>
      </div>

      {/* Atributos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Building2, label: "Tipo",         value: inmueble.tipo },
          { icon: BedDouble, label: "Habitaciones", value: inmueble.habitaciones != null ? `${inmueble.habitaciones}` : null },
          { icon: Bath,      label: "Baños",        value: inmueble.banos != null ? `${inmueble.banos}` : null },
          { icon: Ruler,     label: "Área",         value: inmueble.area_m2 != null ? `${inmueble.area_m2} m²` : null },
        ].map(({ icon: Icon, label, value }) =>
          value ? (
            <div key={label} className="rounded-xl border bg-card p-4 flex flex-col items-center gap-1.5 text-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-sm">{value}</p>
            </div>
          ) : null
        )}
      </div>

      {/* Descripción */}
      {inmueble.descripcion && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Descripción</h2>
          <p className="text-sm leading-relaxed">{inmueble.descripcion}</p>
        </div>
      )}

      {/* Características */}
      {inmueble.caracteristicas && inmueble.caracteristicas.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Características</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {inmueble.caracteristicas.map((c, i) => (
              <li key={i} className="text-sm flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Historial de precio */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Historial de precio</h2>
        <div className="rounded-xl border bg-card p-4">
          <PrecioHistorialChart inmuebleId={inmueble.id} />
        </div>
      </div>

      {/* Contacto */}
      {inmueble.contacto && Object.values(inmueble.contacto).some(Boolean) && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Información de contacto</h2>
          {inmueble.contacto.nombre && (
            <p className="font-medium text-sm">{inmueble.contacto.nombre}</p>
          )}
          <div className="flex flex-wrap gap-4">
            {inmueble.contacto.telefono && (
              <a
                href={`tel:${inmueble.contacto.telefono}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {inmueble.contacto.telefono}
              </a>
            )}
            {inmueble.contacto.email && (
              <a
                href={`mailto:${inmueble.contacto.email}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                {inmueble.contacto.email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Fuente */}
      {inmueble.url_fuente && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Fuente: {inmueble.fuente ?? "externa"}</span>
          <a
            href={inmueble.url_fuente}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Ver publicación original <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Propiedades similares */}
      {similares.length > 0 && (
        <div className="space-y-4 pb-8">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Propiedades similares
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {similares.map((s) => (
              <SimilarCard key={s.id} inm={s} score={calcularScore(s, statsMap)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
