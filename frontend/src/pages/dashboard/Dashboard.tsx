import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  DoorOpen,
  DoorClosed,
  TrendingUp,
  Sparkles,
  Wrench,
  Plus,
  ArrowRight,
  BedDouble,
  BarChart3,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../../api/dashboard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Avatar } from '../../components/ui/Avatar';
import { OccupancyChart } from '../../components/shared/OccupancyChart';
import { ReservationStatusBadge } from '../../components/shared/ReservationStatusBadge';
import { RoomStatus, type Room } from '../../types';
import { formatCurrency } from '../../utils/format';
import { formatDate, formatDateRelative } from '../../utils/date';
import { cn } from '../../utils/cn';

// Mock data for demo purposes (when API is not available)
const mockStats = {
  todayArrivals: 8,
  todayDepartures: 5,
  currentOccupancy: 42,
  occupancyPercent: 75,
  totalRooms: 56,
  revenueToday: 8450.0,
  revenueThisMonth: 187320.5,
  pendingHousekeeping: 12,
  openMaintenanceRequests: 3,
  averageDailyRate: 285.5,
  revpar: 214.12,
  arrivals: [],
  departures: [],
  upcomingReservations: [],
  roomStatusCounts: {
    [RoomStatus.AVAILABLE]: 14,
    [RoomStatus.OCCUPIED]: 42,
    [RoomStatus.DIRTY]: 8,
    [RoomStatus.CLEANING]: 4,
    [RoomStatus.INSPECTED]: 2,
    [RoomStatus.MAINTENANCE]: 2,
    [RoomStatus.OUT_OF_ORDER]: 1,
    [RoomStatus.BLOCKED]: 1,
  },
};

const mockOccupancyTrend = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  occupancy: 55 + Math.random() * 35,
  revenue: 5000 + Math.random() * 5000,
}));

const mockRevenueByChannel = [
  { channel: 'Direto', revenue: 48000, bookings: 42 },
  { channel: 'Booking.com', revenue: 65000, bookings: 58 },
  { channel: 'Expedia', revenue: 32000, bookings: 28 },
  { channel: 'Airbnb', revenue: 21000, bookings: 19 },
  { channel: 'Site próprio', revenue: 15000, bookings: 13 },
  { channel: 'Telefone', revenue: 6320, bookings: 7 },
];

const mockArrivals = [
  { id: '1', guest: { firstName: 'Carlos', lastName: 'Oliveira' }, room: { number: '201' }, checkInDate: new Date().toISOString(), status: 'confirmed' },
  { id: '2', guest: { firstName: 'Maria', lastName: 'Santos' }, room: { number: '315' }, checkInDate: new Date().toISOString(), status: 'confirmed' },
  { id: '3', guest: { firstName: 'João', lastName: 'Ferreira' }, room: { number: '108' }, checkInDate: new Date().toISOString(), status: 'checked_in' },
  { id: '4', guest: { firstName: 'Ana', lastName: 'Pereira' }, room: { number: '402' }, checkInDate: new Date().toISOString(), status: 'pending' },
  { id: '5', guest: { firstName: 'Pedro', lastName: 'Lima' }, room: { number: '220' }, checkInDate: new Date().toISOString(), status: 'confirmed' },
];

const mockDepartures = [
  { id: '6', guest: { firstName: 'Lucia', lastName: 'Rodrigues' }, room: { number: '110' }, checkOutDate: new Date().toISOString(), status: 'checked_in' },
  { id: '7', guest: { firstName: 'Roberto', lastName: 'Alves' }, room: { number: '305' }, checkOutDate: new Date().toISOString(), status: 'checked_in' },
  { id: '8', guest: { firstName: 'Fernanda', lastName: 'Costa' }, room: { number: '218' }, checkOutDate: new Date().toISOString(), status: 'checked_out' },
];

const mockUpcoming = [
  { id: '9', confirmationNumber: 'RES-2024-1247', guest: { firstName: 'Marcos', lastName: 'Souza' }, room: { number: '310', roomType: { name: 'Suíte Deluxe' } }, checkInDate: new Date(Date.now() + 1 * 86400000).toISOString(), checkOutDate: new Date(Date.now() + 4 * 86400000).toISOString(), nights: 3, totalAmount: 1200, channel: 'booking_com', status: 'confirmed' },
  { id: '10', confirmationNumber: 'RES-2024-1248', guest: { firstName: 'Juliana', lastName: 'Martins' }, room: { number: '105', roomType: { name: 'Standard Duplo' } }, checkInDate: new Date(Date.now() + 2 * 86400000).toISOString(), checkOutDate: new Date(Date.now() + 5 * 86400000).toISOString(), nights: 3, totalAmount: 750, channel: 'direct', status: 'confirmed' },
  { id: '11', confirmationNumber: 'RES-2024-1249', guest: { firstName: 'Ricardo', lastName: 'Nunes' }, room: { number: '401', roomType: { name: 'Suíte Master' } }, checkInDate: new Date(Date.now() + 3 * 86400000).toISOString(), checkOutDate: new Date(Date.now() + 7 * 86400000).toISOString(), nights: 4, totalAmount: 2400, channel: 'expedia', status: 'pending' },
];

