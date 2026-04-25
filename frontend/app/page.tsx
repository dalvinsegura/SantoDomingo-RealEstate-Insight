"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Hero } from "@/components/home/hero";
import Listado from "@/components/dashboard/listado";
import Crear from "@/components/dashboard/crear";
import Buscar from "@/components/dashboard/buscar";
import Estadisticas from "@/components/dashboard/estadisticas";
import Calculadora from "@/components/dashboard/calculadora";
import MapaCalor from "@/components/dashboard/mapa-calor";
import Asistente from "@/components/dashboard/asistente";
import {
  LayoutGrid,
  Plus,
  Search,
  BarChart2,
  Calculator,
  Map,
  Bot,
  ChevronRight,
  User,
  Shield,
  LogIn,
} from "lucide-react";

type Tab =
  | "listado"
  | "crear"
  | "buscar"
  | "estadisticas"
  | "calculadora"
  | "mapa"
  | "asistente";

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ElementType;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "listado", label: "Propiedades", icon: LayoutGrid, group: "Explorar" },
  { id: "buscar", label: "Buscar", icon: Search, group: "Explorar" },
  { id: "mapa", label: "Mapa de calor", icon: Map, group: "Explorar" },
  { id: "estadisticas", label: "Estadísticas", icon: BarChart2, group: "Herramientas" },
  { id: "calculadora", label: "Calculadora", icon: Calculator, group: "Herramientas" },
  { id: "asistente", label: "Asistente IA", icon: Bot, group: "Herramientas" },
  { id: "crear", label: "Agregar propiedad", icon: Plus, group: "Gestión" },
];

const GROUPS = ["Explorar", "Herramientas", "Gestión"];

const SECTION_TITLES: Record<Tab, string> = {
  listado: "Propiedades",
  buscar: "Buscar",
  mapa: "Mapa de calor",
  estadisticas: "Estadísticas",
  calculadora: "Calculadora de precios",
  asistente: "Asistente IA",
  crear: "Agregar propiedad",
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("listado");
  const [totalPropiedades, setTotalPropiedades] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState<string | undefined>();
  const mainRef = useRef<HTMLDivElement>(null);
  const { usuario, isAdmin } = useAuth();

  useEffect(() => {
    getStats().then((res) => {
      if (res.ok && res.stats) setTotalPropiedades(res.stats.total);
    });
  }, []);

  function handleHeroBuscar(query: string) {
    setSearchQuery(query);
    setTab("asistente");
    setTimeout(() => {
      mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="flex flex-col flex-1">
      <Hero
        totalPropiedades={totalPropiedades}
        onBuscar={handleHeroBuscar}
      />

      <div ref={mainRef} className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 lg:gap-8">
        {/* Sidebar — md+ */}
        <nav className="hidden md:flex flex-col w-48 lg:w-52 shrink-0 self-start sticky top-20 gap-0.5">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            return (
              <div key={group} className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">
                  {group}
                </p>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        active
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Mi cuenta */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">
              Mi cuenta
            </p>
            {usuario ? (
              <>
                <Link
                  href="/perfil"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4 shrink-0" />
                  Mi perfil
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/usuarios"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    Administración
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile nav — horizontal scroll */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="md:hidden mb-5 overflow-x-auto pb-1">
            <div className="flex gap-2 w-max">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0 border",
                      active
                        ? "bg-primary text-primary-foreground font-medium border-primary"
                        : "bg-card text-muted-foreground hover:text-foreground border-border"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <span>Inicio</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{SECTION_TITLES[tab]}</span>
          </div>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {tab === "listado" && <Listado />}
            {tab === "crear" && <Crear onSuccess={() => setTab("listado")} />}
            {tab === "buscar" && <Buscar />}
            {tab === "estadisticas" && <Estadisticas />}
            {tab === "calculadora" && <Calculadora />}
            {tab === "mapa" && <MapaCalor />}
            {tab === "asistente" && <Asistente initialQuery={searchQuery} />}
          </main>
        </div>
      </div>
    </div>
  );
}
