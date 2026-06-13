"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ReservationTable } from "@/components/reservations/ReservationTable";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { ReservationCalendar } from "@/components/dashboard/ReservationCalendar";
import { useReservations } from "@/hooks/useReservations";
import { reservationsApi, roomsApi } from "@/lib/api";
import { reservationStatusLabels } from "@/lib/utils";
import { CalendarDays, List, Plus } from "lucide-react";
import type { Reservation, ReservationStatus, Room } from "@/types";

export default function ReservationsPage() {
  const { reservations, loading, filters, setFilters, reload } =
    useReservations();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);

  useEffect(() => {
    roomsApi
      .list()
      .then(setRooms)
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(reservation: Reservation) {
    setEditing(reservation);
    setFormOpen(true);
  }

  async function handleCancel(reservation: Reservation) {
    if (!confirm(`Cancelar a reserva de ${reservation.guest?.name || "hóspede"}?`))
      return;
    try {
      await reservationsApi.cancel(reservation.id);
      toast.success("Reserva cancelada.");
      reload();
    } catch {
      toast.error("Erro ao cancelar a reserva.");
    }
  }

  const statuses: ReservationStatus[] = [
    "PENDENTE",
    "CONFIRMADA",
    "CANCELADA",
    "NO_SHOW",
    "FINALIZADA",
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="h-9 w-44"
            value={filters.status || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: (e.target.value as ReservationStatus) || "",
              }))
            }
          >
            <option value="">Todos os status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {reservationStatusLabels[s]}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            className="h-9 w-40"
            value={filters.from || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, from: e.target.value || undefined }))
            }
          />
          <Input
            type="date"
            className="h-9 w-40"
            value={filters.to || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, to: e.target.value || undefined }))
            }
          />
          {(filters.status || filters.from || filters.to) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters({})}
            >
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "table"
                  ? "bg-primary-700 text-white"
                  : "text-gray-500 hover:text-primary-700"
              }`}
            >
              <List size={15} /> Lista
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "calendar"
                  ? "bg-primary-700 text-white"
                  : "text-gray-500 hover:text-primary-700"
              }`}
            >
              <CalendarDays size={15} /> Calendário
            </button>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} /> Nova reserva
          </Button>
        </div>
      </div>

      {view === "table" ? (
        <Card className="overflow-hidden">
          <ReservationTable
            reservations={reservations}
            loading={loading}
            onEdit={openEdit}
            onCancel={handleCancel}
          />
        </Card>
      ) : (
        <ReservationCalendar
          reservations={reservations}
          onSelect={openEdit}
        />
      )}

      <ReservationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        rooms={rooms}
        reservation={editing}
      />
    </div>
  );
}
