import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange: (date: string) => void;
  error?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = 'Selecionar data',
  minDate,
  maxDate,
  disabled,
  required,
  containerClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? new Date(value + 'T00:00:00') : new Date();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDayOfWeek = getDay(startOfMonth(currentMonth));
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const isDisabled = (day: Date) => {
    if (minDate && day < new Date(minDate + 'T00:00:00')) return true;
    if (maxDate && day > new Date(maxDate + 'T00:00:00')) return true;
    return false;
  };

  const handleSelect = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const displayValue = value
    ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy')
    : '';

  return (
    <div className={cn('space-y-1 relative', containerClassName)} ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center w-full rounded-lg border border-gray-300 bg-white text-left',
          'text-sm py-2.5 px-3 gap-2',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error && 'border-red-500',
          disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed'
        )}
      >
        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className={displayValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const disabled = isDisabled(day);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const inCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => handleSelect(day)}
                  disabled={disabled}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-lg text-xs font-medium transition-colors',
                    !inCurrentMonth && 'text-gray-300',
                    inCurrentMonth && !selected && !today && !disabled && 'text-gray-700 hover:bg-blue-50',
                    today && !selected && 'bg-blue-50 text-blue-600 font-semibold',
                    selected && 'bg-blue-600 text-white shadow-sm',
                    disabled && 'text-gray-300 cursor-not-allowed'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
