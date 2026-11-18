const SAO_PAULO = 'America/Sao_Paulo';

export type AgendaWallTime = { date: string; time: string };

export const formatAgendaDateTime = (instant: string): AgendaWallTime => {
  const parsed = new Date(instant);
  if (Number.isNaN(parsed.getTime())) throw new RangeError('Data da agenda inválida.');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(parsed);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
};

export const toAgendaInstant = (date: string, time: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new RangeError('Data ou horário da agenda inválido.');
  }
  const [year, month, day] = date.split('-').map(Number);
  const validation = new Date(Date.UTC(year, month - 1, day));
  if (validation.getUTCFullYear() !== year || validation.getUTCMonth() !== month - 1 || validation.getUTCDate() !== day) {
    throw new RangeError('Data da agenda inválida.');
  }
  // Os horários de agenda são wall-clock de São Paulo; o Brasil permanece em UTC-03:00.
  return `${date}T${time}:00-03:00`;
};
