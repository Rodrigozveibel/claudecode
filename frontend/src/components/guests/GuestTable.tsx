"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SkeletonRows } from "@/components/ui/Skeleton";
import {
  guestSegmentColors,
  guestSegmentLabels,
  initials,
} from "@/lib/utils";
import { Search, Users } from "lucide-react";
import type { Guest } from "@/types";

interface GuestTableProps {
  guests: Guest[];
  loading: boolean;
}

export function GuestTable({ guests, loading }: GuestTableProps) {
  const [query, setQuery] = useState("");

  const filtered = guests.filter((g) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q) ||
      (g.email || "").toLowerCase().includes(q) ||
      (g.cpf || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card">
      <div className="border-b border-gray-100 p-3">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar hóspede..."
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-4">
          <SkeletonRows rows={6} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
          <Users size={28} />
          <p className="text-sm">Nenhum hóspede encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Hóspede</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Segmento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((g) => (
                <tr key={g.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                        {initials(g.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{g.name}</p>
                        {g.notes && (
                          <p className="max-w-[220px] truncate text-xs text-gray-400">
                            {g.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{g.phone}</td>
                  <td className="px-4 py-3 text-gray-700">{g.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{g.cpf || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={guestSegmentColors[g.segment]}>
                      {guestSegmentLabels[g.segment]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
