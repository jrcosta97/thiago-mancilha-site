import { describe, expect, it } from 'vitest';
import { getCurrentMonthFinancialStatus, getEffectiveDueDate, getMonthReference, getStudentFinancialStatus } from './financial-rules';

describe('situação financeira por modalidade', () => {
  const hoje = { year: 2026, month: 11, isoDate: '2026-11-17' };
  const base = { status: 'ATIVO', permuta: false, mensalidade: 200, dia_vencimento: 15, ultimo_pagamento_data: null };
  it('identifica permuta sem cobrar ou exigir vencimento', () => {
    expect(getStudentFinancialStatus({ ...base, permuta: true, mensalidade: null, dia_vencimento: null }, hoje)).toBe('PERMUTA');
  });
  it('não confunde mensalidade zero com permuta', () => {
    expect(getStudentFinancialStatus({ ...base, mensalidade: 0 }, hoje)).toBe('NAO_CONFIGURADO');
  });
  it('mantém atraso para mensalidade normal vencida', () => {
    expect(getStudentFinancialStatus(base, hoje)).toBe('ATRASADO');
  });
  it('não cobra aluno inativo', () => {
    expect(getStudentFinancialStatus({ ...base, status: 'INATIVO' }, hoje)).toBe('NAO_APLICAVEL');
  });
});

describe('regras da mensalidade da competência atual', () => {
  it.each([
    [2024, 2, 29, '2024-02-29'],
    [2025, 2, 29, '2025-02-28'],
    [2025, 4, 30, '2025-04-30'],
    [2025, 4, 31, '2025-04-30'],
    [2025, 1, 31, '2025-01-31'],
  ])('limita vencimento ao fim do mês', (year, month, dueDay, expected) => {
    expect(getEffectiveDueDate(year, month, dueDay)).toBe(expected);
  });

  it('considera pago quando há pagamento na competência atual', () => {
    expect(getCurrentMonthFinancialStatus('2025-04-01', '2025-04-30', '2025-04-30')).toBe('PAGO');
  });
  it('mantém pendente até o vencimento, inclusive', () => {
    expect(getCurrentMonthFinancialStatus(null, '2025-04-30', '2025-04-30')).toBe('PENDENTE');
  });
  it('inicia atraso no dia seguinte ao vencimento efetivo', () => {
    expect(getCurrentMonthFinancialStatus(null, '2025-02-28', '2025-03-01')).toBe('ATRASADO');
  });
  it('gera competência no formato MM/AAAA', () => expect(getMonthReference(2025, 4)).toBe('04/2025'));
  it('rejeita datas inexistentes em vez de normalizá-las', () => {
    expect(() => getCurrentMonthFinancialStatus(null, '2025-02-30', '2025-03-01')).toThrow();
  });
});
