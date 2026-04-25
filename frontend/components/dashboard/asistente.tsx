"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Inmueble } from "@/types/inmueble";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Ruler, Send, Bot, User, Sparkles } from "lucide-react";

// ── API call ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface BusquedaNaturalResponse {
  ok: boolean;
  filtros?: {
    tipo?: string | null;
    ubicacion?: string | null;
    habitaciones?: number | null;
    precio_min?: number | null;
    precio_max?: number | null;
    tipo_operacion?: string | null;
    resumen?: string;
  };
  inmuebles?: Inmueble[];
  total?: number;
  error?: string;
}

async function buscarNatural(query: string): Promise<BusquedaNaturalResponse> {
  try {
    const res = await fetch(`${API_URL}/api/search/natural`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor" };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatPrecio(precio: number, moneda = "USD") {
  const sym = moneda === "DOP" ? "RD$" : "$";
  return `${sym}${precio.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

// ── Tarjeta de resultado ─────────────────────────────────────────────────────

function ResultCard({ inm }: { inm: Inmueble }) {
  return (
    <Link
      href={`/inmuebles/${inm.id}`}
      className="block rounded-xl border bg-card hover:shadow-md transition-shadow p-3 space-y-1.5"
    >
      <p className="font-semibold text-sm line-clamp-2 leading-tight">{inm.titulo}</p>
      <p className="text-primary font-bold text-sm">{formatPrecio(inm.precio, inm.moneda)}</p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inm.ubicacion}</span>
        {inm.habitaciones != null && (
          <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{inm.habitaciones} hab.</span>
        )}
        {inm.area_m2 != null && (
          <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{inm.area_m2} m²</span>
        )}
      </div>
      <Badge variant="outline" className="text-[10px] capitalize">{inm.tipo}</Badge>
    </Link>
  );
}

// ── Tipos de mensaje ─────────────────────────────────────────────────────────

interface MensajeUsuario {
  rol: "usuario";
  texto: string;
}

interface MensajeAsistente {
  rol: "asistente";
  resumen: string;
  filtros: BusquedaNaturalResponse["filtros"];
  inmuebles: Inmueble[];
  total: number;
}

interface MensajeError {
  rol: "error";
  texto: string;
}

type Mensaje = MensajeUsuario | MensajeAsistente | MensajeError;

// ── Burbuja de filtros ───────────────────────────────────────────────────────

function FiltroBadges({ filtros }: { filtros: BusquedaNaturalResponse["filtros"] }) {
  if (!filtros) return null;
  const tags = [
    filtros.tipo && { label: filtros.tipo },
    filtros.ubicacion && { label: filtros.ubicacion },
    filtros.habitaciones != null && { label: `${filtros.habitaciones} hab.` },
    filtros.precio_min != null && { label: `Desde ${formatPrecio(filtros.precio_min)}` },
    filtros.precio_max != null && { label: `Hasta ${formatPrecio(filtros.precio_max)}` },
    filtros.tipo_operacion && { label: filtros.tipo_operacion },
  ].filter(Boolean) as { label: string }[];

  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {tags.map((t, i) => (
        <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          {t.label}
        </span>
      ))}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

const EJEMPLOS = [
  "Apartamento de 2 habitaciones en Piantini menos de $200k",
  "Casa con 3 habitaciones en Arroyo Hondo",
  "Villa en Cap Cana para comprar",
  "Terreno en La Romana",
];

export default function Asistente({ initialQuery }: { initialQuery?: string } = {}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialFired = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    if (initialQuery && !initialFired.current) {
      initialFired.current = true;
      enviar(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function enviar(texto: string) {
    const query = texto.trim();
    if (!query || cargando) return;

    setInput("");
    setMensajes((prev) => [...prev, { rol: "usuario", texto: query }]);
    setCargando(true);

    const res = await buscarNatural(query);

    if (res.ok && res.filtros) {
      setMensajes((prev) => [
        ...prev,
        {
          rol: "asistente",
          resumen: res.filtros!.resumen ?? "Resultados encontrados",
          filtros: res.filtros,
          inmuebles: res.inmuebles ?? [],
          total: res.total ?? 0,
        },
      ]);
    } else {
      setMensajes((prev) => [
        ...prev,
        { rol: "error", texto: res.error ?? "Error al procesar la búsqueda" },
      ]);
    }

    setCargando(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enviar(input);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {mensajes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Busca en lenguaje natural</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Describe lo que buscas con tus propias palabras y el asistente encontrará las propiedades que coincidan.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {EJEMPLOS.map((ej) => (
                <button
                  key={ej}
                  onClick={() => enviar(ej)}
                  className="text-xs border rounded-full px-3 py-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {ej}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((msg, i) => {
          if (msg.rol === "usuario") {
            return (
              <div key={i} className="flex justify-end">
                <div className="flex items-end gap-2 max-w-[80%]">
                  <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                    {msg.texto}
                  </div>
                  <div className="shrink-0 rounded-full bg-muted p-1.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          }

          if (msg.rol === "error") {
            return (
              <div key={i} className="flex justify-start">
                <div className="flex items-end gap-2 max-w-[80%]">
                  <div className="shrink-0 rounded-full bg-primary/10 p-1.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                    {msg.texto}
                  </div>
                </div>
              </div>
            );
          }

          // Mensaje del asistente
          return (
            <div key={i} className="flex justify-start">
              <div className="flex items-start gap-2 max-w-full w-full">
                <div className="shrink-0 rounded-full bg-primary/10 p-1.5 mt-1">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">
                    <p>{msg.resumen}</p>
                    <FiltroBadges filtros={msg.filtros} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {msg.total} propiedad{msg.total !== 1 ? "es" : ""} encontrada{msg.total !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {msg.inmuebles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.inmuebles.slice(0, 6).map((inm) => (
                        <ResultCard key={inm.id} inm={inm} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground px-1">
                      No encontré propiedades con esos criterios. Intenta con términos más amplios.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {cargando && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="shrink-0 rounded-full bg-primary/10 p-1.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="pt-4 border-t mt-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Busco un apartamento de 2 habitaciones en Naco..."
            disabled={cargando}
            className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button type="submit" disabled={!input.trim() || cargando} size="sm" className="rounded-xl px-4">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Asistente impulsado por DeepSeek · Los resultados provienen de la base de datos local
        </p>
      </form>
    </div>
  );
}
