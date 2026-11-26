import { describe, expect, it } from 'vitest';
import { ageFromBirthDate, formatBirthDate } from './birth-date';

describe('data de nascimento', () => {
  it('calcula a idade considerando se o aniversário já aconteceu', () => {
    const today = new Date('2026-11-26T15:00:00Z');
    expect(ageFromBirthDate('1997-11-26', today)).toBe(29);
    expect(ageFromBirthDate('1997-11-27', today)).toBe(28);
  });

  it('rejeita datas inexistentes e futuras', () => {
    const today = new Date('2026-11-26T15:00:00Z');
    expect(ageFromBirthDate('2025-02-29', today)).toBeNull();
    expect(ageFromBirthDate('2030-01-01', today)).toBeNull();
    expect(formatBirthDate('1997-08-08')).toBe('08/08/1997');
  });
});
