import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const DEFAULT_TIMEZONE = 'America/Campo_Grande';

/**
 * Retorna o início do dia no timezone especificado (00:00:00)
 * Retorna um Date em UTC que corresponde à meia-noite local
 */
export function getStartOfDayInTimezone(date: Date, timeZone: string = DEFAULT_TIMEZONE): Date {
  const zonedDate = toZonedTime(date, timeZone);
  const startZoned = startOfDay(zonedDate);
  return fromZonedTime(startZoned, timeZone);
}

/**
 * Retorna o fim do dia no timezone especificado (23:59:59.999)
 * Retorna um Date em UTC que corresponde ao fim do dia local
 */
export function getEndOfDayInTimezone(date: Date, timeZone: string = DEFAULT_TIMEZONE): Date {
  const zonedDate = toZonedTime(date, timeZone);
  const endZoned = endOfDay(zonedDate);
  return fromZonedTime(endZoned, timeZone);
}

/**
 * Retorna o início do dia em UTC (00:00:00.000Z) preservando a data absoluta.
 */
export function getStartOfDayUTC(date: Date): Date {
  const utcDate = new Date(date);
  utcDate.setUTCHours(0, 0, 0, 0);
  return utcDate;
}

/**
 * Retorna o fim do dia em UTC (23:59:59.999Z) preservando a data absoluta.
 */
export function getEndOfDayUTC(date: Date): Date {
  const utcDate = new Date(date);
  utcDate.setUTCHours(23, 59, 59, 999);
  return utcDate;
}

/**
 * Formata uma data de forma explícita em UTC.
 */
export function formatInUTC(date: Date | string, formatString: string): string {
  return formatInTimeZone(date, 'UTC', formatString);
}

/**
 * Extrai a hora "HH:mm" de uma string ISO DateTime ou Date
 * @example extractTimeFromDateTime("2025-12-25T10:30:00") => "10:30"
 * @example extractTimeFromDateTime(new Date()) => "14:25"
 */
export function extractTimeFromDateTime(dateTime: string | Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(dateTime, timeZone, 'HH:mm');
}

/**
 * Extrai o dia da semana de uma string ISO DateTime ou Date
 * @returns Weekday enum value
 */
export function extractWeekdayFromDateTime(dateTime: string | Date, timeZone: string = DEFAULT_TIMEZONE): string {
  // Format returns the full day name in English.
  // E.g. 'EEEE' => 'Tuesday'. We need uppercase.
  const weekday = formatInTimeZone(dateTime, timeZone, 'EEEE');
  return weekday.toUpperCase();
}

/**
 * Converte string de hora "HH:mm" para minutos desde meia-noite
 * @example timeToMinutes("08:30") => 510
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde meia-noite para string "HH:mm"
 * @example minutesToTime(510) => "08:30"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Valida se uma string está no formato "HH:mm"
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

/**
 * Verifica se dois períodos de tempo se sobrepõem
 */
export function isTimeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && e1 > s2;
}

/**
 * Gera slots de horário baseado em intervalo
 * @example generateTimeSlots("08:00", "12:00", 30) => ["08:00", "08:30", "09:00", ...]
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

/**
 * Adiciona minutos a um horário
 * @example addMinutesToTime("08:30", 45) => "09:15"
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes);
}
