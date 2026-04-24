import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  CreditCard,
  MessageSquare,
  Edit2,
  User,
} from 'lucide-react';
import { guestsApi } from '../../api/guests';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Guest, Reservation, GuestMessage } from '../../types';
import { formatDate, formatDateTime } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { ReservationStatusBadge } from '../../components/shared/ReservationStatusBadge';

const mockGuest: Guest = {
  id: '1',
  firstName: 'Carlos',
  lastName: 'Oliveira',
  email: 'carlos.oliveira@email.com',
  phone: '(11) 99999-1234',
  nationality: 'Brasileiro',
  documentType: 'CPF',
  documentNumber: '123.456.789-00',
  dateOfBirth: '1985-03-15',
  address: 'Rua das Flores, 123',
  city: 'São Paulo',
  country: 'Brasil',
  vipLevel: 2,
  notes: 'Prefere quartos altos, alérgico a penas.',
  totalStays: 8,
  totalSpent: 12400,
  createdAt: '2022-01-10T10:00:00Z',
  updatedAt: new Date().toISOString(),
};

const mockReservations: Partial<Reservation>[] = [
  {
    id: 'r1',
    confirmationNumber: 'RES-2024-1100',
    checkInDate: '2024-03-10',
    checkOutDate: '2024-03-13',
    nights: 3,
    status: 'checked_out' as never,
    room: { number: '305', id: 'room1', floor: 3 } as never,
    totalAmount: 1200,
    channel: 'direct' as never,
  },
  {
    id: 'r2',
    confirmationNumber: 'RES-2024-0850',
    checkInDate: '2024-01-20',
    checkOutDate: '2024-01-22',
    nights: 2,
    status: 'checked_out' as never,
    room: { number: '210', id: 'room2', floor: 2 } as never,
    totalAmount: 740,
    channel: 'booking_com' as never,
  },
];

const mockMessages: GuestMessage[] = [
  {
    id: 'm1',
    guestId: '1',
    message: 'Olá! Gostaria de confirmar minha reserva.',
    channel: 'whatsapp',
    direction: 'inbound',
    read: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'm2',
    guestId: '1',
    message: 'Sua reserva RES-2024-1100 está confirmada! Check-in às 14h.',
    channel: 'whatsapp',
    direction: 'outbound',
    read: true,
    createdAt: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
  },
];

const channelLabels: Record<string, string> = {
  direct: 'Direto',
  booking_com: 'Booking.com',
  expedia: 'Expedia',
  airbnb: 'Airbnb',
};

const vipLabels: Record<number, string> = { 0: '-', 1: 'Bronze', 2: 'Prata', 3: 'Ouro' };

