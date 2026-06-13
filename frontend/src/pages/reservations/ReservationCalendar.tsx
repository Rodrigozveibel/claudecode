import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { addDays, format, startOfDay, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';
import { ReservationStatus } from '../../types';

const DAYS_SHOWN = 14;

const mockRooms = [
  { id: 'r101', number: '101', type: 'Standard' },
  { id: 'r102', number: '102', type: 'Standard' },
  { id: 'r201', number: '201', type: 'Deluxe' },
  { id: 'r202', number: '202', type: 'Deluxe' },
  { id: 'r301', number: '301', type: 'Suíte' },
  { id: 'r401', number: '401', type: 'Master' },
];

const today = startOfDay(new Date());
const mockReservations = [
  { id: 'res1', confirmationNumber: 'RES-001', guestName: 'Carlos Oliveira', roomId: 'r101', checkIn: addDays(today, -1), checkOut: addDays(today, 2), status: ReservationStatus.CHECKED_IN },
  { id: 'res2', confirmationNumber: 'RES-002', guestName: 'Maria Santos', roomId: 'r201', checkIn: addDays(today, 0), checkOut: addDays(today, 3), status: ReservationStatus.CONFIRMED },
  { id: 'res3', confirmationNumber: 'RES-003', guestName: 'João Ferreira', roomId: 'r301', checkIn: addDays(today, 2), checkOut: addDays(today, 5), status: ReservationStatus.CONFIRMED },
  { id: 'res4', confirmationNumber: 'RES-004', guestName: 'Ana Costa', roomId: 'r102', checkIn: addDays(today, 1), checkOut: addDays(today, 4), status: ReservationStatus.PENDING },
  { id: 'res5', confirmationNumber: 'RES-005', guestName: 'Pedro Lima', roomId: 'r202', checkIn: addDays(today, -2), checkOut: addDays(today, 1), status: ReservationStatus.CHECKED_IN },
  { id: 'res6', confirmationNumber: 'RES-006', guestName: 'Lucia Rocha', roomId: 'r401', checkIn: addDays(today, 5), checkOut: addDays(today, 9), status: ReservationStatus.CONFIRMED },
];

const statusColors: Record<string, string> = {
  [ReservationStatus.CONFIRMED]: 'bg-blue-500 text-white',
  [ReservationStatus.CHECKED_IN]: 'bg-green-500 text-white',
  [ReservationStatus.CHECKED_OUT]: 'bg-gray-400 text-white',
  [ReservationStatus.CANCELLED]: 'bg-red-400 text-white line-through',
  [ReservationStatus.PENDING]: 'bg-yellow-400 text-gray-900',
  [ReservationStatus.NO_SHOW]: 'bg-red-600 text-white',
};

export const ReservationCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(today);
  const [tooltip, setTooltip] = useState<{ res: (typeof mockReservations)[0]; x: number; y: number } | null>(null);

  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(startDate, i));

  const getReservationForCell = (roomId: string, day: Date) => {
    return mockReservations.find(r => r.roomId === roomId && r.checkIn <= day && r.checkOut > day);
  };

  const isReservationStart = (res: (typeof mockReservations)[0], day: Date) =>
    startOfDay(res.checkIn).getTime() === day.getTime() || day.getTime() === startDate.getTime();

  const getCellSpan = (res: (typeof mockReservations)[0], day: Date) => {
    const start = res.checkIn < startDate ? startDate : res.checkIn;
    const end = res.checkOut > addDays(startDate, DAYS_SHOWN) ? addDays(startDate, DAYS_SHOWN) : res.checkOut;
    return Math.max(1, differenceInDays(end, start));
  };

  const prev = () => setStartDate(d => addDays(d, -7));
  const next = () => setStartDate(d => addDays(d, 7));
  const goToday = () => setStartDate(today);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário de Reservas</h1>
          <p className="text-sm text-gray-500">Timeline de ocupação por quarto</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prev} icon={<ChevronLeft className="h-4 w-4" />} />
          <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={next} icon={<ChevronRight className="h-4 w-4" />} />
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/reservations/new')}>Nova Reserva</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {[
          { label: 'Confirmada', color: 'bg-blue-500' },
          { label: 'Check-in', color: 'bg-green-500' },
          { label: 'Pendente', color: 'bg-yellow-400' },
          { label: 'Cancelada', color: 'bg-red-400' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded', l.color)} />
            <span className="text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${200 + DAYS_SHOWN * 60}px` }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Quarto</th>
              {days.map(day => {
                const isToday = day.getTime() === today.getTime();
                return (
                  <th key={day.toISOString()} className={cn('border-b border-r border-gray-100 px-2 py-3 text-center text-xs font-medium min-w-[60px]', isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-500')}>
                    <div>{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className={cn('text-base font-bold', isToday ? 'text-blue-600' : 'text-gray-800')}>{format(day, 'd')}</div>
                    {day.getDate() === 1 && <div className="text-xs font-semibold text-gray-400">{format(day, 'MMM', { locale: ptBR })}</div>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {mockRooms.map(room => (
              <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="sticky left-0 z-10 bg-white border-r border-gray-200 px-4 py-2">
                  <div className="font-semibold text-gray-900 text-sm">{room.number}</div>
                  <div className="text-xs text-gray-500">{room.type}</div>
                </td>
                {days.map(day => {
                  const res = getReservationForCell(room.id, day);
                  if (res && isReservationStart(res, day)) {
                    const span = getCellSpan(res, day);
                    return (
                      <td key={day.toISOString()} colSpan={span} className="relative p-1 border-r border-gray-100">
                        <div
                          className={cn('rounded px-2 py-1 text-xs font-medium cursor-pointer truncate transition-opacity hover:opacity-80', statusColors[res.status] || 'bg-gray-200')}
                          onClick={() => navigate(`/reservations/${res.id}`)}
                          onMouseEnter={e => setTooltip({ res, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {res.guestName}
                        </div>
                      </td>
                    );
                  }
                  if (res) return null;
                  return (
                    <td key={day.toISOString()} className="border-r border-gray-100 p-1 cursor-pointer hover:bg-blue-50/50 transition-colors" onClick={() => navigate('/reservations/new')} />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {tooltip && (
        <div className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none" style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}>
          <div className="font-semibold">{tooltip.res.guestName}</div>
          <div>{tooltip.res.confirmationNumber}</div>
          <div>{format(tooltip.res.checkIn, 'dd/MM')} → {format(tooltip.res.checkOut, 'dd/MM/yyyy')}</div>
        </div>
      )}
    </div>
  );
};