const roomStatusConfig: Record<RoomStatus, { label: string; color: string; bg: string }> = {
  [RoomStatus.AVAILABLE]: { label: 'Disponível', color: 'text-green-700', bg: 'bg-green-100 border-green-200 hover:bg-green-200' },
  [RoomStatus.OCCUPIED]: { label: 'Ocupado', color: 'text-red-700', bg: 'bg-red-100 border-red-200 hover:bg-red-200' },
  [RoomStatus.DIRTY]: { label: 'Sujo', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-200 hover:bg-yellow-200' },
  [RoomStatus.CLEANING]: { label: 'Limpeza', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200 hover:bg-blue-200' },
  [RoomStatus.INSPECTED]: { label: 'Inspecionado', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200 hover:bg-purple-200' },
  [RoomStatus.MAINTENANCE]: { label: 'Manutenção', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200 hover:bg-orange-200' },
  [RoomStatus.OUT_OF_ORDER]: { label: 'Fora de Uso', color: 'text-gray-700', bg: 'bg-gray-200 border-gray-300 hover:bg-gray-300' },
  [RoomStatus.BLOCKED]: { label: 'Bloqueado', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200 hover:bg-slate-200' },
};

// Mock room grid data
const mockRooms: { id: string; number: string; floor: number; status: RoomStatus; type: string }[] = [
  ...Array.from({ length: 12 }, (_, i) => ({ id: `1${i}`, number: `1${String(i + 1).padStart(2, '0')}`, floor: 1, status: [RoomStatus.OCCUPIED, RoomStatus.AVAILABLE, RoomStatus.DIRTY, RoomStatus.OCCUPIED, RoomStatus.AVAILABLE][i % 5], type: 'Standard' })),
  ...Array.from({ length: 12 }, (_, i) => ({ id: `2${i}`, number: `2${String(i + 1).padStart(2, '0')}`, floor: 2, status: [RoomStatus.AVAILABLE, RoomStatus.OCCUPIED, RoomStatus.CLEANING, RoomStatus.OCCUPIED, RoomStatus.AVAILABLE][i % 5], type: 'Deluxe' })),
  ...Array.from({ length: 10 }, (_, i) => ({ id: `3${i}`, number: `3${String(i + 1).padStart(2, '0')}`, floor: 3, status: [RoomStatus.OCCUPIED, RoomStatus.MAINTENANCE, RoomStatus.AVAILABLE, RoomStatus.OCCUPIED, RoomStatus.DIRTY][i % 5], type: 'Suíte' })),
  ...Array.from({ length: 8 }, (_, i) => ({ id: `4${i}`, number: `4${String(i + 1).padStart(2, '0')}`, floor: 4, status: [RoomStatus.AVAILABLE, RoomStatus.OCCUPIED, RoomStatus.INSPECTED, RoomStatus.BLOCKED][i % 4], type: 'Master' })),
];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; label: string };
  href?: string;
}> = ({ title, value, subtitle, icon, iconBg, trend, href }) => {
  const content = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        {trend && (
          <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
            <TrendingUp className="h-3 w-3" />
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            <span className="text-gray-400 font-normal">{trend.label}</span>
          </div>
        )}
      </div>
      <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl', iconBg)}>
        {icon}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        <Card hover padding="md">{content}</Card>
      </Link>
    );
  }
  return <Card padding="md">{content}</Card>;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    staleTime: 60000,
    retry: false,
  });

  const { data: occupancyTrend } = useQuery({
    queryKey: ['dashboard-occupancy-trend'],
    queryFn: () => dashboardApi.getOccupancyTrend(30),
    staleTime: 60000,
    retry: false,
  });

  const { data: revenueByChannel } = useQuery({
    queryKey: ['dashboard-revenue-by-channel'],
    queryFn: () => dashboardApi.getRevenueByChannel(7),
    staleTime: 60000,
    retry: false,
  });

  // Use mock data when API is not available
  const displayStats = stats ?? mockStats;
  const displayOccupancyTrend = occupancyTrend ?? mockOccupancyTrend;
  const displayRevenueByChannel = revenueByChannel ?? mockRevenueByChannel;
  const displayArrivals = (displayStats.arrivals?.length > 0 ? displayStats.arrivals : mockArrivals) as typeof mockArrivals;
  const displayDepartures = (displayStats.departures?.length > 0 ? displayStats.departures : mockDepartures) as typeof mockDepartures;
  const displayUpcoming = (displayStats.upcomingReservations?.length > 0 ? displayStats.upcomingReservations : mockUpcoming) as typeof mockUpcoming;

  const floors = [...new Set(mockRooms.map((r) => r.floor))].sort();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => refetch()}
          >
            Atualizar
          </Button>
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/reservations/new')}
          >
            Nova Reserva
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Carregando dados..." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Check-ins Hoje"
              value={displayStats.todayArrivals}
              subtitle={`${displayArrivals.filter(a => a.status === 'checked_in').length} já realizados`}
              icon={<DoorOpen className="h-6 w-6 text-blue-600" />}
              iconBg="bg-blue-100"
              href="/front-desk"
            />
            <StatCard
              title="Check-outs Hoje"
              value={displayStats.todayDepartures}
              subtitle={`${displayDepartures.filter(d => d.status === 'checked_out').length} já realizados`}
              icon={<DoorClosed className="h-6 w-6 text-indigo-600" />}
              iconBg="bg-indigo-100"
              href="/front-desk"
            />
            <StatCard
              title="Quartos Ocupados"
              value={`${displayStats.currentOccupancy}/${displayStats.totalRooms}`}
              subtitle={`${displayStats.occupancyPercent.toFixed(1)}% de ocupação`}
              icon={<BedDouble className="h-6 w-6 text-purple-600" />}
              iconBg="bg-purple-100"
            />
            <StatCard
              title="Receita Hoje"
              value={formatCurrency(displayStats.revenueToday)}
              subtitle={`Mês: ${formatCurrency(displayStats.revenueThisMonth)}`}
              icon={<TrendingUp className="h-6 w-6 text-green-600" />}
              iconBg="bg-green-100"
              trend={{ value: 12.5, label: 'vs. ontem' }}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="ADR"
              value={formatCurrency(displayStats.averageDailyRate)}
              subtitle="Diária média"
              icon={<BarChart3 className="h-6 w-6 text-orange-600" />}
              iconBg="bg-orange-100"
            />
            <StatCard
              title="RevPAR"
              value={formatCurrency(displayStats.revpar)}
              subtitle="Receita por quarto"
              icon={<TrendingUp className="h-6 w-6 text-teal-600" />}
              iconBg="bg-teal-100"
            />
            <StatCard
              title="Governança"
              value={displayStats.pendingHousekeeping}
              subtitle="Tarefas pendentes"
              icon={<Sparkles className="h-6 w-6 text-yellow-600" />}
              iconBg="bg-yellow-100"
              href="/housekeeping"
            />
            <StatCard
              title="Manutenção"
              value={displayStats.openMaintenanceRequests}
              subtitle="Chamados abertos"
              icon={<Wrench className="h-6 w-6 text-red-600" />}
              iconBg="bg-red-100"
              href="/maintenance"
            />
          </div>

          {/* Occupancy progress bar */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Ocupação Atual</h3>
              <span className="text-lg font-bold text-blue-600">{displayStats.occupancyPercent.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${displayStats.occupancyPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{displayStats.currentOccupancy} ocupados</span>
              <span>{displayStats.totalRooms - displayStats.currentOccupancy} disponíveis</span>
              <span>{displayStats.totalRooms} total</span>
            </div>
          </Card>
        </>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Arrivals */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Check-ins de Hoje</h3>
              <p className="text-xs text-gray-500">{displayStats.todayArrivals} chegadas previstas</p>
            </div>
            <Link to="/front-desk" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {displayArrivals.slice(0, 5).map((res, i) => (
              <div key={res.id ?? i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/reservations/${res.id}`)}>
                <Avatar name={`${res.guest?.firstName} ${res.guest?.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {res.guest?.firstName} {res.guest?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Quarto {res.room?.number}</p>
                </div>
                <div className="text-right">
                  <Badge variant={res.status === 'checked_in' ? 'success' : res.status === 'pending' ? 'warning' : 'info'} size="sm">
                    {res.status === 'checked_in' ? 'Feito' : res.status === 'pending' ? 'Pendente' : 'Confirmado'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<DoorOpen className="h-4 w-4" />}
              onClick={() => navigate('/front-desk')}
            >
              Fazer Check-in
            </Button>
          </div>
        </Card>

        {/* Today's Departures */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Check-outs de Hoje</h3>
              <p className="text-xs text-gray-500">{displayStats.todayDepartures} partidas previstas</p>
            </div>
            <Link to="/front-desk" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {displayDepartures.slice(0, 5).map((res, i) => (
              <div key={res.id ?? i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/reservations/${res.id}`)}>
                <Avatar name={`${res.guest?.firstName} ${res.guest?.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {res.guest?.firstName} {res.guest?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Quarto {res.room?.number}</p>
                </div>
                <div className="text-right">
                  <Badge variant={res.status === 'checked_out' ? 'gray' : 'success'} size="sm">
                    {res.status === 'checked_out' ? 'Feito' : 'Hospedado'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<DoorClosed className="h-4 w-4" />}
              onClick={() => navigate('/front-desk')}
            >
              Fazer Check-out
            </Button>
          </div>
        </Card>

        {/* Room Status Summary */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Status dos Quartos</h3>
              <p className="text-xs text-gray-500">{displayStats.totalRooms} quartos no total</p>
            </div>
            <Link to="/rooms/grid" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver grade <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-5 py-3 space-y-2">
            {Object.entries(displayStats.roomStatusCounts).map(([status, count]) => {
              const config = roomStatusConfig[status as RoomStatus];
              if (!config || count === 0) return null;
              const pct = (count / displayStats.totalRooms) * 100;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-24 flex-shrink-0">{config.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', {
                        'bg-green-500': status === RoomStatus.AVAILABLE,
                        'bg-red-500': status === RoomStatus.OCCUPIED,
                        'bg-yellow-500': status === RoomStatus.DIRTY,
                        'bg-blue-500': status === RoomStatus.CLEANING,
                        'bg-purple-500': status === RoomStatus.INSPECTED,
                        'bg-orange-500': status === RoomStatus.MAINTENANCE,
                        'bg-gray-400': status === RoomStatus.OUT_OF_ORDER,
                        'bg-slate-400': status === RoomStatus.BLOCKED,
                      })}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Room Grid - Visual Floor Plan */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Planta dos Quartos</h3>
            <p className="text-xs text-gray-500">Visão por andar</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(roomStatusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={cn('w-3 h-3 rounded border', config.bg)} />
                <span className="text-xs text-gray-500">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 space-y-4">
          {floors.map((floor) => (
            <div key={floor}>
              <p className="text-xs font-semibold text-gray-500 mb-2">{floor}° Andar</p>
              <div className="flex flex-wrap gap-2">
                {mockRooms
                  .filter((r) => r.floor === floor)
                  .map((room) => {
                    const config = roomStatusConfig[room.status];
                    return (
                      <div
                        key={room.id}
                        className={cn(
                          'flex flex-col items-center justify-center w-14 h-14 rounded-lg border text-center cursor-pointer transition-colors',
                          config.bg
                        )}
                        title={`Quarto ${room.number} - ${config.label}`}
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        <span className={cn('text-xs font-bold', config.color)}>{room.number}</span>
                        <span className={cn('text-xs mt-0.5', config.color)} style={{ fontSize: '9px' }}>{room.type}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Trend */}
        <Card padding="md">
          <Card.Header
            title="Tendência de Ocupação (30 dias)"
            subtitle="Porcentagem de ocupação diária"
          />
          <OccupancyChart data={displayOccupancyTrend} height={220} />
        </Card>

        {/* Revenue by Channel */}
        <Card padding="md">
          <Card.Header
            title="Receita por Canal"
            subtitle="Últimos 7 dias"
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={displayRevenueByChannel}
              margin={{ top: 5, right: 5, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="channel"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Upcoming Reservations */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Próximas Reservas</h3>
            <p className="text-xs text-gray-500">Próximos check-ins</p>
          </div>
          <Link to="/reservations" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Confirmação</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Hóspede</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Quarto</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Check-in</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Check-out</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Noites</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayUpcoming.map((res, i) => (
                <tr
                  key={res.id ?? i}
                  className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/reservations/${res.id}`)}
                >
                  <td className="px-5 py-3 text-sm font-medium text-blue-600">{res.confirmationNumber}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${res.guest?.firstName} ${res.guest?.lastName}`} size="xs" />
                      <span className="text-sm text-gray-900">{res.guest?.firstName} {res.guest?.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Quarto {res.room?.number}</p>
                      <p className="text-xs text-gray-500">{(res.room as Room & { roomType?: { name: string } })?.roomType?.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{formatDateRelative(res.checkInDate)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{formatDate(res.checkOutDate)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{res.nights}</td>
                  <td className="px-5 py-3">
                    <ReservationStatusBadge status={res.status as never} />
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(res.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nova Reserva', href: '/reservations/new', icon: <Calendar className="h-5 w-5" />, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
          { label: 'Check-in', href: '/front-desk', icon: <DoorOpen className="h-5 w-5" />, color: 'bg-green-600 hover:bg-green-700 text-white' },
          { label: 'Check-out', href: '/front-desk', icon: <DoorClosed className="h-5 w-5" />, color: 'bg-orange-600 hover:bg-orange-700 text-white' },
          { label: 'Novo Hóspede', href: '/guests/new', icon: <Users className="h-5 w-5" />, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-xl font-medium text-sm transition-colors shadow-sm',
              action.color
            )}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
};
