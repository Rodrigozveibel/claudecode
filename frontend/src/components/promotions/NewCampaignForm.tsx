"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { promotionsApi, type PromotionPayload } from "@/lib/api";
import { promotionSegmentLabels } from "@/lib/utils";
import { Smartphone } from "lucide-react";
import type { Promotion, PromotionSegment } from "@/types";

interface NewCampaignFormProps {
  onCreated: (promotion: Promotion) => void;
}

const SEGMENTS: PromotionSegment[] = ["ALL", "PAST_GUESTS", "LEADS", "LOYAL"];

export function NewCampaignForm({ onCreated }: NewCampaignFormProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [targetSegment, setTargetSegment] = useState<PromotionSegment>("ALL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome da campanha.");
    if (!message.trim()) return toast.error("Escreva a mensagem.");

    setSaving(true);
    try {
      const payload: PromotionPayload = {
        name: name.trim(),
        message: message.trim(),
        targetSegment,
        scheduledAt: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined,
      };
      const created = await promotionsApi.create(payload);
      onCreated(created);
      toast.success("Campanha criada.");
      setName("");
      setMessage("");
      setTargetSegment("ALL");
      setScheduledAt("");
    } catch {
      toast.error("Erro ao criar a campanha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova campanha</CardTitle>
        <CardDescription>
          Crie um disparo de marketing pelo WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da campanha</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Promoção de inverno"
            />
          </div>

          <div>
            <Label htmlFor="segment">Público-alvo</Label>
            <Select
              id="segment"
              value={targetSegment}
              onChange={(e) =>
                setTargetSegment(e.target.value as PromotionSegment)
              }
            >
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {promotionSegmentLabels[s]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá! Temos uma oferta especial para você..."
            />
            <p className="mt-1 text-xs text-gray-400">
              {message.length} caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="scheduledAt">Agendar (opcional)</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          {/* WhatsApp preview */}
          <div>
            <Label>Pré-visualização</Label>
            <div className="rounded-xl bg-[#e5ddd5] p-4">
              <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-green-700">
                  <Smartphone size={11} /> Hotel Paradise
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                  {message || "Sua mensagem aparecerá aqui..."}
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Criando..." : "Criar campanha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
