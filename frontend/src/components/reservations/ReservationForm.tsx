"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import {
  reservationsApi,
  type ReservationPayload,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Reservation, ReservationStatus, Room } from "@/types";

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  rooms: Room[];
  reservation: Reservation | null;
}

const STATUS_OPTIONS: ReservationStatus[] = [
  "PENDENTE",
  "CONFIRMADA",
  "CANCELADA",
  "NO_SHOW",
  "FINALIZADA",
];

function toInputDate(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function ReservationForm({
  open,
  onClose,
  onSaved,
  rooms,
  reservation,
}: ReservationFormProps) {
  const editing = !!reservation;

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestId, setGuestId] = useState<string | undefined>(undefined);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ReservationStatus>("PENDENTE");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (reservation) {
      setGuestName(reservation.guest?.name || "");
      setGuestPhone(reservation.guest?.phone || "");
      setGuestId(reservation.guestId);
      setRoomId(reservation.roomId);
      setCheckIn(toInputDate(reservation.checkIn));
      setCheckOut(toInputDate(reservation.checkOut));
      setGuests(reservation.guests || 1);
      setNotes(reservation.notes || "");
      setStatus(reservation.status);
    } else {
      setGuestName("");
      setGuestPhone("");
      setGuestId(undefined);
      setRoomId(rooms[0]?.id || "");
      setCheckIn("");
      setCheckOut("");
      setGuests(1);
      setNotes("");
      setStatus("PENDENTE");
    }
  }, [open, reservation, rooms]);

  const selectedRoom = rooms.find((r) => r.id === roomId) || null;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff =
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.round(diff) : 0;
  }, [checkIn, checkOut]);

  const estimatedTotal = selectedRoom ? selectedRoom.rate * nights : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return toast.error("Informe o nome do hóspede.");
    if (!editing && !guestPhone.trim())
      return toast.error("Informe o telefone do hóspede.");
    if (!roomId) return toast.error("Selecione um quarto.");
    if (!checkIn || !checkOut) return toast.error("Defina as datas.");
    if (nights <= 0)
      return toast.error("O check-out deve ser após o check-in.");

    setSaving(true);
    try {
      if (editing && reservation) {
        await reservationsApi.update(reservation.id, {
          roomId,
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          guests,
          notes,
          status,
        });
        toast.success("Reserva atualizada.");
      } else {
        const payload: ReservationPayload = {
          guestId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          roomId,
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          guests,
          notes,
        };
        await reservationsApi.create(payload);
        toast.success("Reserva criada.");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Erro ao salvar a reserva.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar reserva" : "Nova reserva"}
      description={
        editing
          ? "Atualize os dados da reserva."
          : "Preencha os dados para criar uma reserva."
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="reservation-form" disabled={saving}>
            {saving ? "Salvando..." : editing ? "Salvar" : "Criar reserva"}
          </Button>
        </>
      }
    >
      <form id="reservation-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="guestName">Nome do hóspede</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={editing}
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <Label htmlFor="guestPhone">Telefone</Label>
            <Input
              id="guestPhone"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              disabled={editing}
              placeholder="Ex: +55 11 99999-0000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="roomId">Quarto</Label>
          <Select
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.number} · {r.type} · {formatCurrency(r.rate)}/noite
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="checkIn">Check-in</Label>
            <Input
              id="checkIn"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="checkOut">Check-out</Label>
            <Input
              id="checkOut"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="guests">Pessoas</Label>
            <Input
              id="guests"
              type="number"
              min={1}
              max={selectedRoom?.capacity ?? 10}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
            />
          </div>
          {editing && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ReservationStatus)
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pedidos especiais, preferências..."
          />
        </div>

        {nights > 0 && selectedRoom && (
          <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3 text-sm">
            <span className="text-primary-700">
              {nights} {nights === 1 ? "noite" : "noites"} ·{" "}
              {formatCurrency(selectedRoom.rate)}/noite
            </span>
            <span className="font-semibold text-primary-800">
              {formatCurrency(estimatedTotal)}
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}
