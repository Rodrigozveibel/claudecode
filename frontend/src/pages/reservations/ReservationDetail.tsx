import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, DoorOpen, DoorClosed, XCircle, Receipt, User, BedDouble, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationsApi } from '../../api/reservations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ReservationStatusBadge } from '../../components/shared/ReservationStatusBadge';
import { formatDate, formatDateTime } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { ReservationStatus, ChannelType } from '../../types';
import type { Reservation } from '../../types';

const mockReservation: Reservation = {
  id: 'res-demo',
  confirmationNumber: 'RES-2024-1247',
  propertyId: 'prop-1',
  roomId: 'r201',
  roomTypeId: 'rt-deluxe',
  guestId: 'g1',
  checkIn: new Date(Date.now() + 86400000).toISOString(),
  checkOut: new Date(Date.now() + 4 * 86400000).toISOString(),
  adults: 2,
  children: 0,
  nightsCount: 3,
  status: ReservationStatus.CONFIRMED,
  source: ChannelType.BOOKING_COM,
  roomRate: 349.90,
  totalAmount: 1049.70,
  paidAmount: 0,
  specialRequests: 'Quarto em andar alto, longe do elevador. Aniversário de casamento.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  guest: { id: 'g1', firstName: 'Carlos', lastName: 'Oliveira', email: 'carlos@email.com', phone: '(11) 99999-1111', nationality: 'Brasileiro', blacklisted: false, totalStays: 5, totalSpent: 8500, loyaltyPoints: 850, createdAt: '', updatedAt: '' },
  room: { id: 'r201', number: '201', floor: 2, status: 'available' as never, roomTypeId: 'rt-deluxe', propertyId: 'p1', isActive: true, createdAt: '', updatedAt: '', roomType: { id: 'rt-deluxe', name: 'Deluxe', description: 'Vista cidade', maxOccupancy: 2, maxAdults: 2, maxChildren: 2, basePrice: 349.90, amenities: ['Wi-Fi', 'TV 55"', 'Ar-condicionado', 'Frigobar'], photos: [], isActive: true, propertyId: 'p1', createdAt: '', updatedAt: '' } },
  addons: [{ id: 'a1', name: 'Café da manhã', quantity: 2, unitPrice: 45, total: 90 }, { id: 'a2', name: 'Estacionamento', quantity: 3, unitPrice: 30, total: 90 }],
};

const channelLabels: Record<string, string> = {
  [ChannelType.BOOKING_COM]: 'Booking.com', [ChannelType.EXPEDIA]: 'Expedia',
  [ChannelType.AIRBNB]: 'Airbnb', [ChannelType.DIRECT]: 'Direto',
  [ChannelType.PHONE]: 'Telefone', [ChannelType.WALK_IN]: 'Walk-in',
  [ChannelType.OWN_WEBSITE]: 'Site próprio',
};

