"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { RoomGrid } from "@/components/rooms/RoomGrid";
import { roomsApi } from "@/lib/api";
import { roomStatusLabels } from "@/lib/utils";
import type { Room, RoomStatus } from "@/types";

const FILTERS: (RoomStatus | "ALL")[] = [
  "ALL",
  "LIVRE",
  "OCUPADO",
  "LIMPEZA",
  "MANUTENCAO",
];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RoomStatus | "ALL">("ALL");

  useEffect(() => {
    let mounted = true;
    roomsApi
      .list()
      .then((data) => mounted && setRooms(data))
      .catch(() => toast.error("Erro ao carregar quartos."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  function handleUpdated(updated: Room) {
    setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rooms.length };
    for (const r of rooms) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rooms]);

  const filtered =
    filter === "ALL" ? rooms : rooms.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-700 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700"
            }`}
          >
            {f === "ALL" ? "Todos" : roomStatusLabels[f]}
            <span
              className={`ml-1.5 text-xs ${
                filter === f ? "text-gold-300" : "text-gray-400"
              }`}
            >
              {counts[f] || 0}
            </span>
          </button>
        ))}
      </div>

      <RoomGrid rooms={filtered} loading={loading} onUpdated={handleUpdated} />
    </div>
  );
}
