import { formatAgendaDateTime, toAgendaInstant } from './agenda-dates';
import { getEffectiveDueDate, getMonthReference } from './financial-rules';

/**
 * Agenda unificada: aulas (horários fixos + avulsas) e cobranças no mesmo calendário.
 *
 * Horários fixos não geram linhas no banco. As ocorrências são calculadas aqui;
 * uma ocorrência só vira linha em `agendamentos` quando recebe um registro
 * (presença, falta, cancelamento), ligada por `horario_fixo_id` + `data_hora`.
 */

export type AulaStatus = 'AGENDADO' | 'CONCLUIDO' | 'FALTOU' | 'CANCELADO';

export interface HorarioFixoLike {
  id: string;
  aluno_id: string;
  dias_semana: number[];
  hora: string;
  duracao_min: number;
  inicio: string;
  fim: string | null;
  ativo: boolean;
}

export interface AlunoLike {
  id: string;
  nome: string;
  status: string;
  permuta: boolean;
  mensalidade: number | null;
  dia_vencimento: number | null;
  ultimo_pagamento_data: string | null;
}

export interface AgendamentoLike {
  id: string;
  aluno_id: string;
  data_hora: string;
  status: AulaStatus;
  observacoes: string | null;
  horario_fixo_id?: string | null;
}

export interface FaturaLike {
  aluno_id: string;
  mes_referencia: string | null;
  status: string;
}

export interface AulaOcorrencia {
  /** Chave estável para listas: id da linha, ou horário fixo + data. */
  key: string;
  date: string;
  time: string;
  instant: string;
  alunoId: string;
  alunoNome: string;
  origem: 'FIXO' | 'AVULSA';
  status: AulaStatus;
  horarioFixoId: string | null;
  /** null enquanto a ocorrência do horário fixo ainda não tem registro no banco. */
  agendamentoId: string | null;
  observacoes: string | null;
}

export type CobrancaStatus = 'PAGO' | 'PENDENTE' | 'VENCE_HOJE' | 'ATRASADO' | 'SEM_BAIXA';

