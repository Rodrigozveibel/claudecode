"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  MessageSquare,
  CalendarCheck,
  Percent,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import type { DashboardAnalytics } from "@/types";

interface StatsCardsProps {
  data: DashboardAnalytics | null;
  loading: boolean;
}

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
}

export function StatsCards({ data, loading }: StatsCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  const stats: Stat[] = [
    {
      label: "Conversas ativas",
      value: String(data.activeConversations),
      icon: MessageSquare,
      accent: "text-primary-700",
      iconBg: "bg-primary-50 text-primary-700",
    },
    {
      label: "Reservas hoje",
      value: String(data.reservationsToday),
      icon: CalendarCheck,
      accent: "text-primary-700",
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      label: "Taxa de ocupação",
      value: `${Math.round(data.occupancyRate)}%`,
      icon: Percent,
      accent: "text-gold-600",
      iconBg: "bg-gold-50 text-gold-600",
    },
    {
      label: "Receita do mês",
      value: formatCurrency(data.monthRevenue),
      icon: DollarSign,
      accent: "text-green-600",
      iconBg: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.label}
            className="p-5 hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}
              >
                <Icon size={20} />
              </div>
            </div>
            <p className={`mt-3 text-2xl font-bold ${s.accent}`}>{s.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
