"use client";

import { RoomCard } from "./RoomCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { BedDouble } from "lucide-react";
import type { Room } from "@/types";

interface RoomGridProps {
  rooms: Room[];
  loading: boolean;
  onUpdated: (room: Room) => void;
}

export function RoomGrid({ rooms, loading, onUpdated }: RoomGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-card"
          >
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="mt-3 h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-4 h-7 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
        <BedDouble size={30} />
        <p className="text-sm">Nenhum quarto cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onUpdated={onUpdated} />
      ))}
    </div>
  );
}
