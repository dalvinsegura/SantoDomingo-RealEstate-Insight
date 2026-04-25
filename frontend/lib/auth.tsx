"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Usuario, PermisosGlobales } from "@/types/usuario";

const TOKEN_KEY = "rei_auth_token";

// ── Contexto ────────────────────────────────────────────────────────────────

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  isAdmin: boolean;
  /** Permisos efectivos (global + usuario + admin) */
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  permisosGlobales: PermisosGlobales;
  cargando: boolean;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshPermisosGlobales: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  usuario: null,
  token: null,
  isAdmin: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  permisosGlobales: { crear: false, editar: false, eliminar: false },
  cargando: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  refreshPermisosGlobales: async () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permisosGlobales, setPermisosGlobales] = useState<PermisosGlobales>({
    crear: false,
    editar: false,
    eliminar: false,
  });
  const [cargando, setCargando] = useState(true);

  const refreshPermisosGlobales = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/permisos-globales`);
      const data = await res.json();
      if (data.ok && data.permisos) setPermisosGlobales(data.permisos);
    } catch {
      // silencioso — usa defaults
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;
    if (!storedToken) {
      setCargando(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await res.json();
      if (data.ok && data.usuario) {
        setToken(storedToken);
        setUsuario(data.usuario);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUsuario(null);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    refreshPermisosGlobales();
  }, [refreshUser, refreshPermisosGlobales]);

  const login = useCallback((newToken: string, newUsuario: Usuario) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUsuario(newUsuario);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  const isAdmin = usuario?.rol === "admin";

  const canCreate =
    isAdmin ||
    permisosGlobales.crear ||
    (usuario?.permisos?.crear ?? false);

  const canEdit =
    isAdmin ||
    permisosGlobales.editar ||
    (usuario?.permisos?.editar ?? false);

  const canDelete =
    isAdmin ||
    permisosGlobales.eliminar ||
    (usuario?.permisos?.eliminar ?? false);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isAdmin,
        canCreate,
        canEdit,
        canDelete,
        permisosGlobales,
        cargando,
        login,
        logout,
        refreshUser,
        refreshPermisosGlobales,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}

// ── Helper para obtener token en llamadas API ─────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