export const ReservationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => reservationsApi.getById(id!),
    enabled: !!id,
    retry: false,
  });

  const res = data ?? mockReservation;
  const balance = res.totalAmount - res.paidAmount;

  const checkInMutation = useMutation({
    mutationFn: () => reservationsApi.checkIn(id!),
    onSuccess: () => { toast.success('Check-in realizado!'); },
    onError: () => toast.error('Erro ao realizar check-in'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => reservationsApi.checkOut(id!),
    onSuccess: () => { toast.success('Check-out realizado!'); },
    onError: () => toast.error('Erro ao realizar check-out'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => reservationsApi.cancel(id!),
    onSuccess: () => { toast.success('Reserva cancelada.'); setCancelling(false); },
    onError: () => toast.error('Erro ao cancelar'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/reservations')} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{res.confirmationNumber}</h1>
            <p className="text-sm text-gray-500">Criado em {formatDateTime(res.createdAt)}</p>
          </div>
          <ReservationStatusBadge status={res.status} />
        </div>
        <div className="flex items-center gap-2">
          {res.status === ReservationStatus.CONFIRMED && (
            <>
              <Button variant="success" size="sm" icon={<DoorOpen className="h-4 w-4" />} loading={checkInMutation.isPending} onClick={() => checkInMutation.mutate()}>Check-in</Button>
              <Button variant="danger" size="sm" icon={<XCircle className="h-4 w-4" />} onClick={() => setCancelling(true)}>Cancelar</Button>
            </>
          )}
          {res.status === ReservationStatus.CHECKED_IN && (
            <Button variant="outline" size="sm" icon={<DoorClosed className="h-4 w-4" />} loading={checkOutMutation.isPending} onClick={() => checkOutMutation.mutate()}>Check-out</Button>
          )}
          {res.status === ReservationStatus.CHECKED_OUT && (
            <Button variant="outline" size="sm" icon={<Receipt className="h-4 w-4" />} onClick={() => navigate(`/billing`)}>Ver Fatura</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Guest Info */}
          <Card padding="md">
            <Card.Header title="Hóspede" action={<Button variant="ghost" size="sm" icon={<User className="h-4 w-4" />} onClick={() => navigate(`/guests/${res.guestId}`)}>Ver perfil</Button>} />
            <div className="flex items-center gap-4">
              <Avatar name={`${res.guest?.firstName} ${res.guest?.lastName}`} size="lg" />
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900">{res.guest?.firstName} {res.guest?.lastName}</p>
                <p className="text-sm text-gray-500">{res.guest?.email}</p>
                <p className="text-sm text-gray-500">{res.guest?.phone}</p>
                {res.guest?.nationality && <Badge variant="gray" size="sm" className="mt-1">{res.guest.nationality}</Badge>}
              </div>
              <div className="text-right text-sm text-gray-500">
                <p className="font-semibold text-gray-900">{res.guest?.totalStays} estadias</p>
                <p>{formatCurrency(res.guest?.totalSpent ?? 0)} gastos</p>
                <p>{res.guest?.loyaltyPoints ?? 0} pontos</p>
              </div>
            </div>
          </Card>

          {/* Room Info */}
          <Card padding="md">
            <Card.Header title="Quarto" action={<Button variant="ghost" size="sm" icon={<BedDouble className="h-4 w-4" />} onClick={() => navigate(`/rooms/${res.roomId}`)}>Ver quarto</Button>} />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Número:</span> <span className="font-semibold">Quarto {res.room?.number}</span></div>
              <div><span className="text-gray-500">Andar:</span> <span className="font-semibold">{res.room?.floor}°</span></div>
              <div><span className="text-gray-500">Tipo:</span> <span className="font-semibold">{res.room?.roomType?.name}</span></div>
              <div><span className="text-gray-500">Canal:</span> <span className="font-semibold">{channelLabels[res.source] ?? res.source}</span></div>
            </div>
            {res.room?.roomType?.amenities && res.room.roomType.amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {res.room.roomType.amenities.map(a => <Badge key={a} variant="gray" size="sm">{a}</Badge>)}
              </div>
            )}
          </Card>

          {/* Dates */}
          <Card padding="md">
            <Card.Header title="Período da Estadia" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium">Check-in</p>
                <p className="text-lg font-bold text-blue-900">{formatDate(res.checkIn)}</p>
                <p className="text-xs text-blue-600">A partir das 14h</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Duração</p>
                <p className="text-2xl font-bold text-gray-900">{res.nightsCount}</p>
                <p className="text-xs text-gray-600">{res.nightsCount === 1 ? 'noite' : 'noites'}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-orange-600 font-medium">Check-out</p>
                <p className="text-lg font-bold text-orange-900">{formatDate(res.checkOut)}</p>
                <p className="text-xs text-orange-600">Até as 12h</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              <span className="font-medium">{res.adults} adulto{res.adults !== 1 ? 's' : ''}</span>
              {res.children > 0 && <span> + {res.children} criança{res.children !== 1 ? 's' : ''}</span>}
            </div>
          </Card>

          {/* Special Requests */}
          {res.specialRequests && (
            <Card padding="md">
              <Card.Header title="Pedidos Especiais" />
              <p className="text-sm text-gray-700 italic">"{res.specialRequests}"</p>
            </Card>
          )}

          {/* Addons */}
          {res.addons && res.addons.length > 0 && (
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Serviços Adicionais</h3></div>
              <table className="min-w-full">
                <thead><tr className="bg-gray-50"><th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Serviço</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Qtd</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Unit.</th><th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Total</th></tr></thead>
                <tbody>
                  {res.addons.map(a => (
                    <tr key={a.id} className="border-t border-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-900">{a.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 text-right">{a.quantity}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 text-right">{formatCurrency(a.unitPrice)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(a.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Financial Summary */}
        <div className="space-y-4">
          <Card padding="md">
            <Card.Header title="Resumo Financeiro" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Diária ({res.nightsCount}x)</span><span>{formatCurrency(res.roomRate)}/noite</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Subtotal quartos</span><span>{formatCurrency(res.roomRate * res.nightsCount)}</span></div>
              {res.addons && res.addons.length > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Adicionais</span><span>{formatCurrency(res.addons.reduce((s, a) => s + a.total, 0))}</span></div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(res.totalAmount)}</span></div>
              <div className="flex justify-between text-green-600"><span>Pago</span><span>{formatCurrency(res.paidAmount)}</span></div>
              <div className={`flex justify-between font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>{balance > 0 ? 'Saldo devedor' : 'Crédito'}</span><span>{formatCurrency(Math.abs(balance))}</span>
              </div>
            </div>
            {balance > 0 && (
              <Button className="w-full mt-3" size="sm" icon={<CreditCard className="h-4 w-4" />} onClick={() => toast.success('Redirecionando para pagamento...')}>Registrar Pagamento</Button>
            )}
          </Card>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancelar Reserva</h3>
            <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja cancelar a reserva <strong>{res.confirmationNumber}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCancelling(false)}>Voltar</Button>
              <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>Confirmar Cancelamento</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
