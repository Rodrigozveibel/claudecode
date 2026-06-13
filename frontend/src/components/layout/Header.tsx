"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Painel", subtitle: "Visão geral do hotel em tempo real" },
  "/conversations": {
    title: "Conversas",
    subtitle: "Atendimento via WhatsApp com IA",
  },
  "/reservations": {
    title: "Reservas",
    subtitle: "Gerencie as reservas do hotel",
  },
  "/rooms": { title: "Quartos", subtitle: "Status e tarifas dos quartos" },
  "/guests": { title: "Hóspedes", subtitle: "Base de hóspedes e leads" },
  "/promotions": {
    title: "Campanhas",
    subtitle: "Disparos de marketing no WhatsApp",
  },
  "/analytics": {
    title: "Análises",
    subtitle: "Desempenho da IA e do negócio",
  },
};

export function Header() {
  const pathname = usePathname();
  const key =
    pathname === "/"
      ? "/"
      : Object.keys(titles).find((k) => k !== "/" && pathname.startsWith(k)) ||
        "/";
  const meta = titles[key];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-primary-700">{meta.title}</h1>
        <p className="hidden text-xs text-gray-500 sm:block">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <button
          className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-700"
          aria-label="Notificações"
        >
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 py-1 pl-1 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-xs font-semibold text-gold-300">
            HP
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-gray-700">Recepção</p>
            <p className="text-[11px] text-gray-400">Hotel Paradise</p>
          </div>
        </div>
      </div>
    </header>
  );
}
