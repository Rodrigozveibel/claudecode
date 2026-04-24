import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { roomsApi } from '../../api/rooms';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { RoomStatusBadge } from '../../components/shared/RoomStatusBadge';
import { Badge } from '../../components/ui/Badge';
import { RoomStatus, type Room } from '../../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: RoomStatus.AVAILABLE, label: 'Disponível' },
  { value: RoomStatus.OCCUPIED, label: 'Ocupado' },
  { value: RoomStatus.DIRTY, label: 'Sujo' },
  { value: RoomStatus.CLEANING, label: 'Em Limpeza' },
  { value: RoomStatus.MAINTENANCE, label: 'Manutenção' },
  { value: RoomStatus.OUT_OF_ORDER, label: 'Fora de Uso' },
];

const floorOptions = [
  { value: '', label: 'Todos os andares' },
  { value: '1', label: '1° Andar' },
  { value: '2', label: '2° Andar' },
  { value: '3', label: '3° Andar' },
  { value: '4', label: '4° Andar' },
];

export const RoomList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', page, search, statusFilter, floorFilter],
    queryFn: () =>
      roomsApi.getRooms({
        page,
        limit: 20,
        search,
        status: statusFilter as RoomStatus | undefined,
        floor: floorFilter ? Number(floorFilter) : undefined,
      }),
    retry: false,
    placeholderData: {
      data: Array.from({ length: 12 }, (_, i) => ({
        id: `room-${i}`,
        number: `${Math.floor(i / 4) + 1}${String((i % 10) + 1).padStart(2, '0')}`,
        floor: Math.floor(i / 4) + 1,
        status: Object.values(RoomStatus)[i % Object.values(RoomStatus).length] as RoomStatus,
        roomTypeId: 'rt1',
        roomType: { id: 'rt1', name: 'Standard', baseRate: 280, maxOccupancy: 2, bedType: 'Casal' } as never,
        isSmokingAllowed: false,
        isAccessible: i % 5 === 0,
        propertyId: 'p1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as Room[],
      total: 56,
      page: 1,
      limit: 20,
      totalPages: 3,
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      roomsApi.updateRoomStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Status do quarto atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const columns = [
    {
      key: 'number',
      header: 'Quarto',
      render: (_: unknown, row: Room) => (
        <div>
          <span className="font-semibold text-gray-900">{row.number}</span>
        </div>
      ),
    },
    {
      key: 'floor',
      header: 'Andar',
      render: (v: unknown) => `${v}° Andar`,
    },
    {
      key: 'roomType.name',
      header: 'Tipo',
      render: (_: unknown, row: Room) => row.roomType?.name ?? '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (v: unknown) => <RoomStatusBadge status={v as RoomStatus} />,
    },
    {
      key: 'isAccessible',
      header: 'Acessível',
      render: (v: unknown) =>
        v ? <Badge variant="info">Sim</Badge> : <Badge variant="gray">Não</Badge>,
    },
    {
      key: 'currentGuestName',
      header: 'Hóspede Atual',
      render: (v: unknown) => v ? <span className="text-sm text-gray-700">{v as string}</span> : '-',
    },
    {
      key: 'roomType.baseRate',
      header: 'Tarifa Base',
      render: (_: unknown, row: Room) =>
        row.roomType ? `R$ ${row.roomType.baseRate.toFixed(2)}` : '-',
      align: 'right' as const,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right' as const,
      render: (_: unknown, row: Room) => (
        <div className="flex justify-end gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${row.id}`); }}
          >
            Detalhes
          </Button>
          <select
            className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={row.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              updateStatusMutation.mutate({ id: row.id, status: e.target.value });
            }}
          >
            {Object.values(RoomStatus).map((s) => (
              <option key={s} value={s}>
                {statusOptions.find((opt) => opt.value === s)?.label ?? s}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quartos</h1>
          <p className="text-gray-500 text-sm">Gerenciamento de quartos do hotel</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/rooms/new')}>
          Novo Quarto
        </Button>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por número..."
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
          <Select
            options={floorOptions}
            value={floorFilter}
            onChange={(e) => { setFloorFilter(e.target.value); setPage(1); }}
            containerClassName="w-40"
          />
          <Button variant="outline" icon={<Filter className="h-4 w-4" />}>
            Filtros
          </Button>
        </div>
      </Card>

      <Table
        columns={columns as never}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={isLoading}
        onRowClick={(row) => navigate(`/rooms/${(row as unknown as Room).id}`)}
        emptyMessage="Nenhum quarto encontrado"
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
