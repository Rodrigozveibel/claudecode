"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { roomsApi } from "@/lib/api";
import {
  formatCurrency,
  roomStatusColors,
  roomStatusLabels,
} from "@/lib/utils";
import { BedDouble, Pencil, Users } from "lucide-react";
import type { Room, RoomStatus } from "@/types";

interface RoomCardProps {
  room: Room;
  onUpdated: (room: Room) => void;
}

const STATUSES: RoomStatus[] = ["LIVRE", "OCUPADO", "LIMPEZA", "MANUTENCAO"];

const accentBar: Record<RoomStatus, string> = {
  LIVRE: "bg-green-500",
  OCUPADO: "bg-red-500",
  LIMPEZA: "bg-yellow-500",
  MANUTENCAO: "bg-gray-400",
};

export function RoomCard({ room, onUpdated }: RoomCardProps) {
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(room.rate);
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRate(room.rate);
      setStatus(room.status);
    }
  }, [open, room]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await roomsApi.update(room.id, { rate, status });
      onUpdated(updated);
      toast.success(`Quarto ${room.number} atualizado.`);
      setOpen(false);
    } catch {
      toast.error("Erro ao atualizar o quarto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-card-hover">
        <div className={`h-1 w-full ${accentBar[room.status]}`} />
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <BedDouble size={18} />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-800">
                    {room.number}
                  </p>
                  <p className="text-xs text-gray-500">{room.type}</p>
                </div>
              </div>
            </div>
            <Badge className={roomStatusColors[room.status]}>
              {roomStatusLabels[room.status]}
            </Badge>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Users size={13} /> {room.capacity} pessoas
            </span>
            <span>Andar {room.floor}</span>
          </div>

          {room.amenities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {room.amenities.slice(0, 3).map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500"
                >
                  {a}
                </span>
              ))}
              {room.amenities.length > 3 && (
                <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">
                  +{room.amenities.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
            <div>
              <p className="text-lg font-bold text-primary-700">
                {formatCurrency(room.rate)}
              </p>
              <p className="text-[11px] text-gray-400">por noite</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              <Pencil size={14} /> Editar
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Quarto ${room.number}`}
        description={`${room.type} · Andar ${room.floor}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="rate">Tarifa por noite (R$)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {roomStatusLabels[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </>
  );
}
