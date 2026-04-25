"use client";

import type { Inmueble } from "@/types/inmueble";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Bath, Ruler, MapPin, X } from "lucide-react";

type ScoreValor = "ganga" | "justo" | "caro";

function ScoreBadge({ score }: { score: ScoreValor | null }) {
  if (!score) return <span className="text-muted-foreground text-xs">—</span>;
  const cfg: Record<ScoreValor, { label: string; cls: string }> = {
    ganga: { label: "Ganga",       cls: "bg-green-100 text-green-800 border border-green-300" },
    justo: { label: "Precio Justo", cls: "bg-blue-100 text-blue-800 border border-blue-300" },
    caro:  { label: "Caro",        cls: "bg-red-100 text-red-800 border border-red-300" },
  };
  const { label, cls } = cfg[score];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function formatPrecio(precio: number) {
  return `$${precio.toLocaleString("es-DO")}`;
}

function ValorCelda({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3 text-center text-sm align-middle border-l first:border-l-0">
      {children ?? <span className="text-muted-foreground">—</span>}
    </td>
  );
}

function FilaAtributo({
  label,
  values,
}: {
  label: string;
  values: React.ReactNode[];
}) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap bg-muted/20 w-36">
        {label}
      </td>
      {values.map((v, i) => (
        <ValorCelda key={i}>{v}</ValorCelda>
      ))}
    </tr>
  );
}

interface ComparadorProps {
  inmuebles: Inmueble[];
  scores: (ScoreValor | null)[];
  open: boolean;
  onClose: () => void;
  onDeseleccionar: (id: number) => void;
}

export default function ComparadorDialog({
  inmuebles,
  scores,
  open,
  onClose,
  onDeseleccionar,
}: ComparadorProps) {
  if (inmuebles.length === 0) return null;

  const rows: { label: string; render: (inm: Inmueble, idx: number) => React.ReactNode }[] = [
    {
      label: "Precio",
      render: (inm) => (
        <span className="font-bold text-primary">{formatPrecio(inm.precio)}</span>
      ),
    },
    {
      label: "Score",
      render: (_, idx) => <ScoreBadge score={scores[idx]} />,
    },
    {
      label: "Tipo",
      render: (inm) => <Badge variant="outline" className="text-xs">{inm.tipo}</Badge>,
    },
    {
      label: "Estado",
      render: (inm) => (
        <span className="capitalize text-xs">{inm.estado ?? "disponible"}</span>
      ),
    },
    {
      label: "Ubicación",
      render: (inm) => (
        <span className="flex items-center justify-center gap-1 text-xs">
          <MapPin className="h-3 w-3 shrink-0" />
          {inm.ubicacion}
        </span>
      ),
    },
    {
      label: "Habitaciones",
      render: (inm) =>
        inm.habitaciones != null ? (
          <span className="flex items-center justify-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {inm.habitaciones}
          </span>
        ) : null,
    },
    {
      label: "Baños",
      render: (inm) =>
        inm.banos != null ? (
          <span className="flex items-center justify-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {inm.banos}
          </span>
        ) : null,
    },
    {
      label: "Área",
      render: (inm) =>
        inm.area_m2 != null ? (
          <span className="flex items-center justify-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {inm.area_m2} m²
          </span>
        ) : null,
    },
    {
      label: "Características",
      render: (inm) =>
        inm.caracteristicas && inm.caracteristicas.length > 0 ? (
          <ul className="text-xs text-left space-y-0.5 text-muted-foreground">
            {inm.caracteristicas.slice(0, 4).map((c, i) => (
              <li key={i}>• {c}</li>
            ))}
            {inm.caracteristicas.length > 4 && (
              <li className="text-muted-foreground">+{inm.caracteristicas.length - 4} más</li>
            )}
          </ul>
        ) : null,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparar propiedades</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-muted-foreground font-medium w-36 bg-muted/20">
                  Atributo
                </th>
                {inmuebles.map((inm) => (
                  <th key={inm.id} className="px-4 py-3 text-center border-l">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold leading-snug line-clamp-3 text-left">
                        {inm.titulo}
                      </span>
                      <button
                        onClick={() => onDeseleccionar(inm.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                        title="Quitar de comparación"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <FilaAtributo
                  key={row.label}
                  label={row.label}
                  values={inmuebles.map((inm, idx) => row.render(inm, idx))}
                />
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
