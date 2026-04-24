import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '../../api/rooms';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RoomStatus, type Room } from '../../types';
import { cn } from '../../utils/cn';
import { Grid3x3, LayoutList } from 'lucide-react';

const statusConfig: Record<RoomStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  [RoomStatus.AVAILABLE]: { label: 'Disponível', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
  [RoomStatus.OCCUPIED]: { label: 'Ocupado', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' },
  [RoomStatus.DIRTY]: { label: 'Sujo', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  [RoomStatus.CLEANING]: { label: 'Limpeza', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
  [RoomStatus.INSPECTED]: { label: 'Inspecionado', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  [RoomStatus.MAINTENANCE]: { label: 'Manutenção', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
  [RoomStatus.OUT_OF_ORDER]: { label: 'Fora de Uso', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-500' },
  [RoomStatus.BLOCKED]: { label: 'Bloqueado', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
};

// Mock data
const mockRooms: Room[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `r${i}`,
    number: `1${String(i + 1).padStart(2, '0')}`,
    floor: 1,
    propertyId: 'p1',
    roomTypeId: 'rt1',
    roomType: { id: 'rt1', name: 'Standard', maxOccupancy: 2, baseRate: 250, amenities: [], images: [], bedType: 'Casal', description: '', propertyId: 'p1', createdAt: '', updatedAt: '' },
    status: [RoomStatus.OCCUPIED, RoomStatus.AVAILABLE, RoomStatus.DIRTY, RoomStatus.OCCUPIED, RoomStatus.CLEANING, RoomStatus.AVAILABLE][i % 6] as RoomStatus,
    isSmokingAllowed: false,
    isAccessible: i % 4 === 0,
    currentGuestName: [RoomStatus.OCCUPIED][0] === [RoomStatus.OCCUPIED, RoomStatus.AVAILABLE, RoomStatus.DIRTY, RoomStatus.OCCUPIED, RoomStatus.CLEANING, RoomStatus.AVAILABLE][i % 6] ? `Hóspede ${i + 1}` : undefined,
    createdAt: '',
    updatedAt: '',
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `r${i + 12}`,
    number: `2${String(i + 1).padStart(2, '0')}`,
    floor: 2,
    propertyId: 'p1',
    roomTypeId: 'rt2',
    roomType: { id: 'rt2', name: 'Deluxe', maxOccupancy: 2, baseRate: 380, amenities: [], images: [], bedType: 'King', description: '', propertyId: 'p1', createdAt: '', updatedAt: '' },
    status: [RoomStatus.AVAILABLE, RoomStatus.OCCUPIED, RoomStatus.INSPECTED, RoomStatus.MAINTENANCE, RoomStatus.AVAILABLE][i % 5] as RoomStatus,
    isSmokingAllowed: false,
    isAccessible: false,
    createdAt: '',
    updatedAt: '',
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `r${i + 24}`,
    number: `3${String(i + 1).padStart(2, '0')}`,
    floor: 3,
    propertyId: 'p1',
    roomTypeId: 'rt3',
    roomType: { id: 'rt3', name: 'Suíte', maxOccupancy: 4, baseRate: 650, amenities: [], images: [], bedType: 'King', description: '', propertyId: 'p1', createdAt: '', updatedAt: '' },
    status: [RoomStatus.OCCUPIED, RoomStatus.AVAILABLE, RoomStatus.DIRTY, RoomStatus.OCCUPIED, RoomStatus.BLOCKED][i % 5] as RoomStatus,
    isSmokingAllowed: false,
    isAccessible: false,
    createdAt: '',
    updatedAt: '',
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `r${i + 34}`,
    number: `4${String(i + 1).padStart(2, '0')}`,
    floor: 4,
    propertyId: 'p1',
    roomTypeId: 'rt4',
    roomType: { id: 'rt4', name: 'Master Suite', maxOccupancy: 4, baseRate: 950, amenities: [], images: [], bedType: 'King', description: '', propertyId: 'p1', createdAt: '', updatedAt: '' },
    status: [RoomStatus.AVAILABLE, RoomStatus.OCCUPIED, RoomStatus.INSPECTED, RoomStatus.OUT_OF_ORDER][i % 4] as RoomStatus,
    isSmokingAllowed: false,
    isAccessible: false,
    createdAt: '',
    updatedAt: '',
  })),
];

export const RoomGrid: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | 'all'>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data } = useQuery({
    queryKey: ['rooms-grid'],
    queryFn: () => roomsApi.getRooms({ limit: 200 }),
    retry: false,
  });

  const rooms = data?.data ?? mockRooms;
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  const filteredRooms = selectedStatus === 'all'
    ? rooms
    : rooms.filter((r) => r.status === selectedStatus);

  const statusCounts = Object.values(RoomStatus).reduce((acc, s) => {
    acc[s] = rooms.filter((r) => r.status === s).length;
    return acc;
  }, {} as Record<RoomStatus, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grade de Quartos</h1>
          <p className="text-gray-500 text-sm">Visão geral do status dos quartos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<LayoutList className="h-4 w-4" />} onClick={() => navigate('/rooms')}>
            Lista
          </Button>
          <Button size="sm" icon={<Grid3x3 className="h-4 w-4" />}>
            Grade
          </Button>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            selectedStatus === 'all'
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          Todos ({rooms.length})
        </button>
        {Object.values(RoomStatus).map((s) => {
          const config = statusConfig[s];
          const count = statusCounts[s];
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                selectedStatus === s
                  ? `${config.bg} ${config.text} ${config.border}`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Room Grid by Floor */}
      <div className="space-y-6">
        {floors.map((floor) => {
          const floorRooms = filteredRooms.filter((r) => r.floor === floor);
          if (floorRooms.length === 0) return null;
          return (
            <Card key={floor} padding="none" className="overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">{floor}° Andar</h3>
              </div>
              <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                {floorRooms.map((room) => {
                  const config = statusConfig[room.status];
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={cn(
                        'relative flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-md',
                        config.bg,
                        config.border,
                        selectedRoom?.id === room.id && 'ring-2 ring-blue-500 ring-offset-1'
                      )}
                      style={{ minHeight: '72px' }}
                    >
                      <span className={cn('text-sm font-bold', config.text)}>{room.number}</span>
                      <span className={cn('text-center mt-0.5 leading-tight', config.text)} style={{ fontSize: '9px' }}>
                        {room.roomType?.name}
                      </span>
                      {room.isAccessible && (
                        <span className="absolute top-1 right-1 text-blue-500 text-xs">♿</span>
                      )}
                      <span className={cn('absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full', config.dot)} />
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Room Detail Panel */}
      {selectedRoom && (
        <Card padding="md" className="border-blue-200 bg-blue-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-bold text-gray-900">Quarto {selectedRoom.number}</h3>
                <Badge variant={
                  selectedRoom.status === RoomStatus.AVAILABLE ? 'success' :
                  selectedRoom.status === RoomStatus.OCCUPIED ? 'danger' :
                  selectedRoom.status === RoomStatus.DIRTY ? 'warning' : 'info'
                }>
                  {statusConfig[selectedRoom.status]?.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="text-sm font-medium">{selectedRoom.roomType?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Andar</p>
                  <p className="text-sm font-medium">{selectedRoom.floor}° Andar</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacidade</p>
                  <p className="text-sm font-medium">{selectedRoom.roomType?.maxOccupancy} hóspedes</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tarifa Base</p>
                  <p className="text-sm font-medium">R$ {selectedRoom.roomType?.baseRate?.toFixed(2)}</p>
                </div>
                {selectedRoom.currentGuestName && (
                  <div>
                    <p className="text-xs text-gray-500">Hóspede Atual</p>
                    <p className="text-sm font-medium">{selectedRoom.currentGuestName}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={() => navigate(`/rooms/${selectedRoom.id}`)}>
                Detalhes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedRoom(null)}>
                ✕
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
