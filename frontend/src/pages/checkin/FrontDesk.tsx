import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  DoorOpen,
  DoorClosed,
  Users,
  Clock,
  CreditCard,
  CheckCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { reservationsApi } from '../../api/reservations';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/format';
import { formatDateTime } from '../../utils/date';

interface ArrivalItem {
  id: string;
  guestName: string;
  room: string;
  confirmationNumber: string;
  expectedTime: string;
  status: 'confirmed' | 'pending' | 'checked_in';
  nights: number;
  totalAmount: number;
  guests: number;
}

interface DepartureItem {
  id: string;
  guestName: string;
  room: string;
  confirmationNumber: string;
  expectedTime: string;
  status: 'checked_in' | 'checked_out';
  nights: number;
  totalAmount: number;
  paidAmount: number;
}

const mockArrivals: ArrivalItem[] = [
  { id: 'a1', guestName: 'Carlos Oliveira', room: '201', confirmationNumber: 'RES-2024-1201', expectedTime: new Date().toISOString(), status: 'confirmed', nights: 3, totalAmount: 1200, guests: 2 },
  { id: 'a2', guestName: 'Maria Santos', room: '315', confirmationNumber: 'RES-2024-1202', expectedTime: new Date().toISOString(), status: 'confirmed', nights: 2, totalAmount: 740, guests: 1 },
  { id: 'a3', guestName: 'João Ferreira', room: '108', confirmationNumber: 'RES-2024-1203', expectedTime: new Date().toISOString(), status: 'checked_in', nights: 1, totalAmount: 320, guests: 2 },
  { id: 'a4', guestName: 'Ana Pereira', room: '402', confirmationNumber: 'RES-2024-1204', expectedTime: new Date().toISOString(), status: 'pending', nights: 4, totalAmount: 1800, guests: 3 },
  { id: 'a5', guestName: 'Pedro Lima', room: '220', confirmationNumber: 'RES-2024-1205', expectedTime: new Date().toISOString(), status: 'confirmed', nights: 2, totalAmount: 580, guests: 2 },
];

const mockDepartures: DepartureItem[] = [
  { id: 'd1', guestName: 'Lucia Rodrigues', room: '110', confirmationNumber: 'RES-2024-1150', expectedTime: new Date().toISOString(), status: 'checked_in', nights: 3, totalAmount: 900, paidAmount: 900 },
  { id: 'd2', guestName: 'Roberto Alves', room: '305', confirmationNumber: 'RES-2024-1148', expectedTime: new Date().toISOString(), status: 'checked_in', nights: 5, totalAmount: 2500, paidAmount: 1500 },
  { id: 'd3', guestName: 'Fernanda Costa', room: '218', confirmationNumber: 'RES-2024-1140', expectedTime: new Date().toISOString(), status: 'checked_out', nights: 2, totalAmount: 640, paidAmount: 640 },
];

const paymentMethodOptions = [
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'bank_transfer', label: 'Transferência' },
];

const statusBadgeMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'gray' }> = {
  confirmed: { label: 'Confirmado', variant: 'info' },
  pending: { label: 'Pendente', variant: 'warning' },
  checked_in: { label: 'Check-in Feito', variant: 'success' },
  checked_out: { label: 'Check-out Feito', variant: 'gray' },
};

