"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { UserCircle, LogOut, User, Settings, ChevronDown, Shield } from "lucide-react";

export function UserMenu({ scrolled }: { scrolled: boolean }) {
  const { usuario, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!usuario) {
    return (
      <Link
        href="/login"
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
          scrolled
            ? "text-foreground hover:bg-muted"
            : "text-white/85 hover:text-white hover:bg-white/12"
        }`}
      >
        <UserCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Iniciar sesión</span>
      </Link>
    );
  }

  const iniciales = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .map((s) => s![0].toUpperCase())
    .join("") || usuario.email[0].toUpperCase();

  const nombreDisplay = usuario.nombre
    ? `${usuario.nombre}${usuario.apellido ? ` ${usuario.apellido}` : ""}`
    : usuario.email;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-colors ${
          scrolled
            ? "hover:bg-muted text-foreground"
            : "hover:bg-white/12 text-white/90"
        }`}
      >
        {/* Avatar */}
        <span
          className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            isAdmin
              ? "bg-primary text-primary-foreground"
              : scrolled
              ? "bg-muted text-foreground"
              : "bg-white/20 text-white"
          }`}
        >
          {iniciales}
        </span>
        <span className="hidden sm:inline max-w-[80px] truncate">{nombreDisplay}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border bg-card text-foreground shadow-lg shadow-foreground/10 overflow-hidden z-50">
          {/* Header del menú */}
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium truncate">{nombreDisplay}</p>
            <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Shield className="h-2.5 w-2.5" />
                Admin
              </span>
            )}
          </div>

          {/* Opciones */}
          <div className="py-1">
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Mi perfil
            </Link>

            {isAdmin && (
              <Link
                href="/admin/usuarios"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                Panel de admin
              </Link>
            )}
          </div>

          <div className="border-t py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
