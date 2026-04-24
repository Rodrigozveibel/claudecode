import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, BedDouble, Users, Cigarette, Accessibility } from 'lucide-react';
import { roomsApi } from '../../api/rooms';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RoomStatusBadge } from '../../components/shared/RoomStatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/format';

export const RoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomsApi.getRoomById(id!),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" message="Carregando quarto..." />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Quarto não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/rooms')}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/rooms')}>
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Quarto {room.number}</h1>
          <p className="text-gray-500 text-sm">{room.roomType?.name} · {room.floor}° Andar</p>
        </div>
        <RoomStatusBadge status={room.status} />
        <Button icon={<Edit className="h-4 w-4" />} variant="outline">
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="md">
          <Card.Header title="Informações do Quarto" />
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Número</span>
              <span className="text-sm font-medium">{room.number}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Andar</span>
              <span className="text-sm font-medium">{room.floor}° Andar</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Tipo</span>
              <span className="text-sm font-medium">{room.roomType?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Tipo de Cama</span>
              <span className="text-sm font-medium">{room.roomType?.bedType}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Capacidade</span>
              <span className="text-sm font-medium">{room.roomType?.maxOccupancy} hóspedes</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500 flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" /> Tarifa Base</span>
              <span className="text-sm font-semibold text-blue-600">{formatCurrency(room.roomType?.baseRate ?? 0)}/noite</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500 flex items-center gap-1.5"><Cigarette className="h-3.5 w-3.5" /> Fumar permitido</span>
              <Badge variant={room.isSmokingAllowed ? 'warning' : 'success'}>
                {room.isSmokingAllowed ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500 flex items-center gap-1.5"><Accessibility className="h-3.5 w-3.5" /> Acessível</span>
              <Badge variant={room.isAccessible ? 'info' : 'gray'}>
                {room.isAccessible ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <Card.Header title="Status Atual" />
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Status do Quarto</p>
              <RoomStatusBadge status={room.status} />
            </div>
            {room.currentGuestName && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Hóspede Atual</p>
                <p className="text-sm font-medium">{room.currentGuestName}</p>
              </div>
            )}
            {room.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Observações</p>
                <p className="text-sm text-gray-700">{room.notes}</p>
              </div>
            )}
            {room.roomType?.amenities && room.roomType.amenities.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Comodidades</p>
                <div className="flex flex-wrap gap-2">
                  {room.roomType.amenities.map((amenity) => (
                    <Badge key={amenity} variant="info" size="sm">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
