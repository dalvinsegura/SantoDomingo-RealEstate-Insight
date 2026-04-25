"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSectorHeatmap } from "@/lib/api";
import type { SectorHeatmapItem } from "@/types/inmueble";

// Leaflet requiere carga sin SSR
const MapaSDLeaflet = dynamic(() => import("./mapa-sd-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
      Cargando mapa…
    </div>
  ),
});

type Metrica = "precio_promedio" | "cantidad" | "precio_m2_promedio";

const METRICA_LABELS: Record<Metrica, string> = {
  precio_promedio:    "Precio Promedio",
  cantidad:           "Cantidad",
  precio_m2_promedio: "Precio / m²",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function normalize(v: number, min: number, max: number) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

function heatColor(t: number): string {
  const hue = Math.round((1 - t) * 220);
  return `hsl(${hue},90%,55%)`;
}

export default function MapaCalor() {
  const [sectores, setSectores] = useState<SectorHeatmapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metrica, setMetrica] = useState<Metrica>("precio_promedio");

  const cargar = async () => {
    setLoading(true);
    setError("");
    const res = await getSectorHeatmap();
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Error al cargar datos");
    } else {
      setSectores(res.sectores ?? []);
    }
  };

  useEffect(() => { cargar(); }, []);

  const metricValues = sectores.map((s) =>
    metrica === "precio_promedio"
      ? s.precio_promedio
      : metrica === "cantidad"
      ? s.cantidad
      : s.precio_m2_promedio ?? 0
  ).filter((v) => v > 0);

  const metricMin = metricValues.length ? Math.min(...metricValues) : 0;
  const metricMax = metricValues.length ? Math.max(...metricValues) : 1;

  const sorted = [...sectores].sort((a, b) => {
    if (metrica === "precio_promedio") return b.precio_promedio - a.precio_promedio;
    if (metrica === "cantidad") return b.cantidad - a.cantidad;
    return (b.precio_m2_promedio ?? 0) - (a.precio_m2_promedio ?? 0);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Mapa de Calor por Sector</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualización geográfica de precios en Santo Domingo.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          {loading ? "Cargando…" : "Actualizar"}
        </Button>
      </div>

      {/* Métrica toggle */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(METRICA_LABELS) as Metrica[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetrica(m)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              metrica === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {METRICA_LABELS[m]}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── Mapa Leaflet ── */}
        <div className="xl:col-span-2 rounded-xl border overflow-hidden flex flex-col">
          {/* Leyenda */}
          <div className="px-4 py-2.5 border-b flex items-center gap-3 bg-card">
            <span className="text-xs text-muted-foreground shrink-0">
              {METRICA_LABELS[metrica]}:
            </span>
            <div
              className="flex-1 h-3 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, hsl(220,95%,55%), hsl(160,90%,50%), hsl(60,95%,55%), hsl(30,95%,55%), hsl(0,95%,55%))",
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground w-24 shrink-0">
              <span>Bajo</span>
              <span>Alto</span>
            </div>
          </div>

          {/* Mapa */}
          <div className="relative" style={{ height: 520 }}>
            <MapaSDLeaflet sectores={sectores} metrica={metrica} />
            {sectores.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-slate-400 text-sm pointer-events-none">
                Sin datos. Inicializa la BD o corre los scrapers.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-card text-xs text-muted-foreground">
            Haz clic en un círculo para ver detalles del sector · Tamaño proporcional a la cantidad de propiedades
          </div>
        </div>

        {/* ── Ranking ── */}
        <div className="rounded-xl border bg-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-medium text-sm">Ranking de Sectores</h3>
            <p className="text-xs text-muted-foreground">{METRICA_LABELS[metrica]}</p>
          </div>

          {sectores.length === 0 && !loading && (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Sin datos disponibles.
            </div>
          )}

          <div className="flex-1 overflow-auto divide-y" style={{ maxHeight: 540 }}>
            {sorted.map((s, i) => {
              const val =
                metrica === "precio_promedio"
                  ? fmt(s.precio_promedio)
                  : metrica === "cantidad"
                  ? `${s.cantidad} props.`
                  : s.precio_m2_promedio
                  ? `${fmt(s.precio_m2_promedio)}/m²`
                  : "—";

              const rawVal =
                metrica === "precio_promedio"
                  ? s.precio_promedio
                  : metrica === "cantidad"
                  ? s.cantidad
                  : s.precio_m2_promedio ?? 0;

              const t = normalize(rawVal, metricMin, metricMax);

              return (
                <div
                  key={s.sector}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                    {i + 1}
                  </span>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: heatColor(t) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.sector}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.cantidad} propiedad{s.cantidad !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {val}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
