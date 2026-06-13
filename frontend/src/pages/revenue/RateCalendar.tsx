import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';
import { addDays, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../utils/cn';

const roomTypes = ['Standard', 'Deluxe', 'Suíte Executiva', 'Cobertura'];
const baseRates: Record<string, number> = { 'Standard': 199.90, 'Deluxe': 349.90, 'Suíte Executiva': 599.90, 'Cobertura': 999.90 };

const getRateForDay = (type: string, day: Date) => {
  const dow = day.getDay();
  const base = baseRates[type] ?? 200;
  if (dow === 0 || dow === 6) return base * 1.2;
  return base;
};

const getOccupancyColor = (occ: number) => {
  if (occ >= 90) return 'bg-red-100 text-red-700';
  if (occ >= 75) return 'bg-orange-100 text-orange-700';
  if (occ >= 50) return 'bg-green-100 text-green-700';
  return 'bg-blue-100 text-blue-700';
};

export const RateCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedType, setSelectedType] = useState('Deluxe');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentMonth(m => addDays(startOfMonth(m), -1));
  const nextMonth = () => setCurrentMonth(m => addDays(endOfMonth(m), 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/revenue')} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário de Tarifas</h1>
          <p className="text-sm text-gray-500">Visualize e ajuste tarifas por data</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {roomTypes.map(t => (
          <button key={t} onClick={() => setSelectedType(t)} className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', selectedType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{t}</button>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" icon={<ChevronLeft className="h-4 w-4" />} onClick={prevMonth} />
          <h3 className="font-semibold text-gray-900 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
          <Button variant="ghost" size="sm" icon={<ChevronRight className="h-4 w-4" />} onClick={nextMonth} />
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for day offset */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`empty-${i}`} />)}

            {days.map(day => {
              const rate = getRateForDay(selectedType, day);
              const occ = Math.floor(40 + Math.random() * 55);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <div key={day.toISOString()} className={cn('rounded-lg p-2 min-h-[80px] cursor-pointer transition-all border hover:shadow-md', isToday(day) ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-blue-200', !isSameMonth(day, currentMonth) ? 'opacity-40' : '')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-sm font-semibold', isToday(day) ? 'text-blue-600' : isWeekend ? 'text-orange-600' : 'text-gray-700')}>{format(day, 'd')}</span>
                    {isWeekend && <span className="text-xs text-orange-500">FDS</span>}
                  </div>
                  <div className="text-xs font-bold text-gray-900">{formatCurrency(rate)}</div>
                  <div className={cn('text-xs mt-1 px-1 rounded font-medium text-center', getOccupancyColor(occ))}>{occ}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-6 text-xs">
          <span className="font-semibold text-gray-600">Legenda:</span>
          {[['bg-blue-100 text-blue-700', '< 50%'], ['bg-green-100 text-green-700', '50-75%'], ['bg-orange-100 text-orange-700', '75-90%'], ['bg-red-100 text-red-700', '> 90%']].map(([cls, label]) => (
            <div key={label} className="flex items-center gap-1">
              <span className={cn('w-4 h-4 rounded text-center text-xs flex items-center justify-center', cls)}>■</span>
              <span className="text-gray-500">Ocupação {label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
