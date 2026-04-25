"use client";

import { useEffect, useState } from "react";
import { getHistorialPrecio } from "@/lib/api";
import type { PrecioHistorialItem } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function formatPrecio(p: number) {
  return `$${p.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

function formatFecha(f: string) {
  const d = new Date(f);
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

// ── SVG Line Chart ──────────────────────────────────────────────────────────

const W = 480;
const H = 120;
const PAD = { top: 12, right: 16, bottom: 28, left: 64 };

function LineChart({ puntos }: { puntos: PrecioHistorialItem[] }) {
  if (puntos.length === 0) return null;

  const precios = puntos.map((p) => p.precio);
  const minP = Math.min(...precios);
  const maxP = Math.max(...precios);
  const rangoP = maxP - minP || 1;

  const fechas = puntos.map((p) => new Date(p.fecha).getTime());
  const minF = Math.min(...fechas);
  const maxF = Math.max(...fechas);
  const rangoF = maxF - minF || 1;

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  function cx(ts: number) {
    if (puntos.length === 1) return PAD.left + chartW / 2;
    return PAD.left + ((ts - minF) / rangoF) * chartW;
  }

  function cy(precio: number) {
    return PAD.top + chartH - ((precio - minP) / rangoP) * chartH;
  }

  const pts = puntos.map((p) => ({
    x: cx(new Date(p.fecha).getTime()),
    y: cy(p.precio),
    precio: p.precio,
    fecha: p.fecha,
  }));

  const pathD =
    puntos.length === 1
      ? ""
      : pts
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ");

  // Y-axis labels: min, mid, max
  const yLabels = [
    { precio: minP, y: cy(minP) },
    { precio: (minP + maxP) / 2, y: cy((minP + maxP) / 2) },
    { precio: maxP, y: cy(maxP) },
  ];

  // X-axis labels: first and last (or only one)
  const xLabels =
    puntos.length === 1
      ? [{ fecha: puntos[0].fecha, x: cx(fechas[0]) }]
      : [
          { fecha: puntos[0].fecha, x: cx(fechas[0]) },
          { fecha: puntos[puntos.length - 1].fecha, x: cx(fechas[fechas.length - 1]) },
        ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      aria-label="Gráfico de historial de precio"
    >
      {/* Grid horizontal */}
      {yLabels.map((l, i) => (
        <line
          key={i}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={l.y}
          y2={l.y}
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={1}
        />
      ))}

      {/* Y labels */}
      {yLabels.map((l, i) => (
        <text
          key={i}
          x={PAD.left - 6}
          y={l.y + 4}
          textAnchor="end"
          fontSize={9}
          fill="currentColor"
          fillOpacity={0.5}
        >
          {formatPrecio(l.precio)}
        </text>
      ))}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={H - 4}
          textAnchor={i === 0 ? "start" : "end"}
          fontSize={9}
          fill="currentColor"
          fillOpacity={0.5}
        >
          {formatFecha(l.fecha)}
        </text>
      ))}

      {/* Line */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Area fill */}
      {pathD && (
        <path
          d={`${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`}
          fill="hsl(var(--primary))"
          fillOpacity={0.06}
        />
      )}

      {/* Dots */}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={puntos.length === 1 ? 5 : 3.5}
          fill="hsl(var(--primary))"
          stroke="white"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

// ── Trend badge ─────────────────────────────────────────────────────────────

function TrendBadge({ historial }: { historial: PrecioHistorialItem[] }) {
  if (historial.length < 2) return null;
  const primero = historial[0].precio;
  const ultimo = historial[historial.length - 1].precio;
  const diff = ((ultimo - primero) / primero) * 100;

  if (Math.abs(diff) < 0.5) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> Sin variación
      </span>
    );
  }

  const subio = diff > 0;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${subio ? "text-red-600" : "text-green-600"}`}
    >
      {subio ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {subio ? "+" : ""}
      {diff.toFixed(1)}% desde el primer registro
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PrecioHistorialChart({ inmuebleId }: { inmuebleId: number }) {
  const [historial, setHistorial] = useState<PrecioHistorialItem[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getHistorialPrecio(inmuebleId).then((res) => {
      setHistorial(res.ok && res.historial ? res.historial : []);
      setCargando(false);
    });
  }, [inmuebleId]);

  if (cargando) {
    return <div className="h-24 rounded bg-muted animate-pulse" />;
  }

  if (!historial || historial.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Sin historial de precios disponible.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {historial.length} punto{historial.length !== 1 ? "s" : ""} de precio
        </p>
        <TrendBadge historial={historial} />
      </div>
      <div className="rounded-lg border bg-muted/10 p-2 text-foreground">
        <LineChart puntos={historial} />
      </div>
    </div>
  );
}
