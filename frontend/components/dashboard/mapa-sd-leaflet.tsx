"use client";

import { useEffect, useRef } from "react";
import type { SectorHeatmapItem } from "@/types/inmueble";
import "leaflet/dist/leaflet.css";

// Coordenadas precisas (lat, lng) de sectores de Santo Domingo
const COORDS: Record<string, [number, number]> = {
  // ── Coordenadas verificadas ──────────────────────────────────────────────
  "piantini":                    [18.4675, -69.9396],
  "naco":                        [18.4700, -69.9330],
  "ensanche naco":               [18.4700, -69.9330],
  "evaristo morales":            [18.4715, -69.9415],
  "ensanche quisqueya":          [18.4730, -69.9470],
  "quisqueya":                   [18.4730, -69.9470],
  "bella vista":                 [18.4556, -69.9525],
  "el millón":                   [18.4595, -69.9555],
  "el millon":                   [18.4595, -69.9555],
  "los prados":                  [18.4762, -69.9560],
  "mirador sur":                 [18.4505, -69.9640],
  "mirador norte":               [18.5083, -69.9333],
  "gazcue":                      [18.4665, -69.9075],
  "gascue":                      [18.4665, -69.9075],
  "zona colonial":               [18.4720, -69.8820],
  "san carlos":                  [18.4708, -69.8985],
  "villa consuelo":              [18.4830, -69.9010],
  "ensanche la fe":              [18.4795, -69.9150],
  "ens. la fe":                  [18.4795, -69.9150],
  "la fe":                       [18.4795, -69.9150],
  "cristo rey":                  [18.5030, -69.9310],
  "capotillo":                   [18.4985, -69.9210],
  "ensanche luperón":            [18.4930, -69.9255],
  "ensanche luperon":            [18.4930, -69.9255],
  "villa juana":                 [18.4885, -69.9070],
  "villa maría":                 [18.4915, -69.8980],
  "villa maria":                 [18.4915, -69.8980],
  "los mina":                    [18.4970, -69.8525],
  "ensanche ozama":              [18.4802, -69.8624],
  "villa duarte":                [18.4753, -69.8845],
  "ciudad nueva":                [18.4753, -69.8845],
  "alma rosa":                   [18.4880, -69.8590],
  "alma rosa ii":                [18.4880, -69.8590],
  "ensanche isabelita":          [18.4750, -69.8475],
  "invivienda":                  [18.5005, -69.8585],
  "san isidro":                  [18.5035, -69.7905],
  "villa mella":                 [18.5656, -69.9013],
  "sabana perdida":              [18.5480, -69.8670],
  "los guaricanos":              [18.5605, -69.9140],
  "herrera":                     [18.4808, -70.0020],
  "buenos aires de herrera":     [18.4750, -70.0000],
  "las caobas":                  [18.4955, -70.0150],
  "manoguayabo":                 [18.5105, -70.0225],
  "hato nuevo":                  [18.5200, -70.0300],
  // ── Sectores adicionales (sin coordenada verificada, aproximadas) ────────
  "los cacicazgos":              [18.4636, -69.9548],
  "la esperilla":                [18.4844, -69.9483],
  "arroyo hondo":                [18.5019, -69.9639],
  "arroyo hondo viejo":          [18.4972, -69.9583],
  "serrallés":                   [18.4819, -69.9244],
  "la julia":                    [18.4906, -69.9742],
  "pedro brand":                 [18.5236, -70.0167],
  "cuesta hermosa iii":          [18.4981, -69.9767],
  "renacimiento":                [18.4900, -69.9450],
  "ciudad universitaria":        [18.4839, -69.9531],
  "miraflores":                  [18.4761, -70.0083],
  "ensanche fernández":          [18.4850, -69.9150],
  "ensanche fernandez":          [18.4850, -69.9150],
  "los alcarrizos":              [18.5169, -70.0167],
  "mirador del este":            [18.4750, -69.8750],
  "brisa oriental":              [18.4850, -69.8600],
  "urb. prado oriental":         [18.4780, -69.8700],
  "autopista las américas":      [18.4650, -69.8600],
  "cancino ii":                  [18.4880, -69.8500],
  "los restauradores":           [18.4900, -69.9100],
  "santo domingo":               [18.4861, -69.9312],
  "centro":                      [18.4833, -69.9000],
  "centro ciudad":               [18.4900, -69.9050],
};

