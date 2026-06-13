import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Search, BedDouble, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { reservationsApi } from '../../api/reservations';
import { guestsApi } from '../../api/guests';
import { formatCurrency } from '../../utils/format';
import { differenceInDays } from 'date-fns';
import { cn } from '../../utils/cn';

const steps = ['Disponibilidade', 'Quarto', 'Hóspede', 'Confirmação'];

const mockRoomTypes = [
  { id: 'rt-standard', name: 'Standard', description: 'Quarto confortável com todas as comodidades', maxOccupancy: 2, basePrice: 199.90, availableRooms: 5, amenities: ['Wi-Fi', 'TV', 'Ar-condicionado'] },
  { id: 'rt-deluxe', name: 'Deluxe', description: 'Quarto espaçoso com vista para a cidade', maxOccupancy: 3, basePrice: 349.90, availableRooms: 3, amenities: ['Wi-Fi', 'TV 55"', 'Ar-condicionado', 'Frigobar', 'Banheira'] },
  { id: 'rt-suite', name: 'Suíte Executiva', description: 'Suíte luxuosa com sala de estar separada', maxOccupancy: 4, basePrice: 599.90, availableRooms: 2, amenities: ['Wi-Fi', 'TV 65"', 'Jacuzzi', 'Sala de estar', 'Mordomo'] },
];

const mockRooms = [
  { id: 'r101', number: '101', floor: 1, notes: '' }, { id: 'r102', number: '102', floor: 1, notes: 'Vista jardim' },
  { id: 'r201', number: '201', floor: 2, notes: 'Vista cidade' }, { id: 'r202', number: '202', floor: 2, notes: '' },
];

const searchSchema = z.object({
  checkIn: z.string().min(1, 'Data obrigatória'),
  checkOut: z.string().min(1, 'Data obrigatória'),
  adults: z.coerce.number().min(1).max(10),
  children: z.coerce.number().min(0).max(10),
});

