import { format, parseISO, differenceInDays, isToday, isTomorrow, isYesterday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Hoje';
  if (isTomorrow(d)) return 'Amanhã';
  if (isYesterday(d)) return 'Ontem';
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function calculateNights(checkIn: string, checkOut: string): number {
  return differenceInDays(parseISO(checkOut), parseISO(checkIn));
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function addDaysToDate(date: string, days: number): string {
  return toISODate(addDays(parseISO(date), days));
}

export function getTodayISO(): string {
  return toISODate(new Date());
}

export function getDateRangeArray(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = parseISO(start);
  const endDate = parseISO(end);
  while (current <= endDate) {
    dates.push(toISODate(current));
    current = addDays(current, 1);
  }
  return dates;
}