export const GuestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { data: guest, isLoading } = useQuery({
    queryKey: ['guest', id],
    queryFn: () => guestsApi.getGuestById(id!),
    enabled: !!id,
    retry: false,
  });

  const displayGuest = guest ?? mockGuest;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" message="Carregando hóspede..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/guests')}>
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {displayGuest.firstName} {displayGuest.lastName}
          </h1>
          <p className="text-gray-500 text-sm">Perfil do hóspede</p>
        </div>
        <Button variant="outline" icon={<Edit2 className="h-4 w-4" />} onClick={() => setIsEditing(!isEditing)}>
          Editar
        </Button>
      </div>

      {/* Profile Header */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar name={`${displayGuest.firstName} ${displayGuest.lastName}`} size="xl" />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">E-mail</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {displayGuest.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Telefone</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1 mt-0.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {displayGuest.phone ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Nível VIP</p>
              <div className="mt-0.5">
                {(displayGuest.vipLevel ?? 0) > 0 ? (
                  <Badge variant="warning" size="sm">
                    <Star className="h-3 w-3" />
                    {vipLabels[displayGuest.vipLevel ?? 0]}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">Sem VIP</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pontos de Fidelidade</p>
              <p className="text-sm font-bold text-blue-600 mt-0.5">{(displayGuest.totalStays * 150).toLocaleString('pt-BR')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 min-w-48">
            <div className="text-center bg-blue-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600">{displayGuest.totalStays}</p>
              <p className="text-xs text-gray-500 mt-0.5">Estadias</p>
            </div>
            <div className="text-center bg-green-50 rounded-xl p-3">
              <p className="text-lg font-bold text-green-600">{formatCurrency(displayGuest.totalSpent)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Gasto</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultTab="info">
        <Tabs.List>
          <Tabs.Tab id="info" icon={<User className="h-4 w-4" />}>Informações</Tabs.Tab>
          <Tabs.Tab id="history" icon={<Calendar className="h-4 w-4" />} badge={mockReservations.length}>
            Histórico de Reservas
          </Tabs.Tab>
          <Tabs.Tab id="messages" icon={<MessageSquare className="h-4 w-4" />} badge={mockMessages.length}>
            Mensagens
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="info">
          <Card padding="md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-gray-900">Informações Pessoais</h3>
              {!isEditing && (
                <Button variant="outline" size="sm" icon={<Edit2 className="h-4 w-4" />} onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Primeiro Nome', value: displayGuest.firstName },
                { label: 'Sobrenome', value: displayGuest.lastName },
                { label: 'E-mail', value: displayGuest.email },
                { label: 'Telefone', value: displayGuest.phone ?? '-' },
                { label: 'Nacionalidade', value: displayGuest.nationality ?? '-' },
                { label: 'Tipo de Documento', value: displayGuest.documentType ?? '-' },
                { label: 'Número do Documento', value: displayGuest.documentNumber ?? '-' },
                { label: 'Data de Nascimento', value: displayGuest.dateOfBirth ? formatDate(displayGuest.dateOfBirth) : '-' },
                { label: 'Endereço', value: displayGuest.address ?? '-' },
                { label: 'Cidade', value: displayGuest.city ?? '-' },
                { label: 'País', value: displayGuest.country ?? '-' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                  {isEditing ? (
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={value}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{value}</p>
                  )}
                </div>
              ))}
            </div>
            {displayGuest.notes && (
              <div className="mt-6">
                <p className="text-xs font-medium text-gray-500 mb-1">Observações</p>
                {isEditing ? (
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={displayGuest.notes}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">{displayGuest.notes}</p>
                )}
              </div>
            )}
            {isEditing && (
              <div className="mt-6 flex gap-3">
                <Button>Salvar Alterações</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </div>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel id="history">
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Confirmação</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Quarto</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Check-in</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Check-out</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Noites</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Canal</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mockReservations.map((res) => (
                    <tr
                      key={res.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/reservations/${res.id}`)}
                    >
                      <td className="px-5 py-3 text-sm font-semibold text-blue-600">{res.confirmationNumber}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">Quarto {res.room?.number}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{formatDate(res.checkInDate!)}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{formatDate(res.checkOutDate!)}</td>
                      <td className="px-5 py-3 text-sm text-center text-gray-700">{res.nights}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        <Badge variant="gray" size="sm">{channelLabels[res.channel as string] ?? res.channel}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <ReservationStatusBadge status={res.status as never} />
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(res.totalAmount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel id="messages">
          <Card padding="md">
            <div className="space-y-4">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.direction === 'outbound' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar
                    name={msg.direction === 'inbound' ? `${displayGuest.firstName} ${displayGuest.lastName}` : 'Hotel'}
                    size="sm"
                  />
                  <div
                    className={`max-w-[70%] rounded-xl px-4 py-3 ${
                      msg.direction === 'outbound'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <div className={`flex items-center gap-2 mt-1 text-xs ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                      <CreditCard className="h-3 w-3" />
                      <span>{msg.channel}</span>
                      <span>•</span>
                      <span>{formatDateTime(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escrever mensagem..."
              />
              <Button>Enviar</Button>
            </div>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};