export interface Cobranca {
  key: string;
  alunoId: string;
  alunoNome: string;
  valor: number;
  vencimento: string;
  mesReferencia: string;
  status: CobrancaStatus;
  /** A baixa pelo painel só existe para o mês corrente (função record_current_month_payment). */
  podeDarBaixa: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');

export const addDaysIso = (iso: string, days: number): string => {
  if (!ISO_DATE.test(iso)) throw new RangeError('Data inválida.');
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export const dayOfWeekIso = (iso: string): number => new Date(`${iso}T12:00:00Z`).getUTCDay();

export const diffDaysIso = (from: string, to: string): number =>
  Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86_400_000);

/** "07:00:00" ou "07:00" → "07:00" */
export const normalizeHora = (hora: string): string => {
  const match = /^(\d{2}):(\d{2})/.exec(hora);
  if (!match) throw new RangeError('Horário inválido.');
  return `${match[1]}:${match[2]}`;
};

/** Domingo da semana que contém a data. */
export const weekStartIso = (iso: string): string => addDaysIso(iso, -dayOfWeekIso(iso));

/** 42 dias (6 semanas) cobrindo o mês, começando no domingo. */
export const monthGridIso = (year: number, month: number): string[] => {
  const first = `${year}-${pad(month)}-01`;
  const start = weekStartIso(first);
  return Array.from({ length: 42 }, (_, i) => addDaysIso(start, i));
};

const occurrenceKey = (horarioId: string, instant: string) => `${horarioId}|${new Date(instant).getTime()}`;

/** Um horário fixo gera aula nesta data? */
export const horarioOcorreEm = (h: HorarioFixoLike, date: string): boolean =>
  h.ativo && date >= h.inicio && (h.fim == null || date <= h.fim) && h.dias_semana.includes(dayOfWeekIso(date));

export function expandAgenda(params: {
  horarios: HorarioFixoLike[];
  agendamentos: AgendamentoLike[];
  alunos: AlunoLike[];
  from: string;
  to: string;
}): AulaOcorrencia[] {
  const { horarios, agendamentos, alunos, from, to } = params;
  if (from > to) return [];
  const alunosById = new Map(alunos.map((a) => [a.id, a]));
  const registrados = new Map<string, AgendamentoLike>();
  for (const a of agendamentos) {
    if (a.horario_fixo_id) registrados.set(occurrenceKey(a.horario_fixo_id, a.data_hora), a);
  }

  const result: AulaOcorrencia[] = [];
  const usados = new Set<string>();

  for (let date = from; date <= to; date = addDaysIso(date, 1)) {
    for (const h of horarios) {
      if (!horarioOcorreEm(h, date)) continue;
      const aluno = alunosById.get(h.aluno_id);
      if (!aluno || aluno.status !== 'ATIVO') continue;
      const time = normalizeHora(h.hora);
      const instant = toAgendaInstant(date, time);
      const key = occurrenceKey(h.id, instant);
      const row = registrados.get(key);
      if (row) usados.add(row.id);
      result.push({
        key: row ? row.id : key,
        date,
        time,
        instant,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        origem: 'FIXO',
        status: row ? row.status : 'AGENDADO',
        horarioFixoId: h.id,
        agendamentoId: row ? row.id : null,
        observacoes: row ? row.observacoes : null,
      });
    }
  }

  // Avulsas, e registros de horário fixo que não batem mais com a regra (horário editado ou pausado).
  for (const a of agendamentos) {
    if (usados.has(a.id)) continue;
    const wall = formatAgendaDateTime(a.data_hora);
    if (wall.date < from || wall.date > to) continue;
    const aluno = alunosById.get(a.aluno_id);
    result.push({
      key: a.id,
      date: wall.date,
      time: wall.time,
      instant: a.data_hora,
      alunoId: a.aluno_id,
      alunoNome: aluno?.nome ?? 'Aluno removido',
      origem: a.horario_fixo_id ? 'FIXO' : 'AVULSA',
      status: a.status,
      horarioFixoId: a.horario_fixo_id ?? null,
      agendamentoId: a.id,
      observacoes: a.observacoes,
    });
  }

  return result.sort((x, y) => (x.date + x.time + x.alunoNome).localeCompare(y.date + y.time + y.alunoNome, 'pt-BR'));
}

/** Cobranças de um mês, uma por aluno ativo com mensalidade configurada (permuta não entra). */
export function buildCobrancas(params: {
  alunos: AlunoLike[];
  faturas: FaturaLike[];
  year: number;
  month: number;
  today: string;
}): Cobranca[] {
  const { alunos, faturas, year, month, today } = params;
  const ref = getMonthReference(year, month);
  const monthPrefix = `${year}-${pad(month)}`;
  const todayPrefix = today.slice(0, 7);
  const result: Cobranca[] = [];

  for (const a of alunos) {
    if (a.status !== 'ATIVO' || a.permuta) continue;
    const valor = a.mensalidade == null ? 0 : Number(a.mensalidade);
    if (!(valor > 0) || !a.dia_vencimento) continue;

    const vencimento = getEffectiveDueDate(year, month, a.dia_vencimento);
    const pagoPorFatura = faturas.some((f) => f.aluno_id === a.id && f.mes_referencia === ref && f.status === 'PAID');
    const pagoPorData = !!a.ultimo_pagamento_data && a.ultimo_pagamento_data.slice(0, 7) === monthPrefix;
    const pago = pagoPorFatura || pagoPorData;

    let status: CobrancaStatus;
    if (pago) status = 'PAGO';
    else if (monthPrefix < todayPrefix) status = 'SEM_BAIXA';
    else if (today > vencimento) status = 'ATRASADO';
    else if (today === vencimento) status = 'VENCE_HOJE';
    else status = 'PENDENTE';

    result.push({
      key: `${a.id}|${ref}`,
      alunoId: a.id,
      alunoNome: a.nome,
      valor,
      vencimento,
      mesReferencia: ref,
      status,
      podeDarBaixa: !pago && monthPrefix === todayPrefix,
    });
  }
  return result.sort((x, y) => (x.vencimento + x.alunoNome).localeCompare(y.vencimento + y.alunoNome, 'pt-BR'));
}

/**
 * "Para cobrar": o que está atrasado no mês corrente, vence hoje, ou vence nos próximos `janelaDias`
 * (inclusive no começo do mês seguinte).
 */
export function cobrancasParaCobrar(params: {
  alunos: AlunoLike[];
  faturas: FaturaLike[];
  today: string;
  janelaDias?: number;
}): Cobranca[] {
  const { alunos, faturas, today, janelaDias = 7 } = params;
  const [y, m] = today.split('-').map(Number);
  const next = m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
  const limite = addDaysIso(today, janelaDias);
  return [
    ...buildCobrancas({ alunos, faturas, year: y, month: m, today }),
    ...buildCobrancas({ alunos, faturas, ...next, today }),
  ].filter((c) => (c.status === 'ATRASADO' || c.status === 'VENCE_HOJE' || c.status === 'PENDENTE') && c.vencimento <= limite);
}

/** Registro a enviar ao banco quando uma ocorrência recebe presença/falta/cancelamento. */
export function registroDaOcorrencia(o: AulaOcorrencia, status: AulaStatus) {
  return {
    aluno_id: o.alunoId,
    data_hora: o.instant,
    status,
    observacoes: o.observacoes,
    horario_fixo_id: o.horarioFixoId,
  };
}
