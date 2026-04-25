"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TIPOS_INMUEBLE } from "@/types/inmueble";
import { calcularPrecioJusto } from "@/lib/api";
import type { EstimacionResponse } from "@/lib/api";

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function RangeBar({
  min, max, p25, p75, estimado,
}: {
  min: number; max: number; p25: number; p75: number; estimado: number;
}) {
  const range = max - min || 1;
  const toPos = (v: number) => Math.round(((v - min) / range) * 100);

  return (
    <div className="mt-2 mb-1">
      <div className="relative h-3 rounded-full bg-muted">
        <div
          className="absolute h-full rounded-full bg-primary/20"
          style={{ left: `${toPos(p25)}%`, width: `${Math.max(0, toPos(p75) - toPos(p25))}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background shadow"
          style={{ left: `calc(${toPos(estimado)}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{fmt(min)}</span>
        <span className="text-primary font-medium">{fmt(estimado)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}

function ConfianzaBar({ valor, similares, total }: { valor: number; similares: number; total: number }) {
  const color =
    valor >= 60 ? "bg-emerald-500" : valor >= 30 ? "bg-amber-400" : "bg-rose-500";
  const label =
    valor >= 60 ? "Alta" : valor >= 30 ? "Media" : "Baja";
  const badgeVariant: "default" | "secondary" | "outline" =
    valor >= 60 ? "default" : valor >= 30 ? "secondary" : "outline";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Confianza del estimado</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {similares} similares / {total} comparables
          </span>
          <Badge variant={badgeVariant}>{label} · {valor}%</Badge>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${valor}%` }}
        />
      </div>
    </div>
  );
}

export default function Calculadora() {
  const [tipo, setTipo] = useState("");
  const [areM2, setAreM2] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<EstimacionResponse | null>(null);
  const [error, setError] = useState("");

  const calcular = async () => {
    if (!tipo) { setError("Selecciona el tipo de inmueble"); return; }
    setError("");
    setResultado(null);
    setLoading(true);
    const res = await calcularPrecioJusto({
      tipo,
      area_m2: areM2 ? parseFloat(areM2) : undefined,
      habitaciones: habitaciones ? parseInt(habitaciones) : undefined,
      ubicacion: ubicacion || undefined,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Error al calcular");
      setResultado(null);
    } else {
      setResultado(res);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Calculadora de Precio Justo</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Estimación ponderada por similitud de área, habitaciones y sector.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Formulario ── */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Parámetros
          </h3>

          <div className="space-y-2">
            <Label>Tipo de inmueble *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo…" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_INMUEBLE.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área (m²)</Label>
              <Input
                id="area"
                type="number"
                min={0}
                placeholder="ej. 120"
                value={areM2}
                onChange={(e) => setAreM2(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hab">Habitaciones</Label>
              <Input
                id="hab"
                type="number"
                min={0}
                max={20}
                placeholder="ej. 3"
                value={habitaciones}
                onChange={(e) => setHabitaciones(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ubicacion">Sector / Ubicación</Label>
            <Input
              id="ubicacion"
              placeholder="ej. Piantini, Naco, Gazcue…"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Opcional — da ×2 de peso a propiedades del mismo sector.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
          )}

          <Button onClick={calcular} disabled={loading} className="w-full">
            {loading ? "Calculando…" : "Calcular precio justo"}
          </Button>

          {/* Metodología */}
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Cómo funciona</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Gaussiana de similitud en área (penaliza ≥2× diferencia)</li>
              <li>Scoring escalonado por habitaciones (±0/1/2)</li>
              <li>Outliers removidos por IQR antes del promedio</li>
              <li>Promedio ponderado final por similitud total</li>
            </ul>
          </div>
        </div>

        {/* ── Resultados ── */}
        <div className="rounded-xl border bg-card p-6 flex flex-col">
          {!resultado && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground gap-3 py-8">
              <div className="text-5xl">🏠</div>
              <p className="text-sm">
                Completa los parámetros y pulsa<br />
                <strong>Calcular</strong> para ver la estimación.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {resultado && !loading && (
            <div className="flex-1 space-y-5">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Resultado
              </h3>

              {/* Precio principal */}
              <div className="text-center py-3 rounded-xl bg-muted/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Precio estimado
                </p>
                <p className="text-4xl font-bold tracking-tight">
                  {fmt(resultado.precio_estimado!)}
                </p>
                {resultado.precio_m2_promedio && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ≈ {fmt(resultado.precio_m2_promedio)} / m²
                    {areM2 && <span className="text-xs ml-1">(sobre {areM2} m²)</span>}
                  </p>
                )}
              </div>

              {/* Barra de rango */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Rango de mercado · banda IQR sombreada
                </p>
                <RangeBar
                  min={resultado.precio_min!}
                  max={resultado.precio_max!}
                  p25={resultado.precio_p25!}
                  p75={resultado.precio_p75!}
                  estimado={resultado.precio_estimado!}
                />
              </div>

              {/* Barra de confianza */}
              <ConfianzaBar
                valor={resultado.confianza ?? 0}
                similares={resultado.comparables_similares ?? 0}
                total={resultado.cantidad_comparables ?? 0}
              />

              {/* Métricas secundarias */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Rango 25–75%</p>
                  <p className="text-sm font-medium mt-0.5">
                    {fmt(resultado.precio_p25!)} – {fmt(resultado.precio_p75!)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Precio mínimo / máximo</p>
                  <p className="text-sm font-medium mt-0.5">
                    {fmt(resultado.precio_min!)} / {fmt(resultado.precio_max!)}
                  </p>
                </div>
              </div>

              {ubicacion && (
                <p className="text-xs text-muted-foreground text-center">
                  Sector priorizado: <strong>{ubicacion}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
