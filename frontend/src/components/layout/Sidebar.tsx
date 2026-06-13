"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarCheck,
  BedDouble,
  Users,
  Megaphone,
  BarChart3,
  Hotel,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/reservations", label: "Reservas", icon: CalendarCheck },
  { href: "/rooms", label: "Quartos", icon: BedDouble },
  { href: "/guests", label: "Hóspedes", icon: Users },
  { href: "/promotions", label: "Campanhas", icon: Megaphone },
  { href: "/analytics", label: "Análises", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar-gradient sticky top-0 hidden h-screen w-64 shrink-0 flex-col text-white md:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-400/15 ring-1 ring-gold-400/30">
          <Hotel className="text-gold-400" size={24} />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight text-white">
            Hotel Paradise
          </p>
          <p className="text-xs font-medium text-gold-300">Painel de Gestão</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                  : "text-blue-100/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                size={19}
                className={cn(
                  "transition-colors",
                  active
                    ? "text-gold-400"
                    : "text-blue-200/60 group-hover:text-gold-300"
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-blue-200/60">
          Assistente WhatsApp IA
        </p>
        <p className="mt-0.5 text-xs font-medium text-gold-300">
          v1.0 • Online
        </p>
      </div>
    </aside>
  );
}
