import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ageFromBirthDate } from '../../supabase/functions/insert-aluno/birth-date';
import PainelAppAccess from '@/components/admin/PainelAppAccess';
import StudentContact from '@/components/admin/StudentContact';
import { normalizeStudentEmail, STUDENT_EMAIL_ERROR, STUDENT_EMAIL_MAX_LENGTH } from '../../supabase/functions/insert-aluno/email';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
  ArrowLeft,
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  CalendarDays,
  MessageCircle,
  Target,
  Activity,
  HeartPulse,
  ListTodo,
  Hash,
  Loader2,
  AlertTriangle,
  Inbox,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Plus,
  Save,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  getSupabase,
  isSupabaseConfigured,
  formatSupabaseError,
  type AlunosRow,
  type AlunoStatus,
  type AgendamentosRow,
  type FaturasRow,
  type HorariosFixosRow,
  type AgendamentoStatus,
} from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useBrandTheme } from '@/lib/useBrandTheme';
import AgendaUnificada from '@/components/admin/AgendaUnificada';
import HorarioFixoModal from '@/components/admin/HorarioFixoModal';
import { registroDaOcorrencia, type AulaOcorrencia, type AulaStatus } from '@/lib/agenda-unificada';
import { LogoMark } from '@/components/brand/Logo';
import { Slashes } from '@/components/brand/SectionLabel';
import { PIX_KEY } from '@/lib/contact';
import { formatAgendaDateTime, toAgendaInstant } from '@/lib/agenda-dates';
import { getStudentFinancialStatus, getMonthReference, type StudentFinancialStatus } from '@/lib/financial-rules';
import { buildSheetCSV, buildWhatsAppLink, downloadCSV, formatWhatsApp } from '@/services/sheet-sync';

const PAGE_SIZE = 10;
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

type MainAdminTab = 'CRM' | 'FINANCEIRO' | 'AGENDA';

const STATUS_COLOR: Record<AlunoStatus, string> = {
  NOVO_LEAD: 'bg-sky-400/15 text-sky-300 border-sky-400/40',
  EM_NEGOCIACAO: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
  ATIVO: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40',
  INATIVO: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
  PERDIDO: 'bg-rose-400/15 text-rose-300 border-rose-400/40',
};

const STATUS_LABEL: Record<AlunoStatus, string> = {
  NOVO_LEAD: 'Novo Lead',
  EM_NEGOCIACAO: 'Em Negociação',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  PERDIDO: 'Perdido',
};

const STATUS_OPTIONS: Array<{ value: AlunoStatus; label: string }> = [
  { value: 'NOVO_LEAD', label: 'Novo Lead' },
  { value: 'EM_NEGOCIACAO', label: 'Em Negociação' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'INATIVO', label: 'Inativo' },
  { value: 'PERDIDO', label: 'Perdido' },
];

type DashboardFilter = 'ALL' | 'LEADS' | 'ATIVOS' | 'INATIVOS_PERDIDOS';

const FILTER_TABS: Array<{ key: DashboardFilter; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: 'LEADS', label: 'Leads (Site/Negociação)' },
  { key: 'ATIVOS', label: 'Alunos Ativos' },
  { key: 'INATIVOS_PERDIDOS', label: 'Inativos / Perdidos' },
];

interface DashboardState {
  rows: AlunosRow[];
  agendamentos: AgendamentosRow[];
  faturas: FaturasRow[];
  horarios: HorariosFixosRow[];
  horariosIndisponiveis: boolean;
  page: number;
  searchTerm: string;
  loading: boolean;
  error: string | null;
  initialLoad: boolean;
}

interface ManualAlunoFormState {
  nome: string;
  email: string;
  whatsapp: string;
  data_nascimento: string;
  objetivo: string;
  mensalidade: string;
  dia_vencimento: string;
  status: AlunoStatus;
  permuta: boolean;
}

interface CrmDraft {
  mensalidade: string;
  dia_vencimento: string;
  status: AlunoStatus;
  permuta: boolean;
}

interface MetricCardData {
  label: string;
  value: string;
  helper: string;
}

interface AgendaFormState {
  aluno_id: string;
  data: string;
  hora: string;
  status: AgendamentoStatus;
  observacoes: string;
}

type FinancialStatus = StudentFinancialStatus;

const FIN_STATUS_LABEL: Record<FinancialStatus, string> = {
  PAGO: 'Pago',
  PENDENTE: 'Pendente',
  ATRASADO: 'Atrasado',
  PERMUTA: 'Permuta',
  NAO_CONFIGURADO: 'Não configurado',
  NAO_APLICAVEL: '—',
};

