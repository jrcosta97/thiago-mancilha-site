import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Repeat, CalendarPlus, Pencil, AlertTriangle } from 'lucide-react';
import type { AgendamentosRow, AlunosRow, FaturasRow, HorariosFixosRow } from '@/lib/supabase';
import {
  addDaysIso,
  buildCobrancas,
  cobrancasParaCobrar,
  dayOfWeekIso,
  diffDaysIso,
  expandAgenda,
  monthGridIso,
  normalizeHora,
  weekStartIso,
  type AulaOcorrencia,
  type AulaStatus,
  type Cobranca,
  type CobrancaStatus,
} from '@/lib/agenda-unificada';
import { cn } from '@/lib/utils';
import { Slashes } from '@/components/brand/SectionLabel';

type View = 'MES' | 'SEMANA' | 'DIA' | 'LISTA';

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOW_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const COB_STYLE: Record<CobrancaStatus, { cls: string; label: string; text: string }> = {
  ATRASADO: { cls: 'bg-[#3B1C12] text-[#FFB592] border border-[#E8693A]', label: 'Atrasado', text: 'text-[#FFB592]' },
  VENCE_HOJE: { cls: 'bg-[#3A2C0C] text-[#FFD889] border border-[#E0A82E]', label: 'Vence hoje', text: 'text-[#FFD889]' },
  PENDENTE: { cls: 'bg-transparent text-[#E9C98A] border border-dashed border-[#9C7A33]', label: 'A vencer', text: 'text-[#E9C98A]' },
  PAGO: { cls: 'bg-transparent text-[#86DDB4] border border-[#2F6E52]', label: 'Pago', text: 'text-[#86DDB4]' },
  SEM_BAIXA: { cls: 'bg-transparent text-brand-subtle border border-white/15', label: 'Sem baixa', text: 'text-brand-subtle' },
};

type AulaVisual = 'AGENDADO' | 'CONCLUIDO' | 'FALTOU' | 'CANCELADO' | 'SEM_REGISTRO';
const AULA_STYLE: Record<AulaVisual, { cls: string; label: string }> = {
  AGENDADO: { cls: 'bg-[#14224F] text-[#DCE5FF] border border-[#2A4BD6]', label: 'Agendada' },
  CONCLUIDO: { cls: 'bg-[#121A30] text-[#A9B8DE] border border-[#22305A]', label: 'Veio' },
  FALTOU: { cls: 'bg-transparent text-brand-subtle border border-dashed border-[#4A5168] line-through', label: 'Faltou' },
  CANCELADO: { cls: 'bg-transparent text-brand-subtle border border-white/10 line-through', label: 'Cancelada' },
  SEM_REGISTRO: { cls: 'bg-[#121A30] text-[#A9B8DE] border border-dashed border-[#22305A]', label: 'Sem registro' },
};

const visualStatus = (o: AulaOcorrencia, today: string): AulaVisual =>
  o.status === 'AGENDADO' && o.date < today ? 'SEM_REGISTRO' : o.status;

const monthsBetween = (from: string, to: string): Array<{ year: number; month: number }> => {
  const out: Array<{ year: number; month: number }> = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7));
  const endKey = to.slice(0, 7);
  while (`${y}-${String(m).padStart(2, '0')}` <= endKey) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
};

export interface AgendaUnificadaProps {
  alunos: AlunosRow[];
  agendamentos: AgendamentosRow[];
  faturas: FaturasRow[];
  horarios: HorariosFixosRow[];
  horariosIndisponiveis: boolean;
  searchTerm: string;
  today: string;
  paymentSavingId: string | null;
  actionError: string | null;
  onMarcar: (ocorrencia: AulaOcorrencia, status: AulaStatus) => Promise<void>;
  onAbrirAula: (agendamentoId: string) => void;
  onAulaAvulsa: (date: string) => void;
  onNovoHorario: () => void;
  onEditarHorario: (horario: HorariosFixosRow) => void;
  onBaixa: (alunoId: string) => void;
  chargeLink: (alunoId: string) => string;
}

