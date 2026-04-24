import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { reservationsApi } from '../../api/reservations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { DatePicker } from '../../components/ui/DatePicker';
import { ReservationStatusBadge } from '../../components/shared/ReservationStatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ReservationStatus, ChannelType, type Reservation } from '../../types';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { getTodayISO } from '../../utils/date';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: ReservationStatus.PENDING, label: 'Pendente' },
  { value: ReservationStatus.CONFIRMED, label: 'Confirmada' },
  { value: ReservationStatus.CHECKED_IN, label: 'Check-in' },
  { value: ReservationStatus.CHECKED_OUT, label: 'Check-out' },
  { value: ReservationStatus.CANCELLED, label: 'Cancelada' },
  { value: ReservationStatus.NO_SHOW, label: 'No-show' },
];

const channelLabels: Record<string, string> = {
  [ChannelType.DIRECT]: 'Direto',
  [ChannelType.BOOKING_COM]: 'Booking.com',
  [ChannelType.EXPEDIA]: 'Expedia',
  [ChannelType.AIRBNB]: 'Airbnb',
  [ChannelType.HOTELS_COM]: 'Hotels.com',
  [ChannelType.OWN_WEBSITE]: 'Site próprio',
  [ChannelType.PHONE]: 'Telefone',
  [ChannelType.WALK_IN]: 'Walk-in',
};

const mockReservations: Reservation[] = Array.from({ length: 15 }, (_, i) => ({
  id: `res-${i}`,
  confirmationNumber: `RES-2024-${1200 + i}`,
  propertyId: 'p1',
  roomId: `r${i}`,
  guestId: `g${i}`,
  room: { id: `r${i}`, number: `${Math.floor(i / 4) + 1}${String((i % 10) + 1).padStart(2, '0')}`, floor: Math.floor(i / 4) + 1, status: 'occupied' as never, roomTypeId: 'rt1', roomType: { name: 'Standard', id: 'rt1', maxOccupancy: 2, baseRate: 280, amenities: [], images: [], bedType: 'Casal', description: '', propertyId: 'p1', createdAt: '', updatedAt: '' }, propertyId: 'p1', isSmokingAllowed: false, isAccessible: false, createdAt: '', updatedAt: '' },
  guest: { id: `g${i}`, firstName: ['Carlos', 'Maria', 'João', 'Ana', 'Pedro', 'Lucia', 'Roberto', 'Fernanda'][i % 8], lastName: ['Oliveira', 'Santos', 'Silva', 'Costa', 'Ferreira'][i % 5], email: `guest${i}@email.com`, totalStays: i + 1, totalSpent: (i + 1) * 500, createdAt: '', updatedAt: '' },
  checkInDate: new Date(Date.now() + (i - 5) * 86400000).toISOString(),
  checkOutDate: new Date(Date.now() + (i - 2) * 86400000).toISOString(),
  nights: 3,
  adults: 2,
  children: 0,
  status: Object.values(ReservationStatus)[i % Object.values(ReservationStatus).length] as ReservationStatus,
  channel: Object.values(ChannelType)[i % Object.values(ChannelType).length] as ChannelType,
  ratePerNight: 280 + (i * 20),
  totalAmount: (280 + i * 20) * 3,
  paidAmount: (280 + i * 20) * 3,
  balance: 0,
  paymentStatus: 'paid' as never,
  addons: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export const ReservationList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', page, search, statusFilter, checkInFrom, checkInTo],
    queryFn: () =>
      reservationsApi.getReservations({
        page,
        limit: 15,
        search,
        status: statusFilter as ReservationStatus | undefined,
        checkInFrom: checkInFrom || undefined,
        checkInTo: checkInTo || undefined,
      }),
    retry: false,
    placeholderData: {
      data: mockReservations,
      total: 48,
      page: 1,
      limit: 15,
      totalPages: 4,
    },
  });

  const columns = [
    {
      key: 'confirmationNumber',
      header: 'Confirmação',
      render: (v: unknown) => <span className="font-semibold text-blue-600 text-xs">{v as string}</span>,
    },
    {
      key: 'guest.firstName',
      header: 'Hóspede',
      render: (_: unknown, row: Reservation) => row.guest ? (
        <div className="flex items-center gap-2">
          <Avatar name={`${row.guest.firstName} ${row.guest.lastName}`} size="xs" />
          <span className="text-sm">{row.guest.firstName} {row.guest.lastName}</span>
        </div>
      ) : '-',
    },
    {
      key: 'room.number',
      header: 'Quarto',
      render: (_: unknown, row: Reservation) => row.room ? (
        <div>
          <p className="text-sm font-medium">{row.room.number}</p>
          <p className="text-xs text-gray-500">{row.room.roomType?.name}</p>
        </div>
      ) : '-',
    },
    {
      key: 'checkInDate',
      header: 'Check-in',
      render: (v: unknown) => formatDate(v as string),
    },
    {
      key: 'checkOutDate',
      header: 'Check-out',
      render: (v: unknown) => formatDate(v as string),
    },
    {
      key: 'nights',
      header: 'Noites',
      align: 'center' as const,
      render: (v: unknown) => <span className="font-medium">{v as number}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v: unknown) => <ReservationStatusBadge status={v as never} />,
    },
    {
      key: 'channel',
      header: 'Canal',
      render: (v: unknown) => <Badge variant="gray" size="sm">{channelLabels[v as string] ?? v as string}</Badge>,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right' as const,
      render: (v: unknown) => <span className="font-semibold">{formatCurrency(v as number)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (_: unknown, row: Reservation) => (
        <Button
          size="xs"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); navigate(`/reservations/${row.id}`); }}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 text-sm">Gestão de todas as reservas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
            Exportar
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/reservations/new')}>
            Nova Reserva
          </Button>
        </div>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por confirmação, hóspede..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            containerClassName="flex-1 min-w-48"
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            containerClassName="w-44"
          />
          <Button
            variant="outline"
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
            <DatePicker
              label="Check-in de"
              value={checkInFrom}
              onChange={setCheckInFrom}
              maxDate={checkInTo || getTodayISO()}
              containerClassName="w-44"
            />
            <DatePicker
              label="Check-in até"
              value={checkInTo}
              onChange={setCheckInTo}
              minDate={checkInFrom}
              containerClassName="w-44"
            />
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setCheckInFrom(''); setCheckInTo(''); setStatusFilter(''); setSearch(''); }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Table
        columns={columns as never}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={isLoading}
        onRowClick={(row) => navigate(`/reservations/${(row as unknown as Reservation).id}`)}
        emptyMessage="Nenhuma reserva encontrada"
      />

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={data.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