type Metrica = "precio_promedio" | "cantidad" | "precio_m2_promedio";

interface Props {
  sectores: SectorHeatmapItem[];
  metrica: Metrica;
}

function normalize(v: number, min: number, max: number) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

function heatColor(t: number): string {
  // 0=azul (barato) → 0.5=amarillo → 1=rojo (caro)
  const hue = Math.round((1 - t) * 220);
  const sat = 90 + Math.round(t * 10);
  const lgt = 55 - Math.round(t * 10);
  return `hsl(${hue},${sat}%,${lgt}%)`;
}

/** Fuzzy: normaliza el nombre y busca en COORDS */
function findCoords(sector: string): [number, number] | null {
  const clean = sector
    .toLowerCase()
    .replace(/,.*$/, "")          // quita ", Santo Domingo" etc.
    .replace(/urb\.\s*/i, "")
    .replace(/ens\.\s*/i, "")
    .replace(/ensanche\s/i, "ensanche ")
    .trim();

  if (COORDS[clean]) return COORDS[clean];

  // Partial match
  for (const [key, val] of Object.entries(COORDS)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }

  // Token match (≥4 chars)
  const tokens = clean.split(/\s+/).filter((t) => t.length >= 4);
  for (const tok of tokens) {
    for (const [key, val] of Object.entries(COORDS)) {
      if (key.includes(tok)) return val;
    }
  }

  return null;
}

function fmtUSD(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MapaSDLeaflet({ sectores, metrica }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);
  const layerRef = useRef<ReturnType<typeof import("leaflet")["layerGroup"]> | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: any;
    (async () => {
      const L = (await import("leaflet")).default;

      // Fix default icon URLs broken by Webpack
      // @ts-expect-error — Leaflet internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(containerRef.current!, {
        center: [18.490, -69.920],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      // Tile: CartoDB Dark Matter (oscuro, limpio)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    })();

    return () => {
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redibuja círculos cuando cambian datos o métrica
  useEffect(() => {
    if (!mapRef.current || !layerRef.current || !sectores.length) return;

    (async () => {
      const L = (await import("leaflet")).default;
      layerRef.current!.clearLayers();

      const vals = sectores
        .map((s) =>
          metrica === "precio_promedio"
            ? s.precio_promedio
            : metrica === "cantidad"
            ? s.cantidad
            : s.precio_m2_promedio ?? 0
        )
        .filter((v) => v > 0);

      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const maxCant = Math.max(...sectores.map((s) => s.cantidad));

      for (const s of sectores) {
        const coords = findCoords(s.sector);
        if (!coords) continue;

        const val =
          metrica === "precio_promedio"
            ? s.precio_promedio
            : metrica === "cantidad"
            ? s.cantidad
            : s.precio_m2_promedio ?? 0;

        const t = normalize(val, min, max);
        const color = heatColor(t);
        const radius = Math.max(10, Math.min(36, 10 + (s.cantidad / maxCant) * 26));

        const circle = L.circleMarker(coords, {
          radius,
          color: "#ffffff",
          weight: 1.5,
          opacity: 0.7,
          fillColor: color,
          fillOpacity: 0.85,
        });

        const popupContent = `
          <div style="font-family:sans-serif;min-width:160px">
            <strong style="font-size:13px">${s.sector}</strong><br/>
            <span style="color:#aaa;font-size:11px">${s.cantidad} propiedad${s.cantidad !== 1 ? "es" : ""}</span>
            <hr style="margin:6px 0;border-color:#444"/>
            <div style="font-size:12px">
              <div>Precio prom.: <strong>${fmtUSD(s.precio_promedio)}</strong></div>
              <div>Mín: ${fmtUSD(s.precio_min)} · Máx: ${fmtUSD(s.precio_max)}</div>
              ${s.precio_m2_promedio ? `<div>Precio/m²: <strong>${fmtUSD(s.precio_m2_promedio)}</strong></div>` : ""}
            </div>
          </div>`;

        circle.bindPopup(popupContent, { maxWidth: 220 });
        circle.bindTooltip(s.sector, { direction: "top", className: "leaflet-sector-tooltip" });
        layerRef.current!.addLayer(circle);
      }
    })();
  }, [sectores, metrica]);

  return <div ref={containerRef} className="w-full h-full" />;
}