export default function AgendaUnificada(props: AgendaUnificadaProps) {
  const { alunos, agendamentos, faturas, horarios, today, searchTerm } = props;
  const [view, setView] = useState<View>('MES');
  const [sel, setSel] = useState<string>(today);
  const [cursor, setCursor] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }));
  const [showAulas, setShowAulas] = useState(true);
  const [showCob, setShowCob] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const term = norm(searchTerm.trim());
  const matches = (nome: string) => !term || norm(nome).includes(term);

  const monthGrid = useMemo(() => monthGridIso(cursor.year, cursor.month), [cursor]);
  const weekStart = weekStartIso(sel);

  const range = useMemo(() => {
    let from: string;
    let to: string;
    if (view === 'MES') { from = monthGrid[0]; to = monthGrid[41]; }
    else if (view === 'SEMANA') { from = weekStart; to = addDaysIso(weekStart, 6); }
    else if (view === 'DIA') { from = sel; to = sel; }
    else { from = today; to = addDaysIso(today, 13); }
    return { from: sel < from ? sel : from, to: sel > to ? sel : to };
  }, [view, monthGrid, weekStart, sel, today]);

  const aulas = useMemo(
    () => expandAgenda({ horarios, agendamentos, alunos, from: range.from, to: range.to }).filter((o) => matches(o.alunoNome)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [horarios, agendamentos, alunos, range.from, range.to, term]
  );

  const cobrancas = useMemo(
    () =>
      monthsBetween(range.from, range.to)
        .flatMap(({ year, month }) => buildCobrancas({ alunos, faturas, year, month, today }))
        .filter((c) => c.vencimento >= range.from && c.vencimento <= range.to && matches(c.alunoNome)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alunos, faturas, range.from, range.to, today, term]
  );

  const paraCobrar = useMemo(
    () => cobrancasParaCobrar({ alunos, faturas, today }).filter((c) => matches(c.alunoNome)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alunos, faturas, today, term]
  );

  const aulasByDate = useMemo(() => {
    const map = new Map<string, AulaOcorrencia[]>();
    if (!showAulas) return map;
    for (const o of aulas) map.set(o.date, [...(map.get(o.date) ?? []), o]);
    return map;
  }, [aulas, showAulas]);

  const cobByDate = useMemo(() => {
    const map = new Map<string, Cobranca[]>();
    if (!showCob) return map;
    for (const c of cobrancas) map.set(c.vencimento, [...(map.get(c.vencimento) ?? []), c]);
    return map;
  }, [cobrancas, showCob]);

  const aulasDoSel = aulas.filter((o) => o.date === sel);
  const alunosById = useMemo(() => new Map(alunos.map((a) => [a.id, a])), [alunos]);
  const horariosAtivos = horarios.filter((h) => h.ativo).sort((a, b) => a.hora.localeCompare(b.hora));

  const recebidoMes = useMemo(() => {
    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(5, 7));
    const all = buildCobrancas({ alunos, faturas, year: y, month: m, today });
    return {
      recebido: all.filter((c) => c.status === 'PAGO').reduce((t, c) => t + c.valor, 0),
      previsto: all.reduce((t, c) => t + c.valor, 0),
      mes: MESES[m - 1].toLowerCase(),
    };
  }, [alunos, faturas, today]);

  const marcar = async (o: AulaOcorrencia, status: AulaStatus) => {
    if (busyKey) return;
    setBusyKey(o.key);
    try {
      await props.onMarcar(o, status);
    } finally {
      setBusyKey(null);
    }
  };

  const shift = (dir: -1 | 1) => {
    if (view === 'MES') {
      setCursor((c) => {
        const m = c.month + dir;
        return m < 1 ? { year: c.year - 1, month: 12 } : m > 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: m };
      });
    } else if (view === 'SEMANA') setSel(addDaysIso(sel, 7 * dir));
    else if (view === 'DIA') setSel(addDaysIso(sel, dir));
  };

  const goToday = () => {
    setSel(today);
    setCursor({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  };

  const pickDay = (iso: string, nextView?: View) => {
    setSel(iso);
    if (nextView) setView(nextView);
  };

  const periodLabel =
    view === 'MES' ? `${MESES[cursor.month - 1]} ${cursor.year}`
      : view === 'SEMANA' ? `Semana ${ddmm(weekStart)} a ${ddmm(addDaysIso(weekStart, 6))}`
      : view === 'DIA' ? `${DOW_LONG[dayOfWeekIso(sel)]}, ${ddmm(sel)}`
      : 'Próximos 14 dias';

  const chip = 'text-[0.78rem] font-semibold px-1.5 py-0.5 truncate';

  return (
    <div className="space-y-5">
      {props.horariosIndisponiveis && (
        <p role="status" className="flex items-start gap-3 border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          Os horários fixos ainda não estão disponíveis no banco. A agenda mostra as aulas avulsas e as cobranças; os horários fixos aparecem assim que a atualização do banco for aplicada.
        </p>
      )}
      {props.actionError && (
        <p role="alert" className="border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{props.actionError}</p>
      )}

      {/* Barra de controles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-brand-surface px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Visualização" className="flex gap-1">
            {([['MES', 'Mês'], ['SEMANA', 'Semana'], ['DIA', 'Dia'], ['LISTA', 'Lista']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={cn('min-h-10 px-4 border text-[1rem]', view === key ? 'border-brand-blue bg-brand-blue text-white' : 'border-white/20 text-brand-ink hover:border-brand-blue-text')}
              >
                {label}
              </button>
            ))}
          </div>
          {view !== 'LISTA' && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => shift(-1)} aria-label="Período anterior" className="grid h-10 w-10 place-items-center border border-white/20 hover:border-brand-blue-text"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={goToday} className="min-h-10 px-3 border border-white/20 hover:border-brand-blue-text">Hoje</button>
              <button type="button" onClick={() => shift(1)} aria-label="Próximo período" className="grid h-10 w-10 place-items-center border border-white/20 hover:border-brand-blue-text"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase text-brand-subtle">Mostrar</span>
          <button type="button" aria-pressed={showAulas} onClick={() => setShowAulas((v) => !v)} className={cn('inline-flex min-h-10 items-center gap-2 border px-3', showAulas ? 'border-[#2A4BD6] bg-[#14224F] text-brand-ink' : 'border-white/15 text-brand-subtle')}>
            <span aria-hidden="true" className="h-2.5 w-2.5 bg-brand-blue" />Aulas
          </button>
          <button type="button" aria-pressed={showCob} onClick={() => setShowCob((v) => !v)} className={cn('inline-flex min-h-10 items-center gap-2 border px-3', showCob ? 'border-[#E8693A] bg-[#3B1C12] text-brand-ink' : 'border-white/15 text-brand-subtle')}>
            <span aria-hidden="true" className="h-2.5 w-2.5 bg-[#E8693A]" />Cobranças
          </button>
          <button type="button" onClick={props.onNovoHorario} disabled={props.horariosIndisponiveis} className="inline-flex min-h-10 items-center gap-2 border border-brand-blue bg-brand-blue px-4 text-white hover:bg-brand-blue-hover disabled:opacity-50">
            <Repeat className="h-4 w-4" aria-hidden="true" />Novo horário fixo
          </button>
          <button type="button" onClick={() => props.onAulaAvulsa(sel)} className="inline-flex min-h-10 items-center gap-2 border border-white/25 px-3 hover:border-brand-blue-text">
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />Aula avulsa
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        {/* Calendário */}
        <section aria-label="Calendário" className="min-w-0 flex-[999_1_560px]">
          <h2 className="title-display mb-3 text-[1.7rem] text-brand-ink">{periodLabel}</h2>

          {view === 'MES' && (
            <div className="overflow-x-auto">
              <div className="grid min-w-[620px] grid-cols-7 gap-1">
                {DOW.map((d) => (
                  <div key={d} className="px-1.5 py-1 text-xs uppercase text-brand-subtle">{d}</div>
                ))}
                {monthGrid.map((iso) => {
                  const dayAulas = aulasByDate.get(iso) ?? [];
                  const dayCobs = cobByDate.get(iso) ?? [];
                  const inMonth = Number(iso.slice(5, 7)) === cursor.month;
                  const isSel = iso === sel;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => pickDay(iso)}
                      onDoubleClick={() => pickDay(iso, 'DIA')}
                      aria-label={`${ddmm(iso)}: ${dayAulas.length} aula(s), ${dayCobs.length} vencimento(s)`}
                      aria-pressed={isSel}
                      className={cn(
                        'flex min-h-[104px] flex-col gap-1 p-1.5 text-left',
                        isSel ? 'border-2 border-brand-blue bg-[#16224A]' : 'border border-white/10 bg-brand-surface hover:border-white/25',
                        !inMonth && 'opacity-45'
                      )}
                    >
                      <span className={cn('title-display !not-italic text-lg leading-none', iso === today && 'self-start bg-brand-blue px-1.5 py-0.5 text-white')}>
                        {Number(iso.slice(8, 10))}
                      </span>
                      {dayAulas.length > 0 && (
                        <span className={cn(chip, AULA_STYLE.AGENDADO.cls)}>{dayAulas.length} {dayAulas.length === 1 ? 'aula' : 'aulas'}</span>
                      )}
                      {dayCobs.map((c) => (
                        <span key={c.key} className={cn(chip, COB_STYLE[c.status].cls)}>{brl(c.valor)} · {c.alunoNome.split(' ')[0]}</span>
                      ))}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'SEMANA' && (
            <div className="overflow-x-auto">
              <div className="grid min-w-[840px] grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i)).map((iso) => {
                  const dayAulas = aulasByDate.get(iso) ?? [];
                  const dayCobs = cobByDate.get(iso) ?? [];
                  return (
                    <div key={iso} className={cn('flex min-h-[360px] flex-col gap-1.5 bg-brand-surface p-2', iso === sel ? 'border-2 border-brand-blue' : 'border border-white/10')}>
                      <button type="button" onClick={() => pickDay(iso, 'DIA')} className="text-left">
                        <span className="block text-xs uppercase text-brand-subtle">{DOW[dayOfWeekIso(iso)]}</span>
                        <span className={cn('title-display !not-italic text-xl', iso === today && 'text-brand-blue-text')}>{ddmm(iso)}</span>
                      </button>
                      {dayCobs.map((c) => (
                        <div key={c.key} className={cn('px-2 py-1.5 text-[0.82rem] leading-tight', COB_STYLE[c.status].cls)}>
                          <strong className="block text-[0.7rem] uppercase tracking-wider">{COB_STYLE[c.status].label}</strong>
                          {c.alunoNome} · {brl(c.valor)}
                        </div>
                      ))}
                      {dayAulas.map((o) => {
                        const v = visualStatus(o, today);
                        return (
                          <button
                            key={o.key}
                            type="button"
                            onClick={() => (o.agendamentoId ? props.onAbrirAula(o.agendamentoId) : pickDay(o.date, 'DIA'))}
                            className={cn('px-2 py-1.5 text-left text-[0.82rem] leading-tight', AULA_STYLE[v].cls)}
                          >
                            <strong className="title-display !not-italic block text-base">{o.time}</strong>
                            {o.alunoNome}
                            {o.origem === 'AVULSA' && <span className="block text-[0.7rem] uppercase tracking-wider opacity-80">Avulsa</span>}
                          </button>
                        );
                      })}
                      {dayAulas.length + dayCobs.length === 0 && <p className="text-[0.82rem] text-brand-subtle">Livre</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'DIA' && (
            <div className="space-y-2">
              {(cobByDate.get(sel) ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 border border-white/10 bg-brand-surface p-3">
                  <span className="w-full text-xs uppercase text-brand-subtle">Vencimentos do dia</span>
                  {(cobByDate.get(sel) ?? []).map((c) => (
                    <span key={c.key} className={cn('px-3 py-2 text-sm', COB_STYLE[c.status].cls)}>
                      <strong>{c.alunoNome}</strong> · {brl(c.valor)} · {COB_STYLE[c.status].label}
                    </span>
                  ))}
                </div>
              )}
              <div className="border-t border-white/10">
                {Array.from({ length: 16 }, (_, i) => `${String(i + 6).padStart(2, '0')}`).map((hh) => {
                  const slot = (aulasByDate.get(sel) ?? []).filter((o) => o.time.slice(0, 2) === hh);
                  return (
                    <div key={hh} className="flex min-h-11 gap-4 border-b border-white/[0.07]">
                      <span className="title-display !not-italic w-14 shrink-0 pt-2.5 text-base text-brand-subtle">{hh}:00</span>
                      <div className="flex flex-1 flex-wrap gap-1.5 py-1.5">
                        {slot.map((o) => {
                          const v = visualStatus(o, today);
                          return (
                            <button
                              key={o.key}
                              type="button"
                              onClick={() => o.agendamentoId && props.onAbrirAula(o.agendamentoId)}
                              disabled={!o.agendamentoId}
                              className={cn('flex flex-wrap items-center gap-x-3 px-3 py-1.5 text-left text-sm disabled:cursor-default', AULA_STYLE[v].cls)}
                            >
                              <strong>{o.time !== `${hh}:00` ? `${o.time} · ` : ''}{o.alunoNome}</strong>
                              <span className="text-xs uppercase tracking-wider">{o.origem === 'AVULSA' ? 'Avulsa' : 'Horário fixo'} · {AULA_STYLE[v].label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'LISTA' && (
            <div className="space-y-5">
              {Array.from({ length: 14 }, (_, i) => addDaysIso(today, i)).map((iso, i) => {
                const dayAulas = aulasByDate.get(iso) ?? [];
                const dayCobs = cobByDate.get(iso) ?? [];
                if (dayAulas.length + dayCobs.length === 0) return null;
                return (
                  <div key={iso}>
                    <h3 className="mb-2 flex items-baseline gap-2.5">
                      <span className="title-display !not-italic text-xl">{i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DOW_LONG[dayOfWeekIso(iso)]}</span>
                      <span className="text-sm text-brand-subtle">{ddmm(iso)}</span>
                    </h3>
                    <ul className="space-y-1">
                      {dayCobs.map((c) => (
                        <li key={c.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-white/[0.08] bg-brand-surface px-3.5 py-2.5">
                          <span className={cn('title-display !not-italic w-12 text-lg', COB_STYLE[c.status].text)}>R$</span>
                          <span className="flex-[1_1_200px]"><strong>{c.alunoNome}</strong> <span className="text-brand-muted">· mensalidade {brl(c.valor)}</span></span>
                          <span className={cn('px-2 py-1 text-xs font-bold uppercase tracking-wider', COB_STYLE[c.status].cls)}>{COB_STYLE[c.status].label}</span>
                        </li>
                      ))}
                      {dayAulas.map((o) => {
                        const v = visualStatus(o, today);
                        return (
                          <li key={o.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-white/[0.08] bg-brand-surface px-3.5 py-2.5">
                            <span className="title-display !not-italic w-12 text-lg text-brand-blue-text">{o.time}</span>
                            <span className="flex-[1_1_200px]"><strong>{o.alunoNome}</strong> <span className="text-brand-muted">· {o.origem === 'AVULSA' ? 'avulsa' : 'horário fixo'}</span></span>
                            <span className={cn('px-2 py-1 text-xs font-bold uppercase tracking-wider', AULA_STYLE[v].cls)}>{AULA_STYLE[v].label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Painel lateral */}
        <aside aria-label="Resumo" className="flex flex-[1_1_300px] flex-col gap-4">
          <div className="chamfer-sm border border-white/12 bg-brand-surface p-4">
            <p className="text-xs uppercase text-brand-subtle">{sel === today ? 'Hoje' : DOW_LONG[dayOfWeekIso(sel)]}</p>
            <p className="title-display mb-3 text-3xl">{ddmm(sel)}</p>
            <p className="mb-2 text-sm uppercase text-brand-blue-text">Aulas ({aulasDoSel.length})</p>
            <ul className="space-y-1.5">
              {aulasDoSel.map((o) => {
                const v = visualStatus(o, today);
                const canMark = o.status === 'AGENDADO' && o.date <= today;
                const busy = busyKey === o.key;
                return (
                  <li key={o.key} className="flex flex-wrap items-center gap-2 border border-white/[0.08] bg-brand-bg px-2.5 py-2">
                    <span className="title-display !not-italic w-12 shrink-0 text-lg">{o.time}</span>
                    <span className="min-w-0 flex-1 text-sm">{o.alunoNome}</span>
                    {canMark ? (
                      <span className="flex gap-1">
                        <button type="button" disabled={busy} onClick={() => marcar(o, 'CONCLUIDO')} className="min-h-9 border border-[#2F6E52] px-2.5 text-xs text-[#86DDB4] disabled:opacity-50">Veio</button>
                        <button type="button" disabled={busy} onClick={() => marcar(o, 'FALTOU')} className="min-h-9 border border-white/20 px-2.5 text-xs text-brand-muted disabled:opacity-50">Faltou</button>
                      </span>
                    ) : o.status === 'AGENDADO' && o.origem === 'FIXO' && !o.agendamentoId ? (
                      <button type="button" disabled={busy} onClick={() => marcar(o, 'CANCELADO')} className="min-h-9 border border-white/20 px-2.5 text-xs text-brand-muted disabled:opacity-50">Cancelar esta</button>
                    ) : (
                      <button type="button" onClick={() => o.agendamentoId && props.onAbrirAula(o.agendamentoId)} disabled={!o.agendamentoId} className={cn('min-h-9 px-2 text-xs font-bold uppercase tracking-wider', AULA_STYLE[v].cls)}>{AULA_STYLE[v].label}</button>
                    )}
                  </li>
                );
              })}
              {aulasDoSel.length === 0 && <li className="text-sm text-brand-subtle">Nenhuma aula neste dia.</li>}
            </ul>
          </div>

          <div className="chamfer-sm border border-[#E8693A] bg-brand-surface p-4">
            <p className="title-display text-2xl">Para cobrar</p>
            <p className="mb-3 text-sm text-brand-muted">Atrasados e o que vence nos próximos 7 dias.</p>
            <ul className="space-y-1.5">
              {paraCobrar.map((c) => {
                const d = diffDaysIso(today, c.vencimento);
                const when = d < 0 ? `atrasado há ${-d} ${d === -1 ? 'dia' : 'dias'}` : d === 0 ? 'vence hoje' : `vence em ${d} ${d === 1 ? 'dia' : 'dias'}`;
                const aluno = alunosById.get(c.alunoId);
                const link = aluno ? props.chargeLink(c.alunoId) : '';
                return (
                  <li key={c.key} className="flex flex-wrap items-center gap-2 border border-white/[0.08] bg-brand-bg p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{c.alunoNome}</p>
                      <p className={cn('text-[0.82rem]', COB_STYLE[c.status].text)}>{brl(c.valor)} · {when}</p>
                    </div>
                    <span className="flex gap-1">
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 bg-brand-blue px-2.5 text-sm text-white hover:bg-brand-blue-hover">
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />Cobrar
                        </a>
                      )}
                      {c.podeDarBaixa && (
                        <button type="button" onClick={() => props.onBaixa(c.alunoId)} disabled={props.paymentSavingId === c.alunoId} className="min-h-9 border border-white/25 px-2.5 text-sm disabled:opacity-50">
                          {props.paymentSavingId === c.alunoId ? 'Salvando…' : 'Pago'}
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
              {paraCobrar.length === 0 && <li className="text-sm text-brand-subtle">Nada para cobrar agora.</li>}
            </ul>
            <p className="mt-3 flex justify-between gap-3 border-t border-white/10 pt-3 text-sm text-brand-muted">
              <span>Recebido em {recebidoMes.mes}</span>
              <strong className="text-brand-ink">{brl(recebidoMes.recebido)} de {brl(recebidoMes.previsto)}</strong>
            </p>
          </div>

          {!props.horariosIndisponiveis && (
            <div className="border border-white/12 bg-brand-surface p-4">
              <p className="title-display mb-3 flex items-center gap-2 text-2xl">Horários fixos <Slashes className="text-lg" /></p>
              <ul className="space-y-1.5">
                {horariosAtivos.map((h) => (
                  <li key={h.id} className="flex items-center gap-2 border border-white/[0.08] bg-brand-bg px-2.5 py-2">
                    <span className="title-display !not-italic w-12 shrink-0 text-lg">{normalizeHora(h.hora)}</span>
                    <span className="min-w-0 flex-1 text-sm">
                      {alunosById.get(h.aluno_id)?.nome ?? 'Aluno removido'}
                      <span className="block text-xs text-brand-subtle">{[...h.dias_semana].sort().map((d) => DOW[d]).join(' · ')}</span>
                    </span>
                    <button type="button" onClick={() => props.onEditarHorario(h)} aria-label="Editar horário fixo" className="grid h-9 w-9 place-items-center border border-white/20 hover:border-brand-blue-text">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {horariosAtivos.length === 0 && (
                  <li>
                    <button type="button" onClick={props.onNovoHorario} className="inline-flex items-center gap-2 text-sm text-brand-blue-text hover:underline">
                      <Plus className="h-4 w-4" aria-hidden="true" />Cadastre o primeiro horário fixo
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
