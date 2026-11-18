export type CurrentMonthFinancialStatus = 'PAGO' | 'PENDENTE' | 'ATRASADO';
export type StudentFinancialStatus = CurrentMonthFinancialStatus | 'PERMUTA' | 'NAO_CONFIGURADO' | 'NAO_APLICAVEL';

const assertMonth = (year: number, month: number) => {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Ano ou mês inválido.');
  }
};

const assertIsoDate = (value: string, label: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError(`${label} deve estar no formato AAAA-MM-DD.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new RangeError(`${label} deve conter uma data válida.`);
  }
};

export const getEffectiveDueDate = (year: number, month: number, dueDay: number): string => {
  assertMonth(year, month);
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) throw new RangeError('Dia de vencimento inválido.');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dueDay, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getCurrentMonthFinancialStatus = (
  paymentDate: string | null,
  effectiveDueDate: string,
  today: string,
): CurrentMonthFinancialStatus => {
  assertIsoDate(effectiveDueDate, 'Vencimento');
  assertIsoDate(today, 'Data atual');
  if (paymentDate) {
    assertIsoDate(paymentDate, 'Pagamento');
    if (paymentDate.slice(0, 7) === today.slice(0, 7)) return 'PAGO';
  }
  return today > effectiveDueDate ? 'ATRASADO' : 'PENDENTE';
};

export const getMonthReference = (year: number, month: number): string => {
  assertMonth(year, month);
  return `${String(month).padStart(2, '0')}/${year}`;
};

export const getStudentFinancialStatus = (
  aluno: { status: string; permuta: boolean; mensalidade: number | null; dia_vencimento: number | null; ultimo_pagamento_data: string | null },
  today: { year: number; month: number; isoDate: string },
): StudentFinancialStatus => {
  if (aluno.status !== 'ATIVO') return 'NAO_APLICAVEL';
  if (aluno.permuta) return 'PERMUTA';
  if (aluno.mensalidade == null || Number(aluno.mensalidade) <= 0 || !aluno.dia_vencimento) return 'NAO_CONFIGURADO';
  return getCurrentMonthFinancialStatus(aluno.ultimo_pagamento_data, getEffectiveDueDate(today.year, today.month, aluno.dia_vencimento), today.isoDate);
};
