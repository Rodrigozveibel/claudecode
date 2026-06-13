"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonRows } from "@/components/ui/Skeleton";
import {
  formatCurrency,
  formatDate,
  reservationStatusColors,
  reservationStatusLabels,
} from "@/lib/utils";
import { CalendarX2, Pencil, Trash2 } from "lucide-react";
import type { Reservation } from "@/types";

interface ReservationTableProps {
  reservations: Reservation[];
  loading: boolean;
  onEdit: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
}

export function ReservationTable({
  reservations,
  loading,
  onEdit,
  onCancel,
}: ReservationTableProps) {
  if (loading) {
    return (
      <div className="p-4">
        <SkeletonRows rows={6} />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
        <CalendarX2 size={28} />
        <p className="text-sm">Nenhuma reserva encontrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
            <th className="px-4 py-3">Hóspede</th>
            <th className="px-4 py-3">Quarto</th>
            <th className="px-4 py-3">Check-in</th>
            <th className="px-4 py-3">Check-out</th>
            <th className="px-4 py-3">Pessoas</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reservations.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-gray-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">
                  {r.guest?.name || "—"}
                </p>
                {r.guest?.phone && (
                  <p className="text-xs text-gray-400">{r.guest.phone}</p>
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {r.room ? (
                  <span>
                    {r.room.number}
                    <span className="ml-1 text-xs text-gray-400">
                      {r.room.type}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {formatDate(r.checkIn)}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {formatDate(r.checkOut)}
              </td>
              <td className="px-4 py-3 text-gray-700">{r.guests}</td>
              <td className="px-4 py-3 font-medium text-gray-800">
                {formatCurrency(r.totalAmount)}
              </td>
              <td className="px-4 py-3">
                <Badge className={reservationStatusColors[r.status]}>
                  {reservationStatusLabels[r.status]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(r)}
                    aria-label="Editar reserva"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onCancel(r)}
                    aria-label="Cancelar reserva"
                    disabled={r.status === "CANCELADA"}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
