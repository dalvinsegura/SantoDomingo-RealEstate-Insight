"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, Search } from "lucide-react";

const EJEMPLOS = [
  "2 hab. en Piantini",
  "Villa con piscina en Arroyo Hondo",
  "Apartamento menos de $150k",
  "Terreno en La Romana",
];

interface HeroProps {
  totalPropiedades?: number;
  onBuscar: (query: string) => void;
}

export function Hero({ totalPropiedades, onBuscar }: HeroProps) {
  const [query, setQuery] = useState("");

  function submit(texto: string) {
    const q = texto.trim();
    if (!q) return;
    setQuery(q);
    onBuscar(q);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(query);
  }

  return (
    <section className="relative w-full min-h-[520px] sm:min-h-[580px] overflow-hidden flex items-center">
      <Image
        src="/illustrations/city-1.png"
        alt="Santo Domingo"
        fill
        className="object-cover object-top"
        priority
        sizes="100vw"
      />
      {/* Overlay base sólido */}
      <div className="absolute inset-0 bg-foreground/65" />
      {/* Gradiente encima para más profundidad en zona de texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/45" />

      <div className="relative z-10 w-full flex flex-col items-center text-center px-4 sm:px-6 pt-24 pb-16">
        <p className="text-white/80 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
          Mercado inmobiliario · Santo Domingo
        </p>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
          Encuentra tu propiedad ideal
        </h1>

        <p className="mt-3 text-white/85 text-sm sm:text-base max-w-sm [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
          Describe lo que buscas con tus propias palabras.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 w-full max-w-2xl flex gap-2 bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl p-2 shadow-xl"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
            <Search className="h-4 w-4 text-white/60 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: apartamento de 2 hab. en Piantini menos de $200k…"
              className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm focus:outline-none min-w-0"
            />
          </div>
          <Button
            type="submit"
            disabled={!query.trim()}
            className="rounded-xl shrink-0 px-5"
          >
            Buscar
          </Button>
        </form>

        {/* Example chips */}
        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
          {EJEMPLOS.map((ej) => (
            <button
              key={ej}
              type="button"
              onClick={() => submit(ej)}
              className="text-xs text-white/90 bg-white/15 hover:bg-white/25 border border-white/30 rounded-full px-3 py-1.5 transition-colors"
            >
              {ej}
            </button>
          ))}
        </div>

        {/* Stats pills */}
        <div className="mt-8 flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <Pill icon={MapPin} text="Santo Domingo, RD" />
          {totalPropiedades != null && totalPropiedades > 0 && (
            <Pill icon={TrendingUp} text={`${totalPropiedades} propiedades`} />
          )}
        </div>
      </div>
    </section>
  );
}

function Pill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/30">
      <Icon className="h-3 w-3 shrink-0" />
      {text}
    </div>
  );
}
