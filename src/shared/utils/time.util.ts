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
