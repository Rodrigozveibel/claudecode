"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { promotionsApi } from "@/lib/api";
import {
  formatDateTime,
  promotionSegmentLabels,
  promotionStatusColors,
  promotionStatusLabels,
} from "@/lib/utils";
import { Megaphone, Send, Users } from "lucide-react";
import type { Promotion } from "@/types";

interface CampaignListProps {
  promotions: Promotion[];
  loading: boolean;
  onSent: (promotion: Promotion) => void;
}

export function CampaignList({
  promotions,
  loading,
  onSent,
}: CampaignListProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleSend(promo: Promotion) {
    setSendingId(promo.id);
    try {
      const updated = await promotionsApi.send(promo.id);
      onSent(updated);
      toast.success("Disparo iniciado.");
    } catch {
      toast.error("Erro ao iniciar o disparo.");
    } finally {
      setSendingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white py-16 text-gray-400">
        <Megaphone size={28} />
        <p className="text-sm">Nenhuma campanha criada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {promotions.map((promo) => {
        const total = promo.totalTargets || 0;
        const sent = promo.sentCount || 0;
        const pct = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;
        const isSending = promo.status === "SENDING";
        const canSend =
          promo.status === "DRAFT" || promo.status === "SCHEDULED";

        return (
          <div
            key={promo.id}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-gray-800">
                    {promo.name}
                  </h3>
                  <Badge className={promotionStatusColors[promo.status]}>
                    {promotionStatusLabels[promo.status]}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {promo.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} />
                    {promotionSegmentLabels[promo.targetSegment]}
                  </span>
                  {promo.scheduledAt && (
                    <span>Agendada: {formatDateTime(promo.scheduledAt)}</span>
                  )}
                </div>
              </div>

              {canSend && (
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() => handleSend(promo)}
                  disabled={sendingId === promo.id}
                >
                  <Send size={14} /> Enviar
                </Button>
              )}
            </div>

            {(isSending || promo.status === "SENT" || sent > 0) && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {sent} de {total} enviadas
                  </span>
                  <span className="font-medium text-primary-700">{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      promo.status === "SENT"
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-primary-500 to-gold-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
