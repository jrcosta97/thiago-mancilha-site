import { describe, expect, it } from 'vitest';
import { formatAgendaDateTime, toAgendaInstant } from './agenda-dates';

describe('datas e horários da agenda em São Paulo', () => {
  it.each([
    ['2025-04-15', '20:00'],
    ['2025-04-15', '23:30'],
    ['2025-01-01', '00:15'],
    ['2025-12-31', '23:45'],
  ])('preserva o horário local %s %s no ida e volta', (date, time) => {
    expect(formatAgendaDateTime(toAgendaInstant(date, time))).toEqual({ date, time });
  });
  it('formata UTC para a data/horário local correto de São Paulo', () => {
    expect(formatAgendaDateTime('2025-04-16T02:30:00.000Z')).toEqual({ date: '2025-04-15', time: '23:30' });
  });
  it('rejeita datas e horários impossíveis', () => {
    expect(() => toAgendaInstant('2025-02-30', '10:00')).toThrow();
    expect(() => toAgendaInstant('2025-04-15', '24:00')).toThrow();
  });
});
