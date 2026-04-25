"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

export function AppHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // En páginas sin hero, usar siempre el estilo oscuro
  const dark = scrolled || !isHome;

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <header
        className={`
          pointer-events-auto flex items-center gap-1 rounded-full px-2 py-1.5
          transition-all duration-300 ease-in-out
          ${dark
            ? "bg-card/95 backdrop-blur-md border border-border shadow-lg shadow-foreground/5 text-foreground"
            : "bg-white/12 backdrop-blur-md border border-white/20 shadow-md shadow-black/10 text-white"
          }
        `}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full transition-colors hover:bg-white/10"
        >
          <div
            className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
              dark ? "bg-primary" : "bg-white/25"
            }`}
          >
            <Building2
              className={`h-3.5 w-3.5 transition-colors ${
                dark ? "text-primary-foreground" : "text-white"
              }`}
            />
          </div>
          <span
            className={`font-bold text-sm leading-none transition-colors ${
              dark ? "text-foreground" : "text-white"
            }`}
          >
            REI
          </span>
          <span
            className={`text-xs hidden sm:inline transition-colors ${
              dark ? "text-muted-foreground" : "text-white/55"
            }`}
          >
            · Santo Domingo
          </span>
        </Link>

        {/* Divider */}
        <div
          className={`h-4 w-px mx-1 transition-colors ${
            dark ? "bg-border" : "bg-white/20"
          }`}
        />

        {/* Nav pills */}
        <nav className="hidden md:flex items-center gap-0.5">
          {[
            { label: "Propiedades",  href: "/" },
            { label: "Estadísticas", href: "/?section=estadisticas" },
            { label: "Mapa",         href: "/?section=mapa" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                dark
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                  : "text-white/70 hover:text-white hover:bg-white/12"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div
          className={`h-4 w-px mx-1 transition-colors ${
            dark ? "bg-border" : "bg-white/20"
          }`}
        />

        {/* Auth */}
        <UserMenu scrolled={dark} />
      </header>
    </div>
  );
}
