"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CampaignList } from "@/components/promotions/CampaignList";
import { NewCampaignForm } from "@/components/promotions/NewCampaignForm";
import { promotionsApi } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import type { Promotion, PromotionStatus } from "@/types";

export default function PromotionsPage() {
  const socket = useSocket();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    promotionsApi
      .list()
      .then((data) => mounted && setPromotions(data))
      .catch(() => toast.error("Erro ao carregar campanhas."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function onProgress(payload: {
      promotionId: string;
      sentCount: number;
      totalTargets: number;
      status: PromotionStatus;
    }) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === payload.promotionId
            ? {
                ...p,
                sentCount: payload.sentCount,
                totalTargets: payload.totalTargets,
                status: payload.status,
              }
            : p
        )
      );
    }
    socket.on("promotion:progress", onProgress);
    return () => {
      socket.off("promotion:progress", onProgress);
    };
  }, [socket]);

  function upsert(promo: Promotion) {
    setPromotions((prev) => {
      const exists = prev.some((p) => p.id === promo.id);
      return exists
        ? prev.map((p) => (p.id === promo.id ? { ...p, ...promo } : p))
        : [promo, ...prev];
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Campanhas
        </h2>
        <CampaignList
          promotions={promotions}
          loading={loading}
          onSent={upsert}
        />
      </div>
      <div>
        <NewCampaignForm onCreated={upsert} />
      </div>
    </div>
  );
}
