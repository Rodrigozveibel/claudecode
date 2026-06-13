"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { analyticsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Clock,
  MessageCircle,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { PerformanceAnalytics } from "@/types";

const ROOM_COLORS = ["#1e3a5f", "#2a5378", "#356897", "#d4af37", "#e9d488"];

export default function AnalyticsPage() {
  const [data, setData] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    analyticsApi
      .performance()
      .then((d) => mounted && setData(d))
      .catch(() => toast.error("Erro ao carregar análises."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const { funnel } = data;
  const funnelMax = Math.max(
    funnel.inquiries,
    funnel.quotes,
    funnel.reservations,
    1
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de mensagens"
          value={data.totalMessages.toLocaleString("pt-BR")}
          icon={MessageCircle}
          iconBg="bg-primary-50 text-primary-700"
        />
        <KpiCard
          label="Taxa de resposta"
          value={`${Math.round(data.responseRate)}%`}
          icon={TrendingUp}
          iconBg="bg-green-50 text-green-600"
        />
        <KpiCard
          label="Tempo médio de resposta"
          value={formatSeconds(data.avgResponseTimeSec)}
          icon={Clock}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Taxa de conversão"
          value={`${Math.round(data.conversionRate)}%`}
          icon={TrendingUp}
          iconBg="bg-gold-50 text-gold-600"
        />
      </div>

      {/* Revenue trend */}
      <Card>
        <CardHeader>
          <CardTitle>Receita</CardTitle>
          <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenueTrend.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              Sem dados de receita.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.revenueTrend}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDate(v, "dd/MM")}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      `R$${(Number(v) / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Receita",
                    ]}
                    labelFormatter={(v) => formatDate(v as string, "dd/MM/yyyy")}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d4af37"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#1e3a5f", stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de conversão</CardTitle>
            <CardDescription>Da consulta à reserva</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelStep
              label="Consultas"
              value={funnel.inquiries}
              max={funnelMax}
              color="bg-primary-700"
            />
            <FunnelStep
              label="Orçamentos"
              value={funnel.quotes}
              max={funnelMax}
              color="bg-primary-500"
            />
            <FunnelStep
              label="Reservas"
              value={funnel.reservations}
              max={funnelMax}
              color="bg-gold-400"
            />
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
              <span className="text-gray-500">Conversão consultas → reservas</span>
              <span className="font-semibold text-primary-700">
                {funnel.inquiries > 0
                  ? Math.round(
                      (funnel.reservations / funnel.inquiries) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top room types */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de quarto mais reservados</CardTitle>
            <CardDescription>Volume por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topRoomTypes.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                Sem dados.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topRoomTypes}
                    layout="vertical"
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      strokeDasharray="3 3"
                      stroke="#eef2f7"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="type"
                      width={90}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, "Reservas"]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 13,
                      }}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                      {data.topRoomTypes.map((_, i) => (
                        <Cell
                          key={i}
                          fill={ROOM_COLORS[i % ROOM_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle>Satisfação dos hóspedes</CardTitle>
          <CardDescription>
            Baseado em {data.satisfaction.count} avaliações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-gold-500">
                {data.satisfaction.average.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">de 5.0</p>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < Math.round(data.satisfaction.average);
                return (
                  <Star
                    key={i}
                    size={28}
                    className={
                      filled ? "fill-gold-400 text-gold-400" : "text-gray-200"
                    }
                  />
                );
              })}
            </div>
            <div className="flex-1 text-sm text-gray-500">
              {data.satisfaction.count} hóspedes avaliaram o atendimento.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
}) {
  return (
    <Card className="p-5 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-primary-700">{value}</p>
    </Card>
  );
}

function FunnelStep({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">
          {value.toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatSeconds(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
