import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, BedDouble, Users, DollarSign } from 'lucide-react';
import { roomsApi } from '../../api/rooms';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/format';
import type { RoomType } from '../../types';

const mockRoomTypes: RoomType[] = [
  { id: 'rt1', name: 'Standard Casal', description: 'Quarto confortável com cama de casal', maxOccupancy: 2, baseRate: 250, amenities: ['TV', 'Wi-Fi', 'Ar-condicionado', 'Banheiro'], images: [], bedType: 'Casal', size: 22, propertyId: 'p1', createdAt: '', updatedAt: '' },
  { id: 'rt2', name: 'Standard Twin', description: 'Quarto com duas camas de solteiro', maxOccupancy: 2, baseRate: 250, amenities: ['TV', 'Wi-Fi', 'Ar-condicionado'], images: [], bedType: 'Twin', size: 22, propertyId: 'p1', createdAt: '', updatedAt: '' },
  { id: 'rt3', name: 'Deluxe', description: 'Quarto superior com vista para o jardim', maxOccupancy: 2, baseRate: 380, amenities: ['TV', 'Wi-Fi', 'Ar-condicionado', 'Banheiro', 'Varanda', 'Mini-bar'], images: [], bedType: 'King', size: 30, propertyId: 'p1', createdAt: '', updatedAt: '' },
  { id: 'rt4', name: 'Suíte Executiva', description: 'Suíte com sala de estar separada', maxOccupancy: 3, baseRate: 580, amenities: ['TV', 'Wi-Fi', 'Ar-condicionado', 'Banheiro privativo', 'Sala de estar', 'Mini-bar', 'Cofre'], images: [], bedType: 'King', size: 45, propertyId: 'p1', createdAt: '', updatedAt: '' },
  { id: 'rt5', name: 'Master Suite', description: 'Nossa suíte mais luxuosa com jacuzzi', maxOccupancy: 4, baseRate: 950, amenities: ['TV 55"', 'Wi-Fi', 'Ar-condicionado', 'Jacuzzi', 'Varanda', 'Mini-bar', 'Sala de jantar', 'Cofre'], images: [], bedType: 'King', size: 75, propertyId: 'p1', createdAt: '', updatedAt: '' },
];

export const RoomTypeList: React.FC = () => {
  const [selectedType, setSelectedType] = useState<RoomType | null>(null);

  const { data } = useQuery({
    queryKey: ['room-types'],
    queryFn: roomsApi.getRoomTypes,
    retry: false,
  });

  const roomTypes = data ?? mockRoomTypes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Quarto</h1>
          <p className="text-gray-500 text-sm">Categorias e tarifas dos quartos</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />}>Novo Tipo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roomTypes.map((rt) => (
          <Card key={rt.id} padding="md" hover onClick={() => setSelectedType(rt)} className="cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BedDouble className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{rt.name}</h3>
                  <p className="text-xs text-gray-500">{rt.bedType}</p>
                </div>
              </div>
              <Badge variant="info">{rt.size ? `${rt.size}m²` : 'N/A'}</Badge>
            </div>

            <p className="text-sm text-gray-600 mb-3">{rt.description}</p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Até {rt.maxOccupancy} hóspedes
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold text-green-600">{formatCurrency(rt.baseRate)}</span>
                <span className="text-xs text-gray-400">/noite</span>
              </div>
            </div>

            {rt.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {rt.amenities.slice(0, 4).map((a) => (
                  <Badge key={a} size="sm" variant="gray">{a}</Badge>
                ))}
                {rt.amenities.length > 4 && (
                  <Badge size="sm" variant="gray">+{rt.amenities.length - 4}</Badge>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {selectedType && (
        <Modal
          isOpen={!!selectedType}
          onClose={() => setSelectedType(null)}
          title={selectedType.name}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-gray-600">{selectedType.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Tarifa Base</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedType.baseRate)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Capacidade</p>
                <p className="text-xl font-bold">{selectedType.maxOccupancy} hóspedes</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Tipo de Cama</p>
                <p className="text-xl font-bold">{selectedType.bedType}</p>
              </div>
              {selectedType.size && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Tamanho</p>
                  <p className="text-xl font-bold">{selectedType.size}m²</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Comodidades</p>
              <div className="flex flex-wrap gap-2">
                {selectedType.amenities.map((a) => (
                  <Badge key={a} variant="info">{a}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setSelectedType(null)}>Fechar</Button>
            <Button>Editar Tipo</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
