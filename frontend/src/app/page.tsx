"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { analyticsApi, conversationsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { LogIn, LogOut } from "lucide-react";
import type { Conversation, DashboardAnalytics } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [analytics, convs] = await Promise.all([
          analyticsApi.dashboard(),
          conversationsApi.list().catch(() => [] as Conversation[]),
        ]);
        if (!mounted) return;
        setData(analytics);
        setConversations(convs);
      } catch {
        toast.error("Erro ao carregar o painel.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <StatsCards data={data} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OccupancyChart
            data={data?.occupancyTrend ?? []}
            loading={loading}
          />
        </div>
        <div>
          <RecentConversations
            conversations={conversations}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingList
          title="Check-ins próximos"
          icon={<LogIn size={18} className="text-green-600" />}
          loading={loading}
          items={(data?.upcomingCheckIns ?? []).map((c) => ({
            id: c.id,
            guestName: c.guestName,
            roomNumber: c.roomNumber,
            date: c.checkIn,
          }))}
          emptyLabel="Nenhum check-in agendado."
        />
        <UpcomingList
          title="Check-outs próximos"
          icon={<LogOut size={18} className="text-gold-600" />}
          loading={loading}
          items={(data?.upcomingCheckOuts ?? []).map((c) => ({
            id: c.id,
            guestName: c.guestName,
            roomNumber: c.roomNumber,
            date: c.checkOut,
          }))}
          emptyLabel="Nenhum check-out agendado."
        />
      </div>
    </div>
  );
}

interface UpcomingItem {
  id: string;
  guestName: string;
  roomNumber: string;
  date: string;
}

function UpcomingList({
  title,
  icon,
  items,
  loading,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: UpcomingItem[];
  loading: boolean;
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        {icon}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">{emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {item.guestName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Quarto {item.roomNumber}
                  </p>
                </div>
                <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {formatDate(item.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
