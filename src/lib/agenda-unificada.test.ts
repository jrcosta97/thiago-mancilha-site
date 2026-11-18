import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  buildCobrancas,
  cobrancasParaCobrar,
  dayOfWeekIso,
  expandAgenda,
  monthGridIso,
  normalizeHora,
  weekStartIso,
  type AgendamentoLike,
  type AlunoLike,
  type HorarioFixoLike,
} from './agenda-unificada';

const aluno = (over: Partial<AlunoLike> = {}): AlunoLike => ({
  id: 'a1',
  nome: 'Antônio',
  status: 'ATIVO',
  permuta: false,
  mensalidade: 900,
  dia_vencimento: 10,
  ultimo_pagamento_data: null,
  ...over,
});

const horario = (over: Partial<HorarioFixoLike> = {}): HorarioFixoLike => ({
  id: 'h1',
  aluno_id: 'a1',
  dias_semana: [2, 4, 6],
  hora: '07:00:00',
  duracao_min: 60,
  inicio: '2026-11-01',
  fim: null,
  ativo: true,
  ...over,
});

describe('datas', () => {
  it('soma dias atravessando mês e ano', () => {
    expect(addDaysIso('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('dia da semana e início da semana (domingo)', () => {
    expect(dayOfWeekIso('2026-11-18')).toBe(3);
    expect(weekStartIso('2026-11-18')).toBe('2026-11-15');
    expect(weekStartIso('2026-11-15')).toBe('2026-11-15');
  });
  it('grade do mês tem 6 semanas começando no domingo', () => {
    const grid = monthGridIso(2026, 11);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-11-01');
    expect(monthGridIso(2026, 12)[0]).toBe('2026-11-29');
  });
  it('normaliza horário do banco', () => {
    expect(normalizeHora('07:00:00')).toBe('07:00');
    expect(normalizeHora('18:30')).toBe('18:30');
  });
});

describe('expandAgenda', () => {
  it('gera as ocorrências do horário fixo só nos dias certos', () => {
    const out = expandAgenda({ horarios: [horario()], agendamentos: [], alunos: [aluno()], from: '2026-11-15', to: '2026-11-21' });
    expect(out.map((o) => o.date)).toEqual(['2026-11-17', '2026-11-19', '2026-11-21']);
    expect(out.every((o) => o.status === 'AGENDADO' && o.agendamentoId === null && o.time === '07:00')).toBe(true);
  });

  it('respeita início, fim e pausa', () => {
    const base = { agendamentos: [], alunos: [aluno()], from: '2026-11-15', to: '2026-11-21' };
    expect(expandAgenda({ ...base, horarios: [horario({ inicio: '2026-11-18' })] }).map((o) => o.date)).toEqual(['2026-11-19', '2026-11-21']);
    expect(expandAgenda({ ...base, horarios: [horario({ fim: '2026-11-19' })] }).map((o) => o.date)).toEqual(['2026-11-17', '2026-11-19']);
    expect(expandAgenda({ ...base, horarios: [horario({ ativo: false })] })).toHaveLength(0);
  });

  it('não gera aulas para aluno que não está ativo', () => {
    const out = expandAgenda({ horarios: [horario()], agendamentos: [], alunos: [aluno({ status: 'INATIVO' })], from: '2026-11-15', to: '2026-11-21' });
    expect(out).toHaveLength(0);
  });

  it('usa o registro do banco no lugar da ocorrência calculada, sem duplicar', () => {
    const registro: AgendamentoLike = {
      id: 'ag1', aluno_id: 'a1', data_hora: '2026-11-19T10:00:00.000Z', status: 'FALTOU', observacoes: null, horario_fixo_id: 'h1',
    };
    const out = expandAgenda({ horarios: [horario()], agendamentos: [registro], alunos: [aluno()], from: '2026-11-15', to: '2026-11-21' });
    expect(out).toHaveLength(3);
    const dia19 = out.find((o) => o.date === '2026-11-19');
    expect(dia19).toMatchObject({ status: 'FALTOU', agendamentoId: 'ag1', origem: 'FIXO', key: 'ag1' });
  });

  it('mantém avulsas e registros que não batem mais com a regra', () => {
    const avulsa: AgendamentoLike = { id: 'av', aluno_id: 'a1', data_hora: '2026-11-18T21:00:00.000Z', status: 'AGENDADO', observacoes: 'reposição' };
    const antigo: AgendamentoLike = { id: 'old', aluno_id: 'a1', data_hora: '2026-11-16T09:00:00.000Z', status: 'CONCLUIDO', observacoes: null, horario_fixo_id: 'h1' };
    const out = expandAgenda({ horarios: [horario()], agendamentos: [avulsa, antigo], alunos: [aluno()], from: '2026-11-15', to: '2026-11-21' });
    expect(out.find((o) => o.key === 'av')).toMatchObject({ origem: 'AVULSA', date: '2026-11-18', time: '18:00' });
    expect(out.find((o) => o.key === 'old')).toMatchObject({ origem: 'FIXO', date: '2026-11-16', status: 'CONCLUIDO' });
    expect(out).toHaveLength(5);
  });
});

describe('cobranças', () => {
  const today = '2026-11-18';

  it('classifica atrasado, vence hoje, a vencer e pago', () => {
    const alunos = [
      aluno({ id: 'a', nome: 'A', dia_vencimento: 10 }),
      aluno({ id: 'b', nome: 'B', dia_vencimento: 18 }),
      aluno({ id: 'c', nome: 'C', dia_vencimento: 25 }),
      aluno({ id: 'd', nome: 'D', dia_vencimento: 5, ultimo_pagamento_data: '2026-11-04' }),
    ];
    const out = buildCobrancas({ alunos, faturas: [], year: 2026, month: 11, today });
    const byId = Object.fromEntries(out.map((c) => [c.alunoId, c.status]));
    expect(byId).toEqual({ a: 'ATRASADO', b: 'VENCE_HOJE', c: 'PENDENTE', d: 'PAGO' });
    expect(out.find((c) => c.alunoId === 'a')?.podeDarBaixa).toBe(true);
  });

  it('fatura paga do mês conta como pago', () => {
    const out = buildCobrancas({ alunos: [aluno()], faturas: [{ aluno_id: 'a1', mes_referencia: '11/2026', status: 'PAID' }], year: 2026, month: 11, today });
    expect(out[0].status).toBe('PAGO');
  });

  it('permuta, inativo e sem mensalidade não geram cobrança', () => {
    const alunos = [aluno({ id: 'p', permuta: true, mensalidade: null, dia_vencimento: null }), aluno({ id: 'i', status: 'INATIVO' }), aluno({ id: 'z', mensalidade: 0 })];
    expect(buildCobrancas({ alunos, faturas: [], year: 2026, month: 11, today })).toHaveLength(0);
  });

  it('mês passado sem baixa não vira "atrasado"; mês futuro não permite baixa', () => {
    expect(buildCobrancas({ alunos: [aluno()], faturas: [], year: 2026, month: 10, today })[0].status).toBe('SEM_BAIXA');
    const dez = buildCobrancas({ alunos: [aluno()], faturas: [], year: 2026, month: 12, today })[0];
    expect(dez).toMatchObject({ status: 'PENDENTE', podeDarBaixa: false });
  });

  it('vencimento 31 cai no último dia de meses curtos', () => {
    expect(buildCobrancas({ alunos: [aluno({ dia_vencimento: 31 })], faturas: [], year: 2026, month: 11, today })[0].vencimento).toBe('2026-11-30');
  });

  it('"para cobrar" pega atrasados, hoje e a janela de 7 dias, inclusive no mês seguinte', () => {
    const alunos = [
      aluno({ id: 'a', dia_vencimento: 10 }),
      aluno({ id: 'b', dia_vencimento: 25 }),
      aluno({ id: 'c', dia_vencimento: 26 }),
      aluno({ id: 'd', dia_vencimento: 2 }),
    ];
    const ids = cobrancasParaCobrar({ alunos, faturas: [], today }).map((c) => `${c.alunoId}@${c.vencimento}`);
    expect(ids).toEqual(['d@2026-11-02', 'a@2026-11-10', 'b@2026-11-25']);
    const fimDoMes = cobrancasParaCobrar({ alunos, faturas: [], today: '2026-11-28' }).map((c) => `${c.alunoId}@${c.vencimento}`);
    expect(fimDoMes).toContain('d@2026-12-02');
  });
});