export const FrontDesk: React.FC = () => {
  const [checkInModal, setCheckInModal] = useState<ArrivalItem | null>(null);
  const [checkOutModal, setCheckOutModal] = useState<DepartureItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [checkInArrivals, setCheckInArrivals] = useState(mockArrivals);
  const [checkInDepartures, setCheckInDepartures] = useState(mockDepartures);

  const { data: arrivalsData, isLoading: arrivalsLoading, refetch } = useQuery({
    queryKey: ['today-arrivals'],
    queryFn: reservationsApi.getTodayArrivals,
    retry: false,
  });

  const { data: departuresData } = useQuery({
    queryKey: ['today-departures'],
    queryFn: reservationsApi.getTodayDepartures,
    retry: false,
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.checkIn(id, { paymentMethod }),
    onSuccess: () => {
      if (checkInModal) {
        setCheckInArrivals((prev) =>
          prev.map((a) => (a.id === checkInModal.id ? { ...a, status: 'checked_in' as const } : a))
        );
      }
      setCheckInModal(null);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.checkOut(id, { paymentMethod }),
    onSuccess: () => {
      if (checkOutModal) {
        setCheckInDepartures((prev) =>
          prev.map((d) => (d.id === checkOutModal.id ? { ...d, status: 'checked_out' as const } : d))
        );
      }
      setCheckOutModal(null);
    },
  });

  const arrivals = (arrivalsData && arrivalsData.length > 0)
    ? arrivalsData.map((r) => ({
        id: r.id,
        guestName: `${r.guest?.firstName ?? ''} ${r.guest?.lastName ?? ''}`,
        room: r.room?.number ?? '-',
        confirmationNumber: r.confirmationNumber,
        expectedTime: r.checkInDate,
        status: r.status as 'confirmed' | 'pending' | 'checked_in',
        nights: r.nights,
        totalAmount: r.totalAmount,
        guests: r.adults + r.children,
      }))
    : checkInArrivals;

  const departures = (departuresData && departuresData.length > 0)
    ? departuresData.map((r) => ({
        id: r.id,
        guestName: `${r.guest?.firstName ?? ''} ${r.guest?.lastName ?? ''}`,
        room: r.room?.number ?? '-',
        confirmationNumber: r.confirmationNumber,
        expectedTime: r.checkOutDate,
        status: r.status as 'checked_in' | 'checked_out',
        nights: r.nights,
        totalAmount: r.totalAmount,
        paidAmount: r.paidAmount,
      }))
    : checkInDepartures;

  const todayArrivals = arrivals.length;
  const todayDepartures = departures.length;
  const doneCheckIns = arrivals.filter((a) => a.status === 'checked_in').length;
  const doneCheckOuts = departures.filter((d) => d.status === 'checked_out').length;
  const inHouseGuests = 42;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recepção</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DoorOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chegadas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{todayArrivals}</p>
              <p className="text-xs text-gray-400">{doneCheckIns} já realizados</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <DoorClosed className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Partidas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{todayDepartures}</p>
              <p className="text-xs text-gray-400">{doneCheckOuts} já realizados</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hóspedes no Hotel</p>
              <p className="text-2xl font-bold text-gray-900">{inHouseGuests}</p>
              <p className="text-xs text-gray-400">atualmente hospedados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-ins de Hoje */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-blue-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-blue-600" />
              Check-ins de Hoje
              <Badge variant="info" size="sm">{todayArrivals}</Badge>
            </h3>
          </div>
          {arrivalsLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {arrivals.map((item) => {
                const statusCfg = statusBadgeMap[item.status];
                return (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={item.guestName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{item.guestName}</p>
                          <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Quarto {item.room} • {item.confirmationNumber}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(item.expectedTime)}
                          </span>
                          <span>{item.nights} noite{item.nights !== 1 ? 's' : ''}</span>
                          <span>{item.guests} hóspede{item.guests !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    {item.status !== 'checked_in' && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          className="w-full"
                          icon={<DoorOpen className="h-4 w-4" />}
                          onClick={() => setCheckInModal(item)}
                        >
                          Fazer Check-in
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Check-outs de Hoje */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-indigo-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <DoorClosed className="h-5 w-5 text-indigo-600" />
              Check-outs de Hoje
              <Badge variant="info" size="sm">{todayDepartures}</Badge>
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {departures.map((item) => {
              const statusCfg = statusBadgeMap[item.status];
              const balance = item.totalAmount - item.paidAmount;
              return (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={item.guestName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{item.guestName}</p>
                        <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Quarto {item.room} • {item.confirmationNumber}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(item.expectedTime)}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <CreditCard className="h-3 w-3" />
                          {balance > 0 ? (
                            <span className="text-red-600">Saldo: {formatCurrency(balance)}</span>
                          ) : (
                            <span className="text-green-600">Quitado</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {item.status !== 'checked_out' && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        icon={<DoorClosed className="h-4 w-4" />}
                        onClick={() => setCheckOutModal(item)}
                      >
                        Fazer Check-out
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Check-in Modal */}
      <Modal
        isOpen={!!checkInModal}
        onClose={() => setCheckInModal(null)}
        title="Realizar Check-in"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setCheckInModal(null)}>Cancelar</Button>
            <Button
              loading={checkInMutation.isPending}
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={() => checkInMutation.mutate(checkInModal!.id)}
            >
              Confirmar Check-in
            </Button>
          </div>
        }
      >
        {checkInModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <Avatar name={checkInModal.guestName} size="lg" />
              <div>
                <p className="text-base font-bold text-gray-900">{checkInModal.guestName}</p>
                <p className="text-sm text-gray-500">Quarto {checkInModal.room}</p>
                <p className="text-xs text-blue-600 font-medium">{checkInModal.confirmationNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Estadias</p>
                <p className="font-semibold">{checkInModal.nights} noite{checkInModal.nights !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Hóspedes</p>
                <p className="font-semibold">{checkInModal.guests} pessoa{checkInModal.guests !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-gray-500 text-xs">Total da Reserva</p>
                <p className="font-bold text-lg text-green-600">{formatCurrency(checkInModal.totalAmount)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Documento de identidade conferido
              </div>
            </div>
            <Select
              label="Forma de Pagamento"
              options={paymentMethodOptions}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* Check-out Modal */}
      <Modal
        isOpen={!!checkOutModal}
        onClose={() => setCheckOutModal(null)}
        title="Realizar Check-out"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" icon={<FileText className="h-4 w-4" />}>Emitir Nota</Button>
            <Button variant="outline" onClick={() => setCheckOutModal(null)}>Cancelar</Button>
            <Button
              loading={checkOutMutation.isPending}
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={() => checkOutMutation.mutate(checkOutModal!.id)}
            >
              Confirmar Check-out
            </Button>
          </div>
        }
      >
        {checkOutModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
              <Avatar name={checkOutModal.guestName} size="lg" />
              <div>
                <p className="text-base font-bold text-gray-900">{checkOutModal.guestName}</p>
                <p className="text-sm text-gray-500">Quarto {checkOutModal.room}</p>
                <p className="text-xs text-indigo-600 font-medium">{checkOutModal.confirmationNumber}</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Conta Final</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hospedagem ({checkOutModal.nights} noite{checkOutModal.nights !== 1 ? 's' : ''})</span>
                  <span className="font-medium">{formatCurrency(checkOutModal.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Já pago</span>
                  <span className="text-green-600 font-medium">- {formatCurrency(checkOutModal.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-900">Saldo Restante</span>
                  <span className={`font-bold text-base ${checkOutModal.totalAmount - checkOutModal.paidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(checkOutModal.totalAmount - checkOutModal.paidAmount)}
                  </span>
                </div>
              </div>
            </div>
            {checkOutModal.totalAmount - checkOutModal.paidAmount > 0 && (
              <Select
                label="Forma de Pagamento do Saldo"
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