const FIN_STATUS_CLASS: Record<FinancialStatus, string> = {
  PAGO: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/35',
  PENDENTE: 'bg-amber-400/15 text-amber-200 border-amber-400/35',
  ATRASADO: 'bg-rose-400/15 text-rose-200 border-rose-400/35',
  PERMUTA: 'bg-sky-400/15 text-sky-200 border-sky-400/35',
  NAO_CONFIGURADO: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  NAO_APLICAVEL: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

const AGENDA_STATUS_COLOR: Record<AgendamentoStatus, string> = {
  AGENDADO: 'bg-sky-400/15 text-sky-300 border-sky-400/35',
  CONCLUIDO: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/35',
  FALTOU: 'bg-rose-400/15 text-rose-200 border-rose-400/35',
  CANCELADO: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

const AGENDA_STATUS_LABEL: Record<AgendamentoStatus, string> = {
  AGENDADO: 'Agendado',
  CONCLUIDO: 'Concluído',
  FALTOU: 'Faltou',
  CANCELADO: 'Cancelado',
};

const EMPTY_MANUAL_FORM: ManualAlunoFormState = {
  nome: '',
  email: '',
  whatsapp: '',
  data_nascimento: '',
  objetivo: '',
  mensalidade: '',
  dia_vencimento: '',
  status: 'ATIVO',
  permuta: false,
};

const EMPTY_AGENDA_FORM: AgendaFormState = {
  aluno_id: '',
  data: '',
  hora: '08:00',
  status: 'AGENDADO',
  observacoes: '',
};

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatDateTimeBR = (value: string | null | undefined): string =>
  value
    ? new Date(value).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const formatDateBR = (value: string | null | undefined): string =>
  value
    ? new Date(value).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

const formatTimeBR = (value: string | null | undefined): string =>
  value
    ? new Date(value).toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const formatCurrencyBR = (value: number | null | undefined): string =>
  value == null
    ? '—'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);

const parseCurrencyInput = (value: string): number | null => {
  const cleaned = value.trim();
  if (!/^\d{1,9}([,.]\d{1,2})?$/.test(cleaned)) return null;
  const parsed = Number(cleaned.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const isCurrencyInput = (value: string): boolean =>
  /^\d{0,9}([,.]\d{0,2})?$/.test(value);

const isDueDayInput = (value: string): boolean =>
  /^\d{0,2}$/.test(value) && (value === '' || Number(value) <= 31);

const parseOptionalInteger = (value: string): number | null => {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isInteger(parsed) ? parsed : null;
};

const getNowSaoPaulo = (): { year: number; month: number; day: number; isoDate: string } => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const isoDate = `${get('year')}-${get('month')}-${get('day')}`;
  return { year, month, day, isoDate };
};

const getCurrentMonthReference = (): string => {
  const now = getNowSaoPaulo();
  return getMonthReference(now.year, now.month);
};

const formatMonthReference = (value: string | null | undefined): string => value || '—';

const monthReferenceToSortable = (value: string | null): number => {
  const match = value ? /^(\d{2})\/(\d{4})$/.exec(value.trim()) : null;
  if (!match) return -1;
  return Number(match[2]) * 100 + Number(match[1]);
};

const getWeekStart = (date: Date): Date => {
  const result = new Date(`${toISODateLocal(date)}T12:00:00Z`);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - day);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(`${toISODateLocal(date)}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const toISODateLocal = (date: Date): string => {
  return formatAgendaDateTime(date.toISOString()).date;
};

const toAgendaDateTime = (date: string, hour: string): string => toAgendaInstant(date, hour);

const getFinancialStatus = (aluno: AlunosRow): FinancialStatus => {
  return getStudentFinancialStatus(aluno, getNowSaoPaulo());
};

const formatAgeLabel = (idade: number | null | undefined): string =>
  typeof idade === 'number' && Number.isFinite(idade) && idade > 0 ? `${idade} anos` : '—';

const getOrigemLabel = (origem: string | null | undefined): string => {
  const normalized = normalizeText(origem);
  if (!normalized) return 'Não informado';
  if (normalized.includes('manual')) return 'Cadastro manual';
  if (normalized.includes('site') || normalized.includes('anamnese')) return 'Site';
  return String(origem);
};

const isLeadStatus = (status: AlunoStatus): boolean => status === 'NOVO_LEAD' || status === 'EM_NEGOCIACAO';

const canConvertAluno = (status: AlunoStatus): boolean => isLeadStatus(status) || status === 'PERDIDO';

const matchesFilter = (aluno: AlunosRow, filter: DashboardFilter): boolean => {
  if (filter === 'ALL') return true;
  if (filter === 'LEADS') return isLeadStatus(aluno.status);
  if (filter === 'ATIVOS') return aluno.status === 'ATIVO';
  return aluno.status === 'INATIVO' || aluno.status === 'PERDIDO';
};

const buildPrefilledWhatsAppLink = (aluno: AlunosRow, kind: 'welcome' | 'charge'): string => {
  const base = aluno.whatsapp_link || buildWhatsAppLink(aluno.whatsapp);
  if (!base) return '';
  const nome = aluno.nome.split(' ')[0] || aluno.nome;
  const message =
    kind === 'charge'
      ? `Olá, ${nome}! Passando para lembrar da mensalidade${aluno.mensalidade != null ? ` no valor de ${formatCurrencyBR(aluno.mensalidade)}` : ''}${aluno.dia_vencimento ? ` com vencimento no dia ${aluno.dia_vencimento}` : ''}.\n\nChave PIX: ${PIX_KEY}\n\nQualquer dúvida, me chama por aqui.`
      : `Olá, ${nome}! Seja bem-vindo(a). Recebi seu cadastro e quero te ajudar a organizar seus próximos passos. Me responde por aqui para alinharmos o atendimento.`;
  return `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;
};

const getQuickActionType = (aluno: AlunosRow): 'welcome' | 'charge' =>
  isLeadStatus(aluno.status) || aluno.permuta ? 'welcome' : 'charge';

export default function AdminDashboard() {
  useBrandTheme('admin');
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState>({
    rows: [],
    agendamentos: [],
    faturas: [],
    horarios: [],
    horariosIndisponiveis: false,
    page: 1,
    searchTerm: '',
    loading: true,
    error: null,
    initialLoad: true,
  });
  const [selected, setSelected] = useState<AlunosRow | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<DashboardFilter>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(() => new URLSearchParams(window.location.search).get('abrir') === 'cadastro');
  const [openConversionForId, setOpenConversionForId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainAdminTab>(() =>
    new URLSearchParams(window.location.search).get('abrir') === 'agenda' ? 'AGENDA' : 'CRM');
  const [agendaSelectedDate, setAgendaSelectedDate] = useState<string>(() => toISODateLocal(new Date()));
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentosRow | null>(null);
  const [agendaPrefillDate, setAgendaPrefillDate] = useState<string>(() => toISODateLocal(new Date()));
  const [financialActionError, setFinancialActionError] = useState<string | null>(null);
  const [paymentSavingId, setPaymentSavingId] = useState<string | null>(null);
  const [horarioModal, setHorarioModal] = useState<{ open: boolean; horario: HorariosFixosRow | null }>({ open: false, horario: null });
  const [agendaActionError, setAgendaActionError] = useState<string | null>(null);

  const supabaseOk = useMemo(() => isSupabaseConfigured(), []);

  const loadDashboardData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    const sb = getSupabase();
    if (!sb) {
      setState((s) => ({
        ...s,
        loading: false,
        initialLoad: false,
        error: 'Supabase não está configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
      }));
      return;
    }

    if (!silent) {
      setState((s) => ({ ...s, loading: true, error: null }));
    }

    try {
      const [alunosRes, agendamentosRes, faturasRes, horariosRes] = await Promise.all([
        sb.from('alunos').select('*').order('created_at', { ascending: false }),
        sb.from('agendamentos').select('*').order('data_hora', { ascending: true }),
        sb.from('faturas').select('*').order('created_at', { ascending: false }),
        sb.from('horarios_fixos').select('*').order('hora', { ascending: true }),
      ]);
      if (horariosRes.error) {
        console.warn('[CRM] Horários fixos indisponíveis:', horariosRes.error.message);
      }

      if (alunosRes.error) throw alunosRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;
      if (faturasRes.error) throw faturasRes.error;

      setState((s) => ({
        ...s,
        rows: (alunosRes.data ?? []) as AlunosRow[],
        agendamentos: (agendamentosRes.data ?? []) as AgendamentosRow[],
        faturas: (faturasRes.data ?? []) as FaturasRow[],
        horarios: horariosRes.error ? [] : ((horariosRes.data ?? []) as HorariosFixosRow[]),
        horariosIndisponiveis: !!horariosRes.error,
        loading: false,
        initialLoad: false,
        error: null,
      }));
    } catch (err) {
      const { message } = formatSupabaseError(err, 'Load alunos');
      setState((s) => ({
        ...s,
        rows: [],
        agendamentos: [],
        faturas: [],
        loading: false,
        initialLoad: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadDashboardData({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadDashboardData]);

  const filteredRows = useMemo(() => {
    const term = normalizeText(state.searchTerm);
    return state.rows.filter((aluno) => {
      if (!matchesFilter(aluno, filterTab)) return false;
      if (!term) return true;
      const haystack = [
        aluno.nome,
        aluno.whatsapp,
        aluno.objetivo ?? '',
        aluno.goal_details ?? '',
        aluno.origem ?? '',
      ]
        .map(normalizeText)
        .join(' ');
      return haystack.includes(term);
    });
  }, [filterTab, state.rows, state.searchTerm]);

  const total = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setState((s) => {
      const safePage = Math.min(s.page, pageCount);
      return safePage === s.page ? s : { ...s, page: safePage };
    });
  }, [pageCount]);

  const currentRows = useMemo(() => {
    const from = (state.page - 1) * PAGE_SIZE;
    return filteredRows.slice(from, from + PAGE_SIZE);
  }, [filteredRows, state.page]);

  const financialRows = useMemo(() => {
    const term = normalizeText(state.searchTerm);
    return state.rows.filter((row) => row.status === 'ATIVO' && (!term ||
      [row.nome, row.whatsapp].map(normalizeText).join(' ').includes(term)));
  }, [state.rows, state.searchTerm]);

  const tabCounts = useMemo(() => {
    return FILTER_TABS.reduce<Record<DashboardFilter, number>>((acc, tab) => {
      acc[tab.key] = state.rows.filter((row) => matchesFilter(row, tab.key)).length;
      return acc;
    }, { ALL: 0, LEADS: 0, ATIVOS: 0, INATIVOS_PERDIDOS: 0 });
  }, [state.rows]);

  const metricCards = useMemo<MetricCardData[]>(() => {
    const leads = state.rows.filter((row) => isLeadStatus(row.status)).length;
    const ativos = state.rows.filter((row) => row.status === 'ATIVO');
    const faturamento = ativos.filter((row) => !row.permuta).reduce((sum, row) => sum + (Number(row.mensalidade) || 0), 0);
    const inativosPerdidos = state.rows.filter((row) => row.status === 'INATIVO' || row.status === 'PERDIDO').length;
    const atrasados = ativos.filter((row) => getFinancialStatus(row) === 'ATRASADO').length;
    const mesAtual = getCurrentMonthReference();
    const recebido = state.faturas
      .filter((fatura) => fatura.mes_referencia === mesAtual && fatura.status === 'PAID')
      .reduce((sum, fatura) => sum + fatura.valor, 0);

    return [
      {
        label: 'Leads em aberto',
        value: leads.toLocaleString('pt-BR'),
        helper: 'Somando novos leads e negociações em andamento.',
      },
      {
        label: 'Alunos ativos',
        value: ativos.length.toLocaleString('pt-BR'),
        helper: `${inativosPerdidos.toLocaleString('pt-BR')} registro(s) entre inativos e perdidos.`,
      },
      {
        label: 'Mensalidades previstas',
        value: formatCurrencyBR(faturamento),
        helper: 'Previsão pela mensalidade dos alunos ativos; não representa valor recebido.',
      },
      {
        label: 'Recebido neste mês',
        value: formatCurrencyBR(recebido),
        helper: 'Somente baixas registradas na competência atual.',
      },
      {
        label: 'Atrasados / vencidos',
        value: atrasados.toLocaleString('pt-BR'),
        helper: 'Apenas alunos ativos com pagamento atrasado no mês atual.',
      },
    ];
  }, [state.rows, state.faturas]);

  const syncUpdatedRow = (updated: AlunosRow) => {
    setState((s) => ({
      ...s,
      rows: s.rows.map((row) => (row.id === updated.id ? updated : row)),
    }));
    setSelected((current) => (current?.id === updated.id ? updated : current));
  };

  const syncFaturaRow = (fatura: FaturasRow) => {
    setState((s) => {
      const exists = s.faturas.some((item) => item.id === fatura.id);
      return {
        ...s,
        faturas: exists
          ? s.faturas.map((item) => (item.id === fatura.id ? fatura : item))
          : [fatura, ...s.faturas],
      };
    });
  };

  const syncAgendamentoRow = (agendamento: AgendamentosRow) => {
    setState((s) => {
      const exists = s.agendamentos.some((item) => item.id === agendamento.id);
      const next = exists
        ? s.agendamentos.map((item) => (item.id === agendamento.id ? agendamento : item))
        : [...s.agendamentos, agendamento];
      return {
        ...s,
        agendamentos: next.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()),
      };
    });
    setSelectedAgendamento((current) => (current?.id === agendamento.id ? agendamento : current));
  };

  const syncHorarioRow = (horario: HorariosFixosRow) => {
    setState((s) => {
      const exists = s.horarios.some((item) => item.id === horario.id);
      return {
        ...s,
        horarios: exists ? s.horarios.map((item) => (item.id === horario.id ? horario : item)) : [...s.horarios, horario],
      };
    });
  };

  /** Presença, falta ou cancelamento de uma aula; cria o registro da ocorrência do horário fixo se ainda não existir. */
  const marcarOcorrencia = async (ocorrencia: AulaOcorrencia, status: AulaStatus) => {
    setAgendaActionError(null);
    const sb = getSupabase();
    if (!sb) {
      setAgendaActionError('Supabase não está configurado neste ambiente.');
      return;
    }
    try {
      if (ocorrencia.agendamentoId) {
        const row = state.agendamentos.find((item) => item.id === ocorrencia.agendamentoId);
        if (row) await updateAgendamentoStatus(row, status);
        return;
      }
      const { data, error } = await sb
        .from('agendamentos')
        .insert(registroDaOcorrencia(ocorrencia, status) as never)
        .select()
        .single();
      if (error) throw error;
      if (data) syncAgendamentoRow(data as AgendamentosRow);
    } catch (err) {
      const { message } = formatSupabaseError(err, 'Registrar aula');
      setAgendaActionError(`Não foi possível registrar a aula: ${message}`);
      loadDashboardData({ silent: true });
    }
  };

  const markAsPaid = useCallback(
    async (alunoId: string) => {
      setFinancialActionError(null);
      setPaymentSavingId(alunoId);
      try {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase indisponível.');
        const aluno = state.rows.find((row) => row.id === alunoId);
        if (!aluno || aluno.status !== 'ATIVO') throw new Error('Aluno ativo não encontrado.');
        const result = await sb.rpc('record_current_month_payment' as never, { p_aluno_id: alunoId } as never) as unknown as {
          data: { ok: boolean; aluno: AlunosRow; fatura: FaturasRow } | null;
          error: unknown;
        };
        const { data, error } = result;
        if (error) throw error;
        if (!data?.ok || !data.aluno || !data.fatura) throw new Error('A baixa não retornou confirmação do banco.');
        syncUpdatedRow(data.aluno);
        syncFaturaRow(data.fatura);
      } catch {
        setFinancialActionError('Não foi possível confirmar a baixa no banco. Atualize o painel e tente novamente; nenhum sucesso foi informado.');
      } finally {
        setPaymentSavingId(null);
      }
    },
    [state.rows]
  );

  const prependCreatedRow = (created: AlunosRow) => {
    setState((s) => ({
      ...s,
      page: 1,
      rows: [created, ...s.rows],
    }));
    setFilterTab('ALL');
  };

  const openAgendaCreate = (date?: string) => {
    const nextDate = date ?? agendaSelectedDate;
    setAgendaPrefillDate(nextDate);
    setSelectedAgendamento(null);
    setIsAgendaOpen(true);
  };

  const handleAgendaSave = async (agendamento: AgendamentosRow) => {
    syncAgendamentoRow(agendamento);
    setAgendaSelectedDate(formatAgendaDateTime(agendamento.data_hora).date);
    setIsAgendaOpen(false);
    setSelectedAgendamento(null);
  };

  const updateAgendamentoStatus = async (agendamento: AgendamentosRow, status: AgendamentoStatus) => {
    const sb = getSupabase();
    if (!sb || agendamento.status === status) return;
    const { data, error } = await sb
      .from('agendamentos')
      .update({ status } as never)
      .eq('id', agendamento.id)
      .select()
      .single();
    if (error) throw error;
    if (data) syncAgendamentoRow(data as AgendamentosRow);
  };

  const handleLogout = async () => {
    if (logoutLoading) return;
    const sb = getSupabase();
    if (!sb) {
      navigate('/login', { replace: true });
      return;
    }
    setLogoutLoading(true);
    try {
      await sb.auth.signOut();
    } finally {
      setLogoutLoading(false);
      navigate('/login', { replace: true });
    }
  };

  const exportCurrentToCSV = () => {
    if (currentRows.length === 0) return;
    const header = [
      'ID',
      'Criado em',
      'Nome',
      'WhatsApp',
      'Idade',
      'Objetivo',
      'Status',
      'Origem',
      'Mensalidade',
      'Dia do vencimento',
      'WhatsApp Link',
    ];
    const rows = currentRows.map((r) => [
      r.id,
      formatDateTimeBR(r.created_at),
      r.nome,
      r.whatsapp,
      (r.data_nascimento ? ageFromBirthDate(r.data_nascimento) : r.idade)?.toString() ?? '',
      r.objetivo ?? '',
      STATUS_LABEL[r.status] ?? r.status,
      getOrigemLabel(r.origem),
      r.mensalidade == null ? '' : String(r.mensalidade),
      r.dia_vencimento == null ? '' : String(r.dia_vencimento),
      r.whatsapp_link ?? buildWhatsAppLink(r.whatsapp),
    ]);
    const csv = buildSheetCSV([header, ...rows]);
    downloadCSV(csv, `crm-alunos-pag-${state.page}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <section className="min-h-screen w-full bg-brand-bg relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="absolute -right-10 top-0 h-full w-24 bg-brand-blue/80 -skew-x-[18deg] origin-top hidden xl:block" />
        <div className="absolute -left-24 top-0 w-[220px] h-[90px] bg-white/[0.04] -skew-x-[32deg] hidden lg:block" />
      </div>

      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-wrap items-start gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime-400 transition-colors rounded-sm px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </Link>
            <PainelAppAccess />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-brand-blue text-white hover:bg-brand-blue-hover border border-brand-blue"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Aluno
            </Button>
            <Button
              variant="outline"
              onClick={() => loadDashboardData()}
              disabled={state.loading || !supabaseOk}
              className="inline-flex items-center gap-2 border-white/20 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background"
            >
              <RefreshCcw className={cn('w-4 h-4', state.loading && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={exportCurrentToCSV}
              disabled={mainTab !== 'CRM' || currentRows.length === 0}
              className="inline-flex items-center gap-2 border-white/20 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="inline-flex items-center gap-2 border-red-500/40 text-red-300 hover:border-red-400 hover:text-red-200 hover:bg-red-500/10 transition-all duration-300 focus-visible:ring-offset-2 focus-visible:ring-red-400 ring-offset-background"
            >
              {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Sair
            </Button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Áreas do painel" className="mb-5 flex flex-wrap content-start gap-2 lg:mb-0 lg:flex-col lg:sticky lg:top-8 lg:self-start lg:min-h-[calc(100vh-9rem)]">
          {([
            { key: 'CRM', label: 'Alunos e leads' },
            { key: 'FINANCEIRO', label: 'Financeiro' },
            { key: 'AGENDA', label: 'Agenda' },
          ] as const).map((tab) => {
            const active = mainTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMainTab(tab.key);
                  setState((s) => ({ ...s, searchTerm: '', page: 1 }));
                }}
                className={cn(
                  'inline-flex items-center gap-2 border px-4 py-2.5 text-[1.05rem] transition-colors',
                  active
                    ? 'border-brand-blue bg-brand-blue text-white'
                    : 'border-white/20 bg-transparent text-brand-ink hover:border-brand-blue-text'
                )}
              >
                {tab.label}
              </button>
            );
          })}
          <div className="hidden lg:block mt-auto pt-16">
            <LogoMark className="h-12 w-auto" />
            <p className="mt-3 text-[0.8rem] font-bold tracking-[0.28em] uppercase text-brand-ink leading-snug">Thiago<br />Mancilha<br />Reis</p>
            <p className="mt-3 inline-flex items-center gap-2 text-[0.68rem] tracking-[0.24em] uppercase text-brand-muted"><Slashes className="text-xs" />Personal trainer</p>
          </div>
        </nav>

        <div className="min-w-0">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
          <div>
            <h1 className="title-display text-4xl sm:text-5xl text-brand-ink flex items-center gap-4">
              {mainTab === 'CRM' ? 'Alunos e leads' : mainTab === 'FINANCEIRO' ? 'Financeiro' : 'Agenda'}
              <Slashes className="text-3xl" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mainTab === 'CRM'
                ? `Leads do site e alunos antigos centralizados em um só painel — ${total.toLocaleString('pt-BR')} registro(s) nesta visualização`
                : mainTab === 'FINANCEIRO'
                  ? 'Acompanhe as mensalidades e registre os pagamentos dos alunos ativos.'
                  : 'Aulas e cobranças no mesmo lugar: horários fixos, presença e quem precisa pagar.'}
            </p>
          </div>
          <div className={cn('w-full', mainTab === 'CRM' ? 'sm:max-w-md' : 'sm:max-w-lg')}>
            <label htmlFor="q" className="block text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">
              {mainTab === 'AGENDA' ? 'Buscar aluno na agenda' : 'Buscar aluno'}
            </label>
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="q"
                type="search"
                value={state.searchTerm}
                placeholder={mainTab === 'AGENDA' ? 'Filtre aulas por nome do aluno...' : 'Nome ou WhatsApp...'}
                onChange={(e) => setState((s) => ({ ...s, page: 1, searchTerm: e.target.value }))}
                className={cn(
                  'w-full pl-10 pr-3 py-2.5 rounded-sm bg-brand-bg border border-white/20 text-foreground placeholder:text-slate-500',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 focus-visible:border-lime-400 transition-all duration-300'
                )}
              />
            </div>
          </div>
        </div>

        {!state.initialLoad && mainTab !== 'AGENDA' && (
          <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {(mainTab === 'CRM' ? [metricCards[0], metricCards[1], metricCards[2], metricCards[4]] : metricCards.slice(2)).map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden chamfer-sm border border-white/15 bg-brand-surface p-5"
              >
                <span aria-hidden="true" className="absolute -right-4 top-0 h-full w-10 bg-white/[0.05] -skew-x-[24deg]" />
                <span aria-hidden="true" className="absolute right-8 top-0 h-full w-3 bg-brand-blue/50 -skew-x-[24deg]" />
                <p className="relative text-[0.95rem] uppercase text-brand-ink">{card.label}</p>
                <p className="relative mt-2 title-display text-4xl sm:text-[2.6rem] text-brand-ink">{card.value}</p>
                <p className="relative mt-2 text-sm text-brand-muted leading-snug">{card.helper}</p>
              </div>
            ))}
          </div>
        )}
        {financialActionError && mainTab !== 'AGENDA' && (
          <p role="alert" className="mb-5 rounded-sm border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {financialActionError}
          </p>
        )}

        {!supabaseOk && (
          <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-5 flex gap-4 items-start mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-amber-300 mb-1">Supabase não conectado</h2>
              <p className="text-sm text-amber-200/80 leading-relaxed">
                Adicione <span className="font-mono text-xs bg-amber-500/15 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</span> e{' '}
                <span className="font-mono text-xs bg-amber-500/15 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</span> no{' '}
                <code className="font-mono text-xs">.env</code> local e nas variáveis de ambiente da Vercel.
              </p>
            </div>
          </div>
        )}

        {state.error && (
          <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-5 flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-red-300 mb-1">Erro ao carregar o CRM</h2>
                <p className="text-sm text-red-200/80 leading-relaxed">{state.error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => loadDashboardData()}
              className="self-end sm:self-start border-red-400/50 hover:border-red-400 hover:bg-red-500/10 text-red-200 hover:text-red-100 transition-all duration-300 inline-flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {state.initialLoad && state.loading && (
          <div className="rounded-sm border border-white/10 bg-brand-surface p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
            <p className="text-muted-foreground text-sm">
              {mainTab === 'CRM' ? 'Carregando alunos...' : 'Carregando agenda e financeiro...'}
            </p>
          </div>
        )}

        {!state.initialLoad && mainTab === 'CRM' && (
          <div className="mb-5 flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const active = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilterTab(tab.key);
                    setState((s) => ({ ...s, page: 1 }));
                  }}
                  className={cn(
                    'inline-flex items-center gap-3 border px-4 py-2 text-[1.05rem] transition-colors',
                    active
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-white/20 bg-transparent text-brand-ink hover:border-brand-blue-text'
                  )}
                >
                  <span className="font-semibold">{tab.label}</span>
                  <span className={cn('px-2 py-0.5 text-xs font-bold', active ? 'bg-brand-bg/80 text-white' : 'bg-white/10')}>
                    {tabCounts[tab.key].toLocaleString('pt-BR')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!state.initialLoad && !state.loading && mainTab === 'CRM' && currentRows.length === 0 && (
          <div className="rounded-sm border border-white/10 bg-brand-surface p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-sm bg-slate-800/60 border border-white/20/70 flex items-center justify-center text-muted-foreground">
              <Inbox className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl text-foreground mb-1">
                {state.searchTerm ? 'Nenhum resultado para sua busca' : 'Nenhum aluno nesta aba'}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                {state.searchTerm
                  ? 'Tente outros termos ou limpe a busca para ver o restante dos registros.'
                  : 'Você pode cadastrar alunos antigos manualmente ou aguardar novos envios do site.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {state.searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setState((s) => ({ ...s, page: 1, searchTerm: '' }))}
                  className="inline-flex items-center gap-2 border-white/20 hover:border-lime-400 hover:text-lime-400 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  Limpar busca
                </Button>
              )}
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 bg-brand-blue text-white hover:bg-brand-blue-hover border border-brand-blue"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Aluno
              </Button>
            </div>
          </div>
        )}

        {!state.initialLoad && mainTab === 'CRM' && currentRows.length > 0 && (
          <>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="title-display text-3xl text-brand-ink flex items-center gap-3">Pessoas cadastradas <Slashes className="text-2xl" /></h2>
                <p className="text-sm text-muted-foreground">Abra a ficha para consultar dados e ações.</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-sm border border-white/10 bg-brand-surface">
              {currentRows.map((aluno) => {
                const quickAction = getQuickActionType(aluno);
                const finStatus = getFinancialStatus(aluno);
                return (
                  <div key={aluno.id} className="relative grid gap-3 border-b border-white/10 px-5 py-4 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:bg-brand-blue last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5">
                    <div className="min-w-0">
                      <p className="break-words title-display !not-italic !font-bold text-[1.35rem] text-brand-ink">{aluno.nome}</p>
                      <p className="mt-1 text-xs text-slate-400">{getOrigemLabel(aluno.origem)} · {formatDateTimeBR(aluno.created_at)}</p>
                      <p className="mt-1 text-xs text-slate-400">{aluno.whatsapp}</p>
                    </div>
                    <div>
                      <Badge className={cn('border rounded-full text-[11px] font-bold uppercase tracking-wider', STATUS_COLOR[aluno.status] ?? STATUS_COLOR.ATIVO)}>{STATUS_LABEL[aluno.status] ?? aluno.status}</Badge>
                      <p className="mt-1 break-words text-xs text-slate-400">{aluno.objetivo || 'Objetivo não informado'}</p>
                    </div>
                    <div className="text-sm text-slate-300">
                      {isLeadStatus(aluno.status) ? <span>Próximo passo: entrar em contato</span> : aluno.status === 'ATIVO' ? aluno.permuta ? <span>Permuta · sem cobrança</span> : <><span>{formatCurrencyBR(aluno.mensalidade)} · {aluno.dia_vencimento ? `dia ${aluno.dia_vencimento}` : 'sem vencimento'}</span><p className="mt-1 text-xs text-slate-400">{FIN_STATUS_LABEL[finStatus]}</p></> : <span>Cadastro {STATUS_LABEL[aluno.status]?.toLowerCase() ?? aluno.status.toLowerCase()}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <a href={buildPrefilledWhatsAppLink(aluno, quickAction)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 border border-brand-blue px-3.5 text-[0.95rem] text-brand-ink hover:bg-brand-blue/20"><MessageCircle className="h-4 w-4" />{quickAction === 'charge' ? 'Cobrar' : 'Conversar'}</a>
                      <Button variant="outline" size="sm" onClick={() => setSelected(aluno)} className="border-white/20 hover:border-lime-400 hover:text-lime-400"><ListTodo className="mr-1.5 h-4 w-4" />Ver ficha</Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Mostrando{' '}
                <span className="font-semibold text-slate-300">
                  {total === 0 ? 0 : (state.page - 1) * PAGE_SIZE + 1}
                </span>{' '}
                —{' '}
                <span className="font-semibold text-slate-300">
                  {Math.min(state.page * PAGE_SIZE, total)}
                </span>{' '}
                de <span className="font-semibold text-slate-300">{total}</span> resultados
                {state.searchTerm && (
                  <> · filtrando por "<span className="text-lime-400">{state.searchTerm}</span>"</>
                )}
              </p>
              <div className="inline-flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}
                  disabled={state.page <= 1 || state.loading}
                  className="border-white/20 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-brand-bg border border-white/10 text-xs tabular-nums text-slate-300">
                  Página <span className="font-bold text-lime-400">{state.page}</span> / {pageCount}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState((s) => ({ ...s, page: Math.min(pageCount, s.page + 1) }))}
                  disabled={state.page >= pageCount || state.loading}
                  className="border-white/20 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 disabled:opacity-50"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {!state.initialLoad && mainTab === 'FINANCEIRO' && (
          <section aria-labelledby="financeiro-heading">
            <div className="mb-3">
              <h2 id="financeiro-heading" className="title-display text-3xl text-brand-ink">Mensalidades dos alunos ativos</h2>
              <p className="text-sm text-muted-foreground">Consulte a situação do mês e registre pagamentos confirmados.</p>
            </div>
            {financialRows.length === 0 ? (
              <p className="rounded-sm border border-white/10 bg-brand-surface p-6 text-sm text-slate-300">Nenhum aluno ativo encontrado.</p>
            ) : (
              <div className="overflow-hidden rounded-sm border border-white/10 bg-brand-surface">
                {financialRows.map((aluno) => {
                  const finStatus = getFinancialStatus(aluno);
                  return (
                    <div key={aluno.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5">
                      <div className="min-w-0"><p className="break-words font-semibold text-foreground">{aluno.nome}</p><p className="mt-1 text-xs text-slate-400">{aluno.whatsapp}</p></div>
                      <div className="text-sm text-slate-200"><p className="font-medium">{aluno.permuta ? 'Sem cobrança' : formatCurrencyBR(aluno.mensalidade)}</p><p className="mt-1 text-xs text-slate-400">{aluno.permuta ? 'Permuta de serviços' : aluno.dia_vencimento ? `Vence dia ${aluno.dia_vencimento}` : 'Vencimento não informado'}</p></div>
                      <div><Badge className={cn('border rounded-full text-[11px] font-bold uppercase tracking-wider', FIN_STATUS_CLASS[finStatus])}>{FIN_STATUS_LABEL[finStatus]}</Badge></div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {!aluno.permuta && <><Button size="sm" variant="outline" onClick={() => markAsPaid(aluno.id)} disabled={finStatus === 'PAGO' || finStatus === 'NAO_CONFIGURADO' || paymentSavingId === aluno.id} className="border-white/20 hover:border-emerald-400 hover:text-emerald-300"><CreditCard className="mr-1.5 h-4 w-4" />{finStatus === 'PAGO' ? 'Pago' : paymentSavingId === aluno.id ? 'Salvando…' : 'Marcar pago'}</Button>
                        <a href={buildPrefilledWhatsAppLink(aluno, 'charge')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-lime-400/25 bg-lime-400/10 px-3 text-xs font-semibold text-lime-300 hover:border-lime-400/60"><MessageCircle className="h-4 w-4" />Cobrar</a></>}
                        <Button size="sm" variant="ghost" onClick={() => setSelected(aluno)} className="text-slate-300 hover:text-lime-400">Ver ficha</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {!state.initialLoad && mainTab === 'AGENDA' && (
          <AgendaUnificada
            alunos={state.rows}
            agendamentos={state.agendamentos}
            faturas={state.faturas}
            horarios={state.horarios}
            horariosIndisponiveis={state.horariosIndisponiveis}
            searchTerm={state.searchTerm}
            today={getNowSaoPaulo().isoDate}
            paymentSavingId={paymentSavingId}
            actionError={agendaActionError ?? financialActionError}
            onMarcar={marcarOcorrencia}
            onAbrirAula={(id) => {
              const row = state.agendamentos.find((item) => item.id === id);
              if (row) {
                setSelectedAgendamento(row);
                setIsAgendaOpen(true);
              }
            }}
            onAulaAvulsa={(date) => openAgendaCreate(date)}
            onNovoHorario={() => setHorarioModal({ open: true, horario: null })}
            onEditarHorario={(horario) => setHorarioModal({ open: true, horario })}
            onBaixa={markAsPaid}
            chargeLink={(alunoId) => {
              const aluno = state.rows.find((row) => row.id === alunoId);
              return aluno ? buildPrefilledWhatsAppLink(aluno, 'charge') : '';
            }}
          />
        )}
        </div>
        </div>
      </div>

      <AnimatePresence>
        <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-3xl max-h-[92vh] overflow-hidden p-0 gap-0 border border-white/10 bg-slate-900/95"
          >
            <div className="sr-only">
              <DialogTitle>Ficha completa do aluno</DialogTitle>
              <DialogDescription>
                CRM completo do aluno, com dados de cadastro, status, mensalidade e atalhos de cobrança.
              </DialogDescription>
            </div>
            {selected && (
              <DetailModal
                aluno={selected}
                agendamentos={state.agendamentos}
                faturas={state.faturas}
                initialConversionMode={openConversionForId === selected.id}
                onMarkPaid={markAsPaid}
                onClose={() => {
                  setSelected(null);
                  setOpenConversionForId(null);
                }}
                onUpdated={syncUpdatedRow}
              />
            )}
          </DialogContent>
        </Dialog>
      </AnimatePresence>

      <AnimatePresence>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent showCloseButton={false} className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0 border border-white/10 bg-slate-900/95">
            <div className="sr-only">
              <DialogTitle>Cadastrar aluno manualmente</DialogTitle>
              <DialogDescription>
                Cadastro de alunos antigos diretamente no CRM do painel administrativo.
              </DialogDescription>
            </div>
            <ManualCreateModal
              onClose={() => setIsCreateOpen(false)}
              onCreated={(row) => {
                prependCreatedRow(row);
                setIsCreateOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </AnimatePresence>

      <Dialog open={horarioModal.open} onOpenChange={(open) => !open && setHorarioModal({ open: false, horario: null })}>
        <DialogContent showCloseButton={false} className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 border border-white/10 bg-brand-surface">
          <div className="sr-only">
            <DialogTitle>{horarioModal.horario ? 'Editar horário fixo' : 'Novo horário fixo'}</DialogTitle>
            <DialogDescription>Defina os dias e o horário em que o aluno treina toda semana.</DialogDescription>
          </div>
          {horarioModal.open && (
            <HorarioFixoModal
              horario={horarioModal.horario}
              alunos={state.rows}
              today={getNowSaoPaulo().isoDate}
              onClose={() => setHorarioModal({ open: false, horario: null })}
              onSaved={(row) => {
                syncHorarioRow(row);
                setHorarioModal({ open: false, horario: null });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        <Dialog
          open={isAgendaOpen}
          onOpenChange={(open) => {
            setIsAgendaOpen(open);
            if (!open) setSelectedAgendamento(null);
          }}
        >
          <DialogContent showCloseButton={false} className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 border border-white/10 bg-slate-900/95">
            <div className="sr-only">
              <DialogTitle>{selectedAgendamento ? 'Editar aula' : 'Agendar aula'}</DialogTitle>
              <DialogDescription>
                Vincule um aluno a um horário e atualize o status da aula.
              </DialogDescription>
            </div>
            <AgendaModal
              agendamento={selectedAgendamento}
              alunos={state.rows}
              initialDate={agendaPrefillDate}
              onClose={() => {
                setIsAgendaOpen(false);
                setSelectedAgendamento(null);
              }}
              onSaved={handleAgendaSave}
            />
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </section>
  );
}

function ManualCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: AlunosRow) => void;
}) {
  const [form, setForm] = useState<ManualAlunoFormState>(EMPTY_MANUAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof ManualAlunoFormState>(key: K, value: ManualAlunoFormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const nome = form.nome.trim();
    const email = normalizeStudentEmail(form.email);
    const whatsapp = formatWhatsApp(form.whatsapp);
    const idade = ageFromBirthDate(form.data_nascimento);
    const mensalidade = parseCurrencyInput(form.mensalidade);
    const diaVencimento = parseOptionalInteger(form.dia_vencimento);

    if (nome.length < 2) {
      setError('Informe o nome completo do aluno.');
      return;
    }
    if (!email) {
      setError(STUDENT_EMAIL_ERROR);
      return;
    }
    if (!whatsapp.valid) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (!form.permuta && form.mensalidade.trim() && mensalidade === null) {
      setError('Informe uma mensalidade válida, com até duas casas decimais.');
      return;
    }
    if (idade === null || idade < 10 || idade > 100) {
      setError('Informe uma data de nascimento válida para idade entre 10 e 100 anos.');
      return;
    }
    if (!form.permuta && mensalidade !== null && mensalidade < 0) {
      setError('A mensalidade não pode ser negativa.');
      return;
    }
    if (!form.permuta && diaVencimento !== null && (diaVencimento < 1 || diaVencimento > 31)) {
      setError('O dia de vencimento deve ser um número entre 1 e 31.');
      return;
    }
    if (form.status === 'ATIVO' && !form.permuta && (mensalidade === null || mensalidade <= 0)) {
      setError('Para um aluno ativo, informe uma mensalidade maior que zero ou selecione permuta.');
      return;
    }
    if (form.status === 'ATIVO' && !form.permuta && diaVencimento === null) {
      setError('Para um aluno ativo, informe o dia de vencimento.');
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError('Supabase não está configurado neste ambiente.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isLeadRecord = isLeadStatus(form.status) || form.status === 'PERDIDO';
      const payload = {
        nome,
        email,
        whatsapp: whatsapp.formatted,
        idade,
        data_nascimento: form.data_nascimento,
        objetivo: form.objetivo.trim() || null,
        goal_details: null,
        frequency: 'cadastro-manual',
        has_injury: false,
        injury_details: null,
        rotina: null,
        preferencia: null,
        status: form.status,
        origem: 'cadastro-manual',
        whatsapp_link: buildWhatsAppLink(whatsapp.formatted) || null,
        permuta: !isLeadRecord && form.permuta,
        mensalidade: isLeadRecord || form.permuta ? null : mensalidade,
        dia_vencimento: isLeadRecord || form.permuta ? null : diaVencimento,
      };

      const { data, error: insertError } = await sb
        .from('alunos')
        .insert(payload as never)
        .select()
        .single();

      if (insertError) throw insertError;
      onCreated(data as AlunosRow);
    } catch (err) {
      const { message } = formatSupabaseError(err, 'Create aluno manual');
      setError(
        message.includes('mensalidade') || message.includes('dia_vencimento')
          ? `${message} Se o banco ainda não tiver essas colunas, rode a migração SQL do CRM antes de tentar novamente.`
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display font-black text-xl text-foreground">Cadastrar Aluno</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use este formulário para trazer alunos antigos para o CRM sem depender da ficha do site.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar cadastro de aluno"
          className="w-9 h-9 rounded-sm border border-white/20 text-slate-400 hover:text-lime-400 hover:border-lime-400 hover:bg-lime-400/10 inline-flex items-center justify-center"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" required>
            <input
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Ex.: João da Silva"
            />
          </Field>
          <Field label="WhatsApp" required>
            <input
              value={form.whatsapp}
              onChange={(e) => setField('whatsapp', formatWhatsApp(e.target.value).formatted)}
              className={INPUT_CLASS}
              placeholder="(11) 99999-9999"
            />
          </Field>
          <Field label="E-mail" className="sm:col-span-2" required>
            <input
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={STUDENT_EMAIL_MAX_LENGTH}
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className={INPUT_CLASS}
              placeholder="aluno@exemplo.com"
            />
          </Field>
          <Field label="Data de nascimento" required>
            <input type="date" required value={form.data_nascimento}
              onChange={(e) => setField('data_nascimento', e.target.value)}
              className={INPUT_CLASS} />
          </Field>
          <Field label="Objetivo">
            <input
              value={form.objetivo}
              onChange={(e) => setField('objetivo', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Opcional"
            />
          </Field>
          <label className="sm:col-span-2 flex items-start gap-3 rounded-sm border border-white/20 bg-brand-surface p-3 text-sm text-slate-200">
            <input type="checkbox" checked={form.permuta} onChange={(e) => setField('permuta', e.target.checked)} className="mt-1 accent-lime-400" />
            <span><strong>Permuta de serviços</strong><span className="mt-1 block text-xs text-slate-400">Aluno sem mensalidade ou vencimento, sem cobrança.</span></span>
          </label>
          {!form.permuta && <><Field label="Valor da Mensalidade (R$)">
            <input
              value={form.mensalidade}
              onChange={(e) => { if (isCurrencyInput(e.target.value)) setField('mensalidade', e.target.value); }}
              inputMode="decimal"
              className={INPUT_CLASS}
              placeholder={form.status === 'ATIVO' ? 'Obrigatório para aluno ativo' : 'Ex.: 299,90'}
            />
          </Field>
          <Field label="Dia do Vencimento">
            <input
              value={form.dia_vencimento}
              onChange={(e) => { if (isDueDayInput(e.target.value)) setField('dia_vencimento', e.target.value); }}
              inputMode="numeric"
              maxLength={2}
              className={INPUT_CLASS}
              placeholder={form.status === 'ATIVO' ? 'Obrigatório para aluno ativo' : '1 a 31'}
            />
          </Field></>}
          <Field label="Status" className="sm:col-span-2">
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value as AlunoStatus)}
              className={INPUT_CLASS}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {form.status !== 'ATIVO' && (
          <div className="rounded-sm border border-white/20 bg-brand-surface px-3 py-2 text-xs text-slate-300">
            Leads, negociações e perdidos ficam sem mensalidade e sem vencimento até serem convertidos em aluno ativo.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-brand-blue text-white hover:bg-brand-blue-hover border border-brand-blue"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar aluno
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-foreground">
            Cancelar
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function DetailModal({
  aluno,
  agendamentos,
  faturas,
  initialConversionMode,
  onMarkPaid,
  onClose,
  onUpdated,
}: {
  aluno: AlunosRow;
  agendamentos: AgendamentosRow[];
  faturas: FaturasRow[];
  initialConversionMode?: boolean;
  onMarkPaid: (alunoId: string) => Promise<void> | void;
  onClose: () => void;
  onUpdated: (row: AlunosRow) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    objetivo: true,
    saude: true,
    rotina: true,
    admin: false,
  });
  const [draft, setDraft] = useState<CrmDraft>({
    mensalidade: aluno.mensalidade == null ? '' : String(aluno.mensalidade).replace('.', ','),
    dia_vencimento: aluno.dia_vencimento == null ? '' : String(aluno.dia_vencimento),
    status: aluno.status,
    permuta: aluno.permuta,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conversionMode, setConversionMode] = useState(Boolean(initialConversionMode));
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      mensalidade: aluno.mensalidade == null ? '' : String(aluno.mensalidade).replace('.', ','),
      dia_vencimento: aluno.dia_vencimento == null ? '' : String(aluno.dia_vencimento),
      status: aluno.status,
      permuta: aluno.permuta,
    });
    setSaveError(null);
    setConversionMode(Boolean(initialConversionMode));
    setPayError(null);
    setPaying(false);
  }, [aluno, initialConversionMode]);

  const toggle = (key: string) =>
    setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const saveCrmFields = async (mode: 'default' | 'convert' = 'default') => {
    if (saving) return;

    const mensalidade = parseCurrencyInput(draft.mensalidade);
    const diaVencimento = parseOptionalInteger(draft.dia_vencimento);
    if (!draft.permuta && draft.mensalidade.trim() && mensalidade === null) {
      setSaveError('Informe uma mensalidade válida.');
      return;
    }
    if (!draft.permuta && diaVencimento !== null && (diaVencimento < 1 || diaVencimento > 31)) {
      setSaveError('O dia de vencimento deve ficar entre 1 e 31.');
      return;
    }
    if (mode === 'convert' && !draft.permuta && (mensalidade === null || mensalidade <= 0)) {
      setSaveError('Para converter em aluno, informe uma mensalidade maior que zero ou selecione permuta.');
      return;
    }
    if (mode === 'convert' && !draft.permuta && diaVencimento === null) {
      setSaveError('Para converter em aluno, informe o dia de vencimento.');
      return;
    }
    if (draft.status === 'ATIVO' && !draft.permuta && (mensalidade === null || mensalidade <= 0 || diaVencimento === null)) {
      setSaveError('Informe mensalidade maior que zero e vencimento, ou selecione permuta.');
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setSaveError('Supabase não está configurado.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const nextStatus = mode === 'convert' ? 'ATIVO' : draft.status;
      const isLeadRecord = isLeadStatus(nextStatus) || nextStatus === 'PERDIDO';
      const { data, error } = await sb
        .from('alunos')
        .update({
          permuta: !isLeadRecord && draft.permuta,
          mensalidade: isLeadRecord || draft.permuta ? null : mensalidade,
          dia_vencimento: isLeadRecord || draft.permuta ? null : diaVencimento,
          status: nextStatus,
        } as never)
        .eq('id', aluno.id)
        .select()
        .single();

      if (error) throw error;
      onUpdated(data as AlunosRow);
      setConversionMode(false);
    } catch (err) {
      const { message } = formatSupabaseError(err, 'Update CRM aluno');
      setSaveError(
        message.includes('mensalidade') || message.includes('dia_vencimento')
          ? `${message} Se o banco ainda não tiver essas colunas, rode a migração SQL do CRM.`
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  const row = (
    label: string,
    value: React.ReactNode,
    opts?: { Icon?: React.ComponentType<{ className?: string }>; mono?: boolean; accent?: boolean }
  ) => (
    <div className="grid grid-cols-3 gap-3 items-start py-2 border-b border-white/10/70 last:border-b-0">
      <dt className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5 pt-1">
        {opts?.Icon && <opts.Icon className="w-3.5 h-3.5 text-lime-400/80" />}
        {label}
      </dt>
      <dd className={cn('col-span-2 text-sm leading-relaxed', opts?.mono && 'font-mono tabular-nums', opts?.accent ? 'text-lime-300' : 'text-slate-200')}>
        {value}
      </dd>
    </div>
  );

  const quickAction = getQuickActionType(aluno);
  const canConvert = canConvertAluno(aluno.status);
  const showBillingFields = conversionMode || aluno.status === 'ATIVO' || aluno.status === 'INATIVO';
  const finStatus = getFinancialStatus(aluno);
  const faturasDoAluno = useMemo(
    () =>
      faturas
        .filter((item) => item.aluno_id === aluno.id)
        .sort((a, b) => {
          const byMes = monthReferenceToSortable(b.mes_referencia) - monthReferenceToSortable(a.mes_referencia);
          return byMes !== 0 ? byMes : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [aluno.id, faturas]
  );
  const agendaDoAluno = useMemo(
    () =>
      agendamentos
        .filter((item) => item.aluno_id === aluno.id)
        .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()),
    [agendamentos, aluno.id]
  );
  const proximasAulas = useMemo(() => {
    const now = Date.now();
    return agendaDoAluno.filter((item) => new Date(item.data_hora).getTime() >= now).slice(0, 6);
  }, [agendaDoAluno]);

  const handleMarkPaid = async () => {
    if (paying) return;
    setPaying(true);
    setPayError(null);
    try {
      await onMarkPaid(aluno.id);
    } catch (err) {
      const { message } = formatSupabaseError(err, 'Marcar pago');
      setPayError(message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <motion.div
      key={aluno.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-h-[92vh] overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-slate-900/98 border-b border-white/10 px-5 sm:px-6 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-brand-blue text-white flex items-center justify-center font-black text-lg">
            {aluno.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-display font-black text-lg sm:text-xl tracking-tight text-foreground truncate">
              {aluno.nome}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastrado em {formatDateTimeBR(aluno.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={cn(
              'border rounded-full text-[11px] font-bold uppercase tracking-wider',
              STATUS_COLOR[aluno.status] ?? STATUS_COLOR.ATIVO
            )}
          >
            {STATUS_LABEL[aluno.status] ?? aluno.status}
          </Badge>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar detalhes da ficha"
            className="w-9 h-9 rounded-sm border border-white/20 text-slate-400 hover:text-lime-400 hover:border-lime-400 hover:bg-lime-400/10 inline-flex items-center justify-center transition-all duration-300"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-4">
        <StudentContact key={aluno.id} aluno={aluno} onUpdated={onUpdated} />
        <Section title="CRM e cobrança" defaultOpen>
          {canConvert && !conversionMode && (
            <div className="mb-4 rounded-sm border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">Esse registro ainda está na etapa de lead.</p>
              <p className="mt-1 text-xs text-emerald-100/80">
                Quando ele fechar, clique em converter e informe a mensalidade ou selecione permuta.
              </p>
              <Button
                onClick={() => setConversionMode(true)}
                className="mt-3 bg-emerald-500 text-black hover:bg-emerald-400"
              >
                Converter em Aluno
              </Button>
            </div>
          )}

          {showBillingFields && (
            <label className="mb-4 flex items-start gap-3 rounded-sm border border-white/20 bg-brand-surface p-3 text-sm text-slate-200">
              <input type="checkbox" checked={draft.permuta} onChange={(e) => setDraft((s) => ({ ...s, permuta: e.target.checked }))} className="mt-1 accent-lime-400" />
              <span><strong>Permuta de serviços</strong><span className="mt-1 block text-xs text-slate-400">Sem mensalidade, vencimento ou cobrança. Salve para confirmar.</span></span>
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {showBillingFields && !draft.permuta && (
              <>
                <Field label="Mensalidade">
                  <input
                    value={draft.mensalidade}
                    onChange={(e) => { const value = e.target.value; if (isCurrencyInput(value)) setDraft((s) => ({ ...s, mensalidade: value })); }}
                    inputMode="decimal"
                    className={INPUT_CLASS}
                    placeholder="Ex.: 299,90"
                  />
                </Field>
                <Field label="Dia do vencimento">
                  <input
                    value={draft.dia_vencimento}
                    onChange={(e) => { const value = e.target.value; if (isDueDayInput(value)) setDraft((s) => ({ ...s, dia_vencimento: value })); }}
                    inputMode="numeric"
                    maxLength={2}
                    className={INPUT_CLASS}
                    placeholder="1 a 31"
                  />
                </Field>
              </>
            )}
            <Field label="Status" className={showBillingFields && !draft.permuta ? undefined : 'sm:col-span-3'}>
              <select
                value={draft.status}
                onChange={(e) => setDraft((s) => ({ ...s, status: e.target.value as AlunoStatus }))}
                className={INPUT_CLASS}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4 rounded-sm border border-white/10 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className={cn('border rounded-full text-[11px] font-bold uppercase tracking-wider', FIN_STATUS_CLASS[finStatus])}>
                  {FIN_STATUS_LABEL[finStatus]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Último pagamento: {aluno.ultimo_pagamento_data ? aluno.ultimo_pagamento_data : '—'}
                </span>
              </div>

              {aluno.status === 'ATIVO' && !aluno.permuta && !draft.permuta && (
                <Button
                  onClick={handleMarkPaid}
                  disabled={paying || finStatus === 'PAGO' || finStatus === 'NAO_CONFIGURADO'}
                  className="inline-flex items-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Dar baixa / Marcar pago
                </Button>
              )}
            </div>

            {payError && (
              <div className="mt-3 rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {payError}
              </div>
            )}
          </div>

          {saveError && (
            <div className="mt-3 rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {saveError}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {conversionMode ? (
              <>
                <Button
                  onClick={() => saveCrmFields('convert')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 border border-emerald-400/70"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar conversão
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConversionMode(false);
                    setSaveError(null);
                    setDraft((s) => ({ ...s, status: aluno.status }));
                  }}
                  className="border-white/20 hover:border-slate-500"
                >
                  Cancelar conversão
                </Button>
              </>
            ) : (
            <Button
              onClick={() => saveCrmFields('default')}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-brand-blue text-white hover:bg-brand-blue-hover border border-brand-blue"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar CRM
            </Button>
            )}
            {!(draft.permuta && quickAction === 'charge') && <a
              href={buildPrefilledWhatsAppLink(aluno, quickAction)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-slate-900 border border-lime-400/25 text-lime-300 hover:border-lime-400/60"
            >
              <MessageCircle className="w-4 h-4" />
              {quickAction === 'charge' ? 'Mensagem de cobrança' : 'Mensagem de boas-vindas'}
            </a>}
          </div>
        </Section>

        <Section title="Identificação" defaultOpen>
          <div className="divide-y divide-slate-800/70">
            {row('Idade', formatAgeLabel(aluno.data_nascimento ? ageFromBirthDate(aluno.data_nascimento) : aluno.idade), { Icon: Hash })}
            {row(
              'WhatsApp',
              aluno.whatsapp_link ? (
                <a
                  href={aluno.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-lime-400 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-lime-400" />
                  Abrir conversa
                </a>
              ) : (
                buildWhatsAppLink(aluno.whatsapp) || aluno.whatsapp
              ),
              { Icon: MessageCircle, mono: true }
            )}
            {row('Origem', getOrigemLabel(aluno.origem), { Icon: ArrowLeftRight })}
          </div>
        </Section>

        <Section title="Objetivo e frequência" open={expanded.objetivo} onToggle={() => toggle('objetivo')}>
          <div className="divide-y divide-slate-800/70">
            {row('Objetivo principal', aluno.objetivo || '—', { Icon: Target, accent: true })}
            {row('Detalhes do objetivo', aluno.goal_details || '— (não informado)')}
            {row('Frequência semanal', aluno.frequency || '—', { Icon: Activity })}
            {row('Preferência atendimento', aluno.preferencia || '— (não informado)')}
          </div>
        </Section>

        <Section title="Saúde e lesões" open={expanded.saude} onToggle={() => toggle('saude')}>
          <div className="divide-y divide-slate-800/70">
            {row(
              'Lesão / limitação',
              aluno.has_injury ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-red-500/15 text-red-300 border border-red-400/30 text-[11px] font-semibold">
                  <HeartPulse className="w-3.5 h-3.5" /> Sim
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                  Não
                </span>
              ),
              { Icon: HeartPulse }
            )}
            {row('Detalhes da lesão', aluno.injury_details || '— (não há)')}
          </div>
        </Section>

        <Section title="Rotina e observações" open={expanded.rotina} onToggle={() => toggle('rotina')}>
          <div className="divide-y divide-slate-800/70">
            {row('Rotina diária / semanal', aluno.rotina || '— (não informado)', { Icon: ListTodo })}
            {row('Modalidade', aluno.permuta ? 'Permuta de serviços' : 'Mensalidade')}
            {row('Mensalidade atual', aluno.permuta ? 'Sem cobrança' : formatCurrencyBR(aluno.mensalidade))}
            {row('Dia do vencimento', aluno.dia_vencimento ? `Dia ${aluno.dia_vencimento}` : '—')}
          </div>
        </Section>

        <Section title="Histórico de pagamentos" defaultOpen>
          {faturasDoAluno.length === 0 ? (
            <div className="rounded-sm border border-dashed border-white/20 px-3 py-5 text-sm text-slate-500">
              Nenhuma fatura registrada para este aluno ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {faturasDoAluno.map((fatura) => (
                <div
                  key={fatura.id}
                  className="rounded-sm border border-white/10/70 bg-slate-950/40 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Mês {formatMonthReference(fatura.mes_referencia)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Valor: {formatCurrencyBR(fatura.valor)} · Vencimento: {formatDateBR(fatura.data_vencimento)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Pago em: {formatDateTimeBR(fatura.data_pagamento)}
                      </p>
                      {fatura.observacao && <p className="mt-2 text-sm text-slate-400">{fatura.observacao}</p>}
                    </div>
                    <Badge
                      className={cn(
                        'border rounded-full text-[10px] font-bold uppercase tracking-wider self-start',
                        fatura.status === 'PAID'
                          ? 'bg-emerald-400/15 text-emerald-200 border-emerald-400/35'
                          : 'bg-amber-400/15 text-amber-200 border-amber-400/35'
                      )}
                    >
                      {fatura.status === 'PAID' ? 'Pago' : fatura.status === 'OVERDUE' ? 'Atrasado' : fatura.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Agenda do aluno" defaultOpen>
          {agendaDoAluno.length === 0 ? (
            <div className="rounded-sm border border-dashed border-white/20 px-3 py-5 text-sm text-slate-500">
              Nenhuma aula vinculada para este aluno ainda.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-sm border border-white/10/70 bg-slate-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Próximas aulas</p>
                <div className="mt-3 space-y-2">
                  {proximasAulas.length === 0 ? (
                    <p className="text-sm text-slate-500">Não há próximas aulas agendadas no momento.</p>
                  ) : (
                    proximasAulas.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatDateBR(item.data_hora)} às {formatTimeBR(item.data_hora)}
                          </p>
                          {item.observacoes && <p className="text-xs text-slate-500">{item.observacoes}</p>}
                        </div>
                        <Badge className={cn('border rounded-full text-[10px] font-bold uppercase tracking-wider', AGENDA_STATUS_COLOR[item.status])}>
                          {AGENDA_STATUS_LABEL[item.status]}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-sm border border-white/10/70 bg-slate-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-400">Histórico recente</p>
                <div className="mt-3 space-y-2">
                  {agendaDoAluno.slice(-6).reverse().map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatDateBR(item.data_hora)} às {formatTimeBR(item.data_hora)}
                        </p>
                        {item.observacoes && <p className="text-xs text-slate-500">{item.observacoes}</p>}
                      </div>
                      <Badge className={cn('border rounded-full text-[10px] font-bold uppercase tracking-wider', AGENDA_STATUS_COLOR[item.status])}>
                        {AGENDA_STATUS_LABEL[item.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section title="Dados internos" open={expanded.admin} onToggle={() => toggle('admin')}>
          <div className="divide-y divide-slate-800/70">
            {row('ID do banco', aluno.id, { Icon: FileSpreadsheet, mono: true })}
            {row('Atualizado em', formatDateTimeBR(aluno.updated_at), { Icon: CalendarDays, mono: true })}
            {row(
              'Link WhatsApp (raw)',
              <a
                href={aluno.whatsapp_link || buildWhatsAppLink(aluno.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-lime-400 transition-colors break-all"
              >
                {aluno.whatsapp_link || buildWhatsAppLink(aluno.whatsapp)}
              </a>,
              { mono: true }
            )}
          </div>
        </Section>

        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <a
            href={aluno.whatsapp_link || buildWhatsAppLink(aluno.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-brand-blue text-white hover:bg-brand-blue-hover border border-brand-blue font-bold tracking-wide uppercase text-sm transition-all duration-300"
          >
            <MessageCircle className="w-4 h-4" />
            Abrir WhatsApp
          </a>
          <Button
            variant="outline"
            onClick={() => {
              const header = ['Campo', 'Valor'];
              const rows = [
                ['Nome', aluno.nome],
                ['WhatsApp', aluno.whatsapp],
                ['Idade', (aluno.data_nascimento ? ageFromBirthDate(aluno.data_nascimento) : aluno.idade)?.toString() ?? ''],
                ['Objetivo', aluno.objetivo ?? ''],
                ['Status', STATUS_LABEL[aluno.status] ?? aluno.status],
                ['Origem', aluno.origem ?? ''],
                ['Mensalidade', aluno.mensalidade == null ? '' : String(aluno.mensalidade)],
                ['Dia do vencimento', aluno.dia_vencimento == null ? '' : String(aluno.dia_vencimento)],
                ['Criado em', aluno.created_at ?? ''],
              ];
              const csv = buildSheetCSV([header, ...rows]);
              downloadCSV(csv, `crm-${aluno.nome.toLowerCase().replace(/\s+/g, '-').slice(0, 32)}.csv`);
            }}
            className="inline-flex items-center gap-2 border-white/20 hover:border-lime-400 hover:text-lime-400 transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Exportar ficha
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-foreground transition-colors"
          >
            Fechar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function AgendaModal({
  agendamento,
  alunos,
  initialDate,
  onClose,
  onSaved,
}: {
  agendamento: AgendamentosRow | null;
  alunos: AlunosRow[];
  initialDate: string;
  onClose: () => void;
  onSaved: (row: AgendamentosRow) => void;
}) {
  const [form, setForm] = useState<AgendaFormState>(EMPTY_AGENDA_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alunosSelecionaveis = useMemo(
    () =>
      [...alunos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).filter((aluno) => aluno.status !== 'PERDIDO'),
    [alunos]
  );

  useEffect(() => {
    if (agendamento) {
      const { date, time } = formatAgendaDateTime(agendamento.data_hora);
      setForm({
        aluno_id: agendamento.aluno_id,
        data: date,
        hora: time || '08:00',
        status: agendamento.status,
        observacoes: agendamento.observacoes ?? '',
      });
      return;
    }
    setForm({
      ...EMPTY_AGENDA_FORM,
      data: initialDate,
    });
    setError(null);
  }, [agendamento, initialDate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!form.aluno_id) {
      setError('Selecione um aluno para o agendamento.');
      return;
    }
    if (!form.data) {
      setError('Informe a data da aula.');
      return;
    }
    if (!form.hora) {
      setError('Informe o horário da aula.');
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError('Supabase não está configurado neste ambiente.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        aluno_id: form.aluno_id,
        data_hora: toAgendaDateTime(form.data, form.hora),
        status: form.status,
        observacoes: form.observacoes.trim() || null,
      };

      const query = agendamento
        ? sb.from('agendamentos').update(payload as never).eq('id', agendamento.id)
        : sb.from('agendamentos').insert(payload as never);

      const { data, error } = await query.select().single();
      if (error) throw error;
      onSaved(data as AgendamentosRow);
    } catch (err) {
      const { message } = formatSupabaseError(err, agendamento ? 'Atualizar aula' : 'Criar aula');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display font-black text-xl text-foreground">
            {agendamento ? 'Editar Aula' : 'Agendar Aula'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vincule o aluno a um horário e registre o status da aula direto no CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar agendamento"
          className="w-9 h-9 rounded-sm border border-white/20 text-slate-400 hover:text-lime-400 hover:border-lime-400 hover:bg-lime-400/10 inline-flex items-center justify-center"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Aluno" required>
          <select
            value={form.aluno_id}
            onChange={(e) => setForm((s) => ({ ...s, aluno_id: e.target.value }))}
            className={INPUT_CLASS}
          >
            <option value="">Selecione...</option>
            {alunosSelecionaveis.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome} · {STATUS_LABEL[aluno.status]}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Data" required>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm((s) => ({ ...s, data: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Hora" required>
            <input
              type="time"
              value={form.hora}
              onChange={(e) => setForm((s) => ({ ...s, hora: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as AgendamentoStatus }))}
              className={INPUT_CLASS}
            >
              {(['AGENDADO', 'CONCLUIDO', 'FALTOU', 'CANCELADO'] as AgendamentoStatus[]).map((status) => (
                <option key={status} value={status}>
                  {AGENDA_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Observações">
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))}
            className={cn(INPUT_CLASS, 'min-h-[110px] resize-y')}
            placeholder="Ex.: treino experimental, remarcado, foco em membros inferiores..."
          />
        </Field>

        {error && (
          <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 border border-emerald-400/70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {agendamento ? 'Salvar aula' : 'Criar aula'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-foreground">
            Cancelar
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

const INPUT_CLASS =
  'w-full rounded-sm bg-brand-bg border border-white/20 px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:border-lime-400 transition-all duration-300';

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest font-bold text-slate-400">
        {label} {required ? <span className="text-red-400">*</span> : null}
      </span>
      {children}
    </label>
  );
}

// =============================================================================
// Subcomponente: seção colapsável
// =============================================================================

function Section({
  title,
  defaultOpen,
  open,
  onToggle,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  const [inner, setInner] = useState(Boolean(defaultOpen));
  const isOpen = typeof open === 'boolean' ? open : inner;
  const toggle = () => {
    onToggle?.();
    setInner((v) => !v);
  };
  return (
    <div className="rounded-sm border border-white/10 bg-slate-900/40 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-800/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400"
      >
        <span className="font-display font-bold text-sm tracking-wide text-slate-100">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
