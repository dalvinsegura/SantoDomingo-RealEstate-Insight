"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, DollarSign, CheckCircle, TrendingUp } from "lucide-react";

interface Stats {
  total: number;
  precio_promedio: number;
  disponibles: number;
  tipo_mas_comun: string;
}

function formatPrecio(precio: number) {
  return `RD$ ${precio.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

function KpiCard({
  titulo,
  valor,
  icon: Icon,
  cargando,
}: {
  titulo: string;
  valor: string;
  icon: React.ElementType;
  cargando: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start gap-4">
      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{titulo}</p>
        {cargando ? (
          <div className="mt-1 h-7 w-24 rounded bg-muted animate-pulse" />
        ) : (
          <p className="text-2xl font-bold tracking-tight truncate">{valor}</p>
        )}
      </div>
    </div>
  );
}

export default function Estadisticas() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    const res = await getStats();
    if (res.ok && res.stats) {
      setStats(res.stats);
    } else {
      setError(res.error ?? "Error al cargar estadísticas");
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Resumen del inventario</h2>
        <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
          <RefreshCw className={`h-3 w-3 mr-1 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          titulo="Total propiedades"
          valor={stats ? String(stats.total) : "—"}
          icon={Home}
          cargando={cargando}
        />
        <KpiCard
          titulo="Precio promedio"
          valor={stats ? formatPrecio(stats.precio_promedio) : "—"}
          icon={DollarSign}
          cargando={cargando}
        />
        <KpiCard
          titulo="Disponibles"
          valor={stats ? String(stats.disponibles) : "—"}
          icon={CheckCircle}
          cargando={cargando}
        />
        <KpiCard
          titulo="Tipo más común"
          valor={stats?.tipo_mas_comun ?? "—"}
          icon={TrendingUp}
          cargando={cargando}
        />
      </div>
    </div>
  );
}
