"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, reservationStatusColors } from "@/lib/utils";
import type { Reservation } from "@/types";

interface ReservationCalendarProps {
  reservations: Reservation[];
  onSelect?: (reservation: Reservation) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function ReservationCalendar({
  reservations,
  onSelect,
}: ReservationCalendarProps) {
  const [cursor, setCursor] = useState<Date>(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  function reservationsForDay(day: Date): Reservation[] {
    return reservations.filter((r) => {
      try {
        const checkIn = parseISO(r.checkIn);
        const checkOut = parseISO(r.checkOut);
        return (
          isSameDay(day, checkIn) ||
          isWithinInterval(day, { start: checkIn, end: checkOut })
        );
      } catch {
        return false;
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold capitalize text-primary-700">
          {format(cursor, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-gray-100"
          >
            Hoje
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[11px] font-semibold uppercase text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayReservations = reservationsForDay(day);
          const inMonth = isSameMonth(day, cursor);
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[78px] rounded-lg border p-1.5 text-left transition-colors",
                inMonth
                  ? "border-gray-100 bg-white"
                  : "border-transparent bg-gray-50/60 text-gray-300",
                today && "ring-2 ring-gold-300"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  today ? "text-gold-600" : inMonth ? "text-gray-600" : "text-gray-300"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayReservations.slice(0, 2).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelect?.(r)}
                    className={cn(
                      "block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium",
                      reservationStatusColors[r.status]
                    )}
                    title={r.guest?.name || "Reserva"}
                  >
                    {r.room?.number ? `${r.room.number} · ` : ""}
                    {r.guest?.name || "Reserva"}
                  </button>
                ))}
                {dayReservations.length > 2 && (
                  <span className="block px-1 text-[10px] text-gray-400">
                    +{dayReservations.length - 2}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