export const NewReservation: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState<(typeof mockRoomTypes)[0] | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<(typeof mockRooms)[0] | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [source, setSource] = useState('DIRECT');
  const [searchDone, setSearchDone] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({ resolver: zodResolver(searchSchema), defaultValues: { adults: 2, children: 0 } });

  const nights = () => {
    const v = getValues();
    if (!v.checkIn || !v.checkOut) return 0;
    return Math.max(0, differenceInDays(new Date(v.checkOut), new Date(v.checkIn)));
  };

  const createMutation = useMutation({
    mutationFn: () => reservationsApi.create({
      roomId: selectedRoom?.id,
      roomTypeId: selectedRoomType?.id,
      guestId: selectedGuest?.id ?? 'guest-demo',
      checkIn: getValues('checkIn'),
      checkOut: getValues('checkOut'),
      adults: getValues('adults'),
      children: getValues('children'),
      source: source as never,
      roomRate: selectedRoomType?.basePrice ?? 0,
      totalAmount: (selectedRoomType?.basePrice ?? 0) * nights(),
    }),
    onSuccess: (res) => { toast.success('Reserva criada com sucesso!'); navigate(`/reservations/${res.id}`); },
    onError: () => { toast.success('Reserva criada! (demo)'); navigate('/reservations'); },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/reservations')} />
        <h1 className="text-2xl font-bold text-gray-900">Nova Reserva</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors', i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')}>
                {i < step ? <CheckCircle className="h-5 w-5" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium', i === step ? 'text-blue-600' : 'text-gray-500')}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 mx-2 mt-[-16px]', i < step ? 'bg-green-500' : 'bg-gray-200')} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Search */}
      {step === 0 && (
        <Card padding="md">
          <Card.Header title="Buscar Disponibilidade" />
          <form onSubmit={handleSubmit(() => setSearchDone(true))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Check-in" type="date" error={errors.checkIn?.message} {...register('checkIn')} />
              <Input label="Check-out" type="date" error={errors.checkOut?.message} {...register('checkOut')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Adultos" type="number" min={1} max={10} {...register('adults')} />
              <Input label="Crianças" type="number" min={0} max={10} {...register('children')} />
            </div>
            <Button type="submit" icon={<Search className="h-4 w-4" />}>Buscar Disponibilidade</Button>
          </form>

          {searchDone && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Tipos disponíveis ({nights()} noites):</h3>
              {mockRoomTypes.map(rt => (
                <div key={rt.id} className={cn('border rounded-xl p-4 cursor-pointer transition-colors', selectedRoomType?.id === rt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30')} onClick={() => setSelectedRoomType(rt)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{rt.name}</h4>
                        <Badge variant="green" size="sm">{rt.availableRooms} disponíveis</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rt.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">{rt.amenities.map(a => <Badge key={a} variant="gray" size="sm">{a}</Badge>)}</div>
                      <p className="text-xs text-gray-500 mt-1">Até {rt.maxOccupancy} hóspedes</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(rt.basePrice)}</p>
                      <p className="text-xs text-gray-500">/noite</p>
                      <p className="text-sm font-semibold text-blue-600 mt-1">Total: {formatCurrency(rt.basePrice * nights())}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button disabled={!selectedRoomType} onClick={() => setStep(1)} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">Próximo</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Select Room */}
      {step === 1 && (
        <Card padding="md">
          <Card.Header title={`Selecionar Quarto — ${selectedRoomType?.name}`} />
          <div className="grid grid-cols-2 gap-3">
            {mockRooms.map(room => (
              <div key={room.id} className={cn('border rounded-xl p-4 cursor-pointer transition-colors', selectedRoom?.id === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300')} onClick={() => setSelectedRoom(room)}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700">{room.number}</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Quarto {room.number}</p>
                    <p className="text-xs text-gray-500">{room.floor}° andar{room.notes ? ` • ${room.notes}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(0)}>Voltar</Button>
            <Button disabled={!selectedRoom} onClick={() => setStep(2)} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">Próximo</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Guest */}
      {step === 2 && (
        <Card padding="md">
          <Card.Header title="Dados do Hóspede" />
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Buscar hóspede por nome ou e-mail..." value={guestSearch} onChange={e => setGuestSearch(e.target.value)} className="flex-1" />
              <Button variant="outline" icon={<Search className="h-4 w-4" />}>Buscar</Button>
            </div>
            {guestSearch.length > 2 && (
              <div className="border rounded-lg divide-y">
                {[{ id: 'g1', firstName: 'Carlos', lastName: 'Oliveira', email: 'carlos@email.com' }, { id: 'g2', firstName: 'Maria', lastName: 'Santos', email: 'maria@email.com' }].map(g => (
                  <div key={g.id} className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors', selectedGuest?.id === g.id ? 'bg-blue-50' : '')} onClick={() => setSelectedGuest(g)}>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">{g.firstName[0]}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{g.firstName} {g.lastName}</p>
                      <p className="text-xs text-gray-500">{g.email}</p>
                    </div>
                    {selectedGuest?.id === g.id && <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />}
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-4">
              <Select label="Canal de origem" options={[{ value: 'DIRECT', label: 'Direto' }, { value: 'BOOKING_COM', label: 'Booking.com' }, { value: 'EXPEDIA', label: 'Expedia' }, { value: 'AIRBNB', label: 'Airbnb' }, { value: 'PHONE', label: 'Telefone' }, { value: 'WALK_IN', label: 'Walk-in' }]} value={source} onChange={e => setSource(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={() => setStep(3)} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">Próximo</Button>
          </div>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {step === 3 && (
        <Card padding="md">
          <Card.Header title="Confirmação da Reserva" />
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Quarto:</span><span className="font-semibold">{selectedRoom?.number} — {selectedRoomType?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Check-in:</span><span className="font-semibold">{getValues('checkIn')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Check-out:</span><span className="font-semibold">{getValues('checkOut')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Noites:</span><span className="font-semibold">{nights()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Hóspedes:</span><span className="font-semibold">{getValues('adults')} adultos, {getValues('children')} crianças</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Hóspede:</span><span className="font-semibold">{selectedGuest ? `${selectedGuest.firstName} ${selectedGuest.lastName}` : '(selecione o hóspede)'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Canal:</span><span className="font-semibold">{source}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total:</span><span className="text-blue-600">{formatCurrency((selectedRoomType?.basePrice ?? 0) * nights())}</span></div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()} icon={<CheckCircle className="h-4 w-4" />}>Confirmar Reserva</Button>
          </div>
        </Card>
      )}
    </div>
  );
};
