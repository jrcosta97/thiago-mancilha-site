import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  UserCircle,
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
  type AgendamentoStatus,
} from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { buildSheetCSV, buildWhatsAppLink, downloadCSV, formatWhatsApp } from '@/services/sheet-sync';

const PAGE_SIZE = 10;
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
const AGENDA_HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

type MainAdminTab = 'CRM' | 'AGENDA';

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
  page: number;
  searchTerm: string;
  loading: boolean;
  error: string | null;
  initialLoad: boolean;
}

interface ManualAlunoFormState {
  nome: string;
  whatsapp: string;
  idade: string;
  objetivo: string;
  mensalidade: string;
  dia_vencimento: string;
  status: AlunoStatus;
}

interface CrmDraft {
  mensalidade: string;
  dia_vencimento: string;
  status: AlunoStatus;
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

type FinancialStatus = 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'NAO_APLICAVEL';

const FIN_STATUS_LABEL: Record<FinancialStatus, string> = {
  PAGO: 'Pago',
  PENDENTE: 'Pendente',
  ATRASADO: 'Atrasado',
  NAO_APLICAVEL: '—',
};

const FIN_STATUS_CLASS: Record<FinancialStatus, string> = {
  PAGO: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/35',
  PENDENTE: 'bg-amber-400/15 text-amber-200 border-amber-400/35',
  ATRASADO: 'bg-rose-400/15 text-rose-200 border-rose-400/35',
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
  whatsapp: '',
  idade: '',
  objetivo: '',
  mensalidade: '',
  dia_vencimento: '',
  status: 'ATIVO',
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

const formatCurrencyBR = (value: number | null | undefined): string =>
  value == null
    ? '—'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);

const parseCurrencyInput = (value: string): number | null => {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

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
  return `${String(now.month).padStart(2, '0')}/${now.year}`;
};

const getDueDateForCurrentMonth = (diaVencimento: number | null | undefined): string | null => {
  if (!diaVencimento || !Number.isInteger(diaVencimento)) return null;
  const now = getNowSaoPaulo();
  const lastDay = new Date(now.year, now.month, 0).getDate();
  const safeDay = Math.max(1, Math.min(diaVencimento, lastDay));
  return `${now.year}-${String(now.month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
};

const parseIsoDateParts = (value: string): { year: number; month: number; day: number } | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

const formatMonthReference = (value: string): string => value || '—';

const getWeekStart = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toISODateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFinancialStatus = (aluno: AlunosRow): FinancialStatus => {
  if (aluno.status !== 'ATIVO') return 'NAO_APLICAVEL';
  if (!aluno.dia_vencimento || !Number.isInteger(aluno.dia_vencimento)) return 'NAO_APLICAVEL';

  const now = getNowSaoPaulo();
  const ultimo = aluno.ultimo_pagamento_data ? parseIsoDateParts(aluno.ultimo_pagamento_data) : null;

  if (ultimo && ultimo.year === now.year && ultimo.month === now.month) return 'PAGO';
  return now.day > aluno.dia_vencimento ? 'ATRASADO' : 'PENDENTE';
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
      ? `Olá, ${nome}! Passando para lembrar da mensalidade${aluno.mensalidade != null ? ` no valor de ${formatCurrencyBR(aluno.mensalidade)}` : ''}${aluno.dia_vencimento ? ` com vencimento no dia ${aluno.dia_vencimento}` : ''}.\n\nChave PIX: [COLE_AQUI_A_CHAVE_PIX_DO_THIAGO]\n\nQualquer dúvida, me chama por aqui.`
      : `Olá, ${nome}! Seja bem-vindo(a). Recebi seu cadastro e quero te ajudar a organizar seus próximos passos. Me responde por aqui para alinharmos o atendimento.`;
  return `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;
};

const getQuickActionType = (aluno: AlunosRow): 'welcome' | 'charge' =>
  isLeadStatus(aluno.status) ? 'welcome' : 'charge';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState>({
    rows: [],
    agendamentos: [],
    faturas: [],
    page: 1,
    searchTerm: '',
    loading: true,
    error: null,
    initialLoad: true,
  });
  const [selected, setSelected] = useState<AlunosRow | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<DashboardFilter>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openConversionForId, setOpenConversionForId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainAdminTab>('CRM');
  const [agendaWeekStart, setAgendaWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [agendaView, setAgendaView] = useState<'SEMANA' | 'DIA'>('SEMANA');
  const [agendaSelectedDate, setAgendaSelectedDate] = useState<string>(() => toISODateLocal(new Date()));
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentosRow | null>(null);

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
      const [alunosRes, agendamentosRes, faturasRes] = await Promise.all([
        sb.from('alunos').select('*').order('created_at', { ascending: false }),
        sb.from('agendamentos').select('*').order('data_hora', { ascending: true }),
        sb.from('faturas').select('*').order('created_at', { ascending: false }),
      ]);

      if (alunosRes.error) throw alunosRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;
      if (faturasRes.error) throw faturasRes.error;

      setState((s) => ({
        ...s,
        rows: (alunosRes.data ?? []) as AlunosRow[],
        agendamentos: (agendamentosRes.data ?? []) as AgendamentosRow[],
        faturas: (faturasRes.data ?? []) as FaturasRow[],
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

  const tabCounts = useMemo(() => {
    return FILTER_TABS.reduce<Record<DashboardFilter, number>>((acc, tab) => {
      acc[tab.key] = state.rows.filter((row) => matchesFilter(row, tab.key)).length;
      return acc;
    }, { ALL: 0, LEADS: 0, ATIVOS: 0, INATIVOS_PERDIDOS: 0 });
  }, [state.rows]);

  const metricCards = useMemo<MetricCardData[]>(() => {
    const leads = state.rows.filter((row) => isLeadStatus(row.status)).length;
    const ativos = state.rows.filter((row) => row.status === 'ATIVO');
    const faturamento = ativos.reduce((sum, row) => sum + (row.mensalidade ?? 0), 0);
    const inativosPerdidos = state.rows.filter((row) => row.status === 'INATIVO' || row.status === 'PERDIDO').length;
    const atrasados = ativos.filter((row) => getFinancialStatus(row) === 'ATRASADO').length;

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
        label: 'Faturamento mensal',
        value: formatCurrencyBR(faturamento),
        helper: 'A soma considera apenas registros com status ativo.',
      },
      {
        label: 'Atrasados / vencidos',
        value: atrasados.toLocaleString('pt-BR'),
        helper: 'Apenas alunos ativos com pagamento atrasado no mês atual.',
      },
    ];
  }, [state.rows]);

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

  const markAsPaid = useCallback(
    async (alunoId: string) => {
      const sb = getSupabase();
      if (!sb) return;
      const aluno = state.rows.find((row) => row.id === alunoId);
      if (!aluno || aluno.status !== 'ATIVO') return;
      const now = getNowSaoPaulo();
      const mesReferencia = getCurrentMonthReference();
      const [alunoRes, faturaRes] = await Promise.all([
        sb
        .from('alunos')
        .update({ ultimo_pagamento_data: now.isoDate } as never)
        .eq('id', alunoId)
        .select()
          .single(),
        sb
          .from('faturas')
          .upsert(
            {
              aluno_id: alunoId,
              mes_referencia: mesReferencia,
              valor: aluno.mensalidade ?? 0,
              data_vencimento: getDueDateForCurrentMonth(aluno.dia_vencimento),
              data_pagamento: `${now.isoDate}T12:00:00-03:00`,
              status: 'PAGO',
              observacao: 'Baixa lançada manualmente no CRM',
            } as never,
            { onConflict: 'aluno_id,mes_referencia' }
          )
          .select()
          .single(),
      ]);
      if (alunoRes.error) throw alunoRes.error;
      if (faturaRes.error) throw faturaRes.error;
      if (alunoRes.data) syncUpdatedRow(alunoRes.data as AlunosRow);
      if (faturaRes.data) syncFaturaRow(faturaRes.data as FaturasRow);
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

  const agendaDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(agendaWeekStart, index)),
    [agendaWeekStart]
  );

  const agendamentosByDate = useMemo(() => {
    const map = new Map<string, AgendamentosRow[]>();
    for (const item of state.agendamentos) {
      const key = item.data_hora.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    }
    return map;
  }, [state.agendamentos]);

  const selectedAgendaRows = useMemo(
    () => agendamentosByDate.get(agendaSelectedDate) ?? [],
    [agendaSelectedDate, agendamentosByDate]
  );

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
      r.idade == null ? '' : String(r.idade),
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
    <section className="min-h-screen w-full bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-[620px] h-[620px] bg-lime-400/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 right-0 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime-400 transition-colors rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-lime-400 text-black hover:bg-lime-300 border border-lime-400/70"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Aluno
            </Button>
            {mainTab === 'AGENDA' && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAgendamento(null);
                  setIsAgendaOpen(true);
                }}
                className="inline-flex items-center gap-2 border-emerald-500/50 text-emerald-300 hover:border-emerald-400 hover:text-emerald-200"
              >
                <CalendarDays className="w-4 h-4" />
                Agendar Aula
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => loadDashboardData()}
              disabled={state.loading || !supabaseOk}
              className="inline-flex items-center gap-2 border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background"
            >
              <RefreshCcw className={cn('w-4 h-4', state.loading && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={exportCurrentToCSV}
              disabled={mainTab !== 'CRM' || currentRows.length === 0}
              className="inline-flex items-center gap-2 border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background"
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

        <div className="mb-5 flex flex-wrap gap-2">
          {([
            { key: 'CRM', label: 'CRM' },
            { key: 'AGENDA', label: 'Agenda' },
          ] as const).map((tab) => {
            const active = mainTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMainTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                  active
                    ? 'border-lime-400/60 bg-lime-400/10 text-lime-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-lime-400/40 hover:text-lime-300'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-foreground">
              {mainTab === 'CRM' ? 'CRM de Gestão de Alunos' : 'Agenda de Aulas'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mainTab === 'CRM'
                ? `Leads do site e alunos antigos centralizados em um só painel — ${total.toLocaleString('pt-BR')} registro(s) nesta visualização`
                : `Visualize os treinos da semana e atualize presença em um só lugar — ${state.agendamentos.length.toLocaleString('pt-BR')} aula(s) carregada(s)`}
            </p>
          </div>
          <div className={cn('w-full', mainTab === 'CRM' ? 'sm:max-w-md' : 'sm:max-w-lg')}>
            <label htmlFor="q" className="block text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">
              {mainTab === 'CRM' ? 'Buscar aluno' : 'Buscar aluno na agenda'}
            </label>
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="q"
                type="search"
                value={state.searchTerm}
                placeholder={mainTab === 'CRM' ? 'Nome, WhatsApp, objetivo, origem...' : 'Filtre aulas por nome do aluno...'}
                onChange={(e) => setState((s) => ({ ...s, page: 1, searchTerm: e.target.value }))}
                className={cn(
                  'w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-foreground placeholder:text-slate-500',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 focus-visible:border-lime-400 transition-all duration-300'
                )}
              />
            </div>
          </div>
        </div>

        {!state.initialLoad && mainTab === 'CRM' && (
          <div className="mb-5 grid gap-3 md:grid-cols-4">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-4"
              >
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400">{card.label}</p>
                <p className="mt-2 font-display text-2xl font-black tracking-tight text-foreground">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
              </div>
            ))}
          </div>
        )}

        {!supabaseOk && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex gap-4 items-start mb-6">
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
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
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
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-12 flex flex-col items-center justify-center gap-3">
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
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-300',
                    active
                      ? 'border-lime-400/60 bg-lime-400/10 text-lime-300'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-lime-400/40 hover:text-lime-300'
                  )}
                >
                  <span className="font-semibold">{tab.label}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', active ? 'bg-lime-400/15' : 'bg-slate-800')}>
                    {tabCounts[tab.key].toLocaleString('pt-BR')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!state.initialLoad && !state.loading && mainTab === 'CRM' && currentRows.length === 0 && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-center text-muted-foreground">
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
                  className="inline-flex items-center gap-2 border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  Limpar busca
                </Button>
              )}
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 bg-lime-400 text-black hover:bg-lime-300 border border-lime-400/70"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Aluno
              </Button>
            </div>
          </div>
        )}

        {!state.initialLoad && mainTab === 'CRM' && currentRows.length > 0 && (
          <>
            <div className="hidden md:block rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <th className="px-4 py-3 font-bold">Data</th>
                      <th className="px-4 py-3 font-bold">Aluno</th>
                      <th className="px-4 py-3 font-bold">WhatsApp</th>
                      <th className="px-4 py-3 font-bold">Objetivo</th>
                      <th className="px-4 py-3 font-bold">Mensalidade</th>
                      <th className="px-4 py-3 font-bold">Venc.</th>
                      <th className="px-4 py-3 font-bold">Financeiro</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold pr-5">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((aluno, idx) => {
                      const quickAction = getQuickActionType(aluno);
                      const quickLabel = quickAction === 'charge' ? 'Cobrar' : 'Boas-vindas';
                      const finStatus = getFinancialStatus(aluno);
                      return (
                        <tr
                          key={aluno.id}
                          className={cn(
                            'border-b border-slate-800/80 last:border-b-0 hover:bg-slate-800/40 transition-colors group',
                            idx % 2 === 1 && 'bg-slate-950/30'
                          )}
                        >
                          <td className="px-4 py-3 align-middle whitespace-nowrap text-xs text-slate-400 font-mono">
                            {formatDateTimeBR(aluno.created_at)}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <p className="font-semibold text-foreground leading-tight text-sm">{aluno.nome}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-slate-500">{formatAgeLabel(aluno.idade)}</span>
                              <span className="text-[11px] text-slate-500">• {getOrigemLabel(aluno.origem)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <a
                              href={aluno.whatsapp_link || buildWhatsAppLink(aluno.whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-lime-400 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 text-lime-400/80" />
                              <span className="font-mono tabular-nums">{aluno.whatsapp}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3 align-middle text-sm text-slate-200">
                            {aluno.objetivo || '—'}
                          </td>
                          <td className="px-4 py-3 align-middle text-sm text-slate-200 font-medium">
                            {formatCurrencyBR(aluno.mensalidade)}
                          </td>
                          <td className="px-4 py-3 align-middle text-sm text-slate-300">
                            {aluno.dia_vencimento ? `Dia ${aluno.dia_vencimento}` : '—'}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <Badge
                              className={cn(
                                'border rounded-full text-[11px] font-bold uppercase tracking-wider',
                                FIN_STATUS_CLASS[finStatus]
                              )}
                            >
                              {FIN_STATUS_LABEL[finStatus]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <Badge
                              className={cn(
                                'border rounded-full text-[11px] font-bold uppercase tracking-wider',
                                STATUS_COLOR[aluno.status] ?? STATUS_COLOR.ATIVO
                              )}
                            >
                              {STATUS_LABEL[aluno.status] ?? aluno.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 align-middle text-right pr-5">
                            <div className="flex items-center justify-end gap-2">
                              {canConvertAluno(aluno.status) && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setOpenConversionForId(aluno.id);
                                    setSelected(aluno);
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-emerald-500 text-black hover:bg-emerald-400"
                                >
                                  Converter em Aluno
                                </Button>
                              )}
                              {aluno.status === 'ATIVO' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsPaid(aluno.id)}
                                  disabled={finStatus === 'PAGO'}
                                  className="inline-flex items-center gap-2 border-slate-700 hover:border-emerald-400 hover:text-emerald-300"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  {finStatus === 'PAGO' ? 'Pago' : 'Marcar pago'}
                                </Button>
                              )}
                              <a
                                href={buildPrefilledWhatsAppLink(aluno, quickAction)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-lime-400/25 bg-lime-400/10 px-2.5 text-[11px] font-semibold text-lime-300 hover:border-lime-400/60"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                {quickLabel}
                              </a>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelected(aluno)}
                                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-lime-400 hover:bg-lime-400/10 focus-visible:ring-offset-2 focus-visible:ring-lime-400"
                              >
                                <ListTodo className="w-4 h-4" />
                                Detalhes
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {currentRows.map((aluno) => {
                const quickAction = getQuickActionType(aluno);
                const finStatus = getFinancialStatus(aluno);
                return (
                  <div
                    key={aluno.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-foreground leading-tight">{aluno.nome}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatDateTimeBR(aluno.created_at)}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'border rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                          STATUS_COLOR[aluno.status] ?? STATUS_COLOR.ATIVO
                        )}
                      >
                        {STATUS_LABEL[aluno.status] ?? aluno.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <p><span className="text-slate-500">Origem:</span> {getOrigemLabel(aluno.origem)}</p>
                      <p><span className="text-slate-500">Idade:</span> {formatAgeLabel(aluno.idade)}</p>
                      <p className="col-span-2 font-mono"><span className="text-slate-500">WhatsApp:</span> {aluno.whatsapp}</p>
                      <p><span className="text-slate-500">Mensalidade:</span> {formatCurrencyBR(aluno.mensalidade)}</p>
                      <p><span className="text-slate-500">Venc.:</span> {aluno.dia_vencimento ? `Dia ${aluno.dia_vencimento}` : '—'}</p>
                      <p className="col-span-2">
                        <span className="text-slate-500">Financeiro:</span>{' '}
                        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', FIN_STATUS_CLASS[finStatus])}>
                          {FIN_STATUS_LABEL[finStatus]}
                        </span>
                      </p>
                      <p className="col-span-2"><span className="text-slate-500">Objetivo:</span> {aluno.objetivo || '—'}</p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {canConvertAluno(aluno.status) && (
                        <Button
                          onClick={() => {
                            setOpenConversionForId(aluno.id);
                            setSelected(aluno);
                          }}
                          className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
                        >
                          Converter em Aluno
                        </Button>
                      )}
                      {aluno.status === 'ATIVO' && (
                        <Button
                          variant="outline"
                          onClick={() => markAsPaid(aluno.id)}
                          disabled={finStatus === 'PAGO'}
                          className="w-full border-slate-700 hover:border-emerald-400 hover:text-emerald-300"
                        >
                          <span className="inline-flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            {finStatus === 'PAGO' ? 'Pago' : 'Marcar pago'}
                          </span>
                        </Button>
                      )}
                      <div className="flex items-center gap-2">
                      <a
                        href={buildPrefilledWhatsAppLink(aluno, quickAction)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-lime-400/25 bg-lime-400/10 px-3 py-2 text-xs font-semibold text-lime-300"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {quickAction === 'charge' ? 'Cobrar' : 'Boas-vindas'}
                      </a>
                      <Button
                        variant="outline"
                        onClick={() => setSelected(aluno)}
                        className="flex-1 border-slate-700 hover:border-lime-400 hover:text-lime-400"
                      >
                        Detalhes
                      </Button>
                      </div>
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
                  className="border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs tabular-nums text-slate-300">
                  Página <span className="font-bold text-lime-400">{state.page}</span> / {pageCount}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState((s) => ({ ...s, page: Math.min(pageCount, s.page + 1) }))}
                  disabled={state.page >= pageCount || state.loading}
                  className="border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 disabled:opacity-50"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-hidden p-0 gap-0 border border-slate-800/80 bg-slate-900/95 backdrop-blur-xl">
            <div className="sr-only">
              <DialogTitle>Ficha completa do aluno</DialogTitle>
              <DialogDescription>
                CRM completo do aluno, com dados de cadastro, status, mensalidade e atalhos de cobrança.
              </DialogDescription>
            </div>
            {selected && (
              <DetailModal
                aluno={selected}
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
          <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0 border border-slate-800/80 bg-slate-900/95 backdrop-blur-xl">
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
    const whatsapp = formatWhatsApp(form.whatsapp);
    const idade = parseOptionalInteger(form.idade);
    const mensalidade = parseCurrencyInput(form.mensalidade);
    const diaVencimento = parseOptionalInteger(form.dia_vencimento);

    if (nome.length < 2) {
      setError('Informe o nome completo do aluno.');
      return;
    }
    if (!whatsapp.valid) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (idade !== null && (idade < 10 || idade > 100)) {
      setError('A idade, quando informada, deve ficar entre 10 e 100.');
      return;
    }
    if (mensalidade !== null && mensalidade < 0) {
      setError('A mensalidade não pode ser negativa.');
      return;
    }
    if (diaVencimento !== null && (diaVencimento < 1 || diaVencimento > 31)) {
      setError('O dia de vencimento deve ser um número entre 1 e 31.');
      return;
    }
    if (form.status === 'ATIVO' && mensalidade === null) {
      setError('Para um aluno ativo, informe o valor da mensalidade.');
      return;
    }
    if (form.status === 'ATIVO' && diaVencimento === null) {
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
        whatsapp: whatsapp.formatted,
        idade,
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
        mensalidade: isLeadRecord ? null : mensalidade,
        dia_vencimento: isLeadRecord ? null : diaVencimento,
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
          className="w-9 h-9 rounded-xl border border-slate-700/80 text-slate-400 hover:text-lime-400 hover:border-lime-400 hover:bg-lime-400/10 inline-flex items-center justify-center"
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
          <Field label="Idade">
            <input
              value={form.idade}
              onChange={(e) => setField('idade', e.target.value.replace(/[^\d]/g, ''))}
              className={INPUT_CLASS}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Objetivo">
            <input
              value={form.objetivo}
              onChange={(e) => setField('objetivo', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Valor da Mensalidade (R$)">
            <input
              value={form.mensalidade}
              onChange={(e) => setField('mensalidade', e.target.value)}
              className={INPUT_CLASS}
              placeholder={form.status === 'ATIVO' ? 'Obrigatório para aluno ativo' : 'Ex.: 299,90'}
            />
          </Field>
          <Field label="Dia do Vencimento">
            <input
              value={form.dia_vencimento}
              onChange={(e) => setField('dia_vencimento', e.target.value.replace(/[^\d]/g, ''))}
              className={INPUT_CLASS}
              placeholder={form.status === 'ATIVO' ? 'Obrigatório para aluno ativo' : '1 a 31'}
            />
          </Field>
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
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        {form.status !== 'ATIVO' && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
            Leads, negociações e perdidos ficam sem mensalidade e sem vencimento até serem convertidos em aluno ativo.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-lime-400 text-black hover:bg-lime-300 border border-lime-400/70"
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
  initialConversionMode,
  onMarkPaid,
  onClose,
  onUpdated,
}: {
  aluno: AlunosRow;
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
    if (draft.mensalidade.trim() && mensalidade === null) {
      setSaveError('Informe uma mensalidade válida.');
      return;
    }
    if (diaVencimento !== null && (diaVencimento < 1 || diaVencimento > 31)) {
      setSaveError('O dia de vencimento deve ficar entre 1 e 31.');
      return;
    }
    if (mode === 'convert' && mensalidade === null) {
      setSaveError('Para converter em aluno, informe a mensalidade.');
      return;
    }
    if (mode === 'convert' && diaVencimento === null) {
      setSaveError('Para converter em aluno, informe o dia de vencimento.');
      return;
    }
    if (draft.status === 'ATIVO' && (mensalidade === null || diaVencimento === null)) {
      setSaveError('Aluno ativo precisa ter mensalidade e dia de vencimento.');
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
          mensalidade: isLeadRecord ? null : mensalidade,
          dia_vencimento: isLeadRecord ? null : diaVencimento,
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
    <div className="grid grid-cols-3 gap-3 items-start py-2 border-b border-slate-800/70 last:border-b-0">
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
      <div className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur-md border-b border-slate-800/80 px-5 sm:px-6 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-black flex items-center justify-center font-black text-lg shadow-[0_0_30px_rgba(132,204,22,0.25)]">
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
            className="w-9 h-9 rounded-xl border border-slate-700/80 text-slate-400 hover:text-lime-400 hover:border-lime-400 hover:bg-lime-400/10 inline-flex items-center justify-center transition-all duration-300"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-4">
        <Section title="CRM e cobrança" defaultOpen>
          {canConvert && !conversionMode && (
            <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-200">Esse registro ainda está na etapa de lead.</p>
              <p className="mt-1 text-xs text-emerald-100/80">
                Quando ele fechar, clique em converter e informe mensalidade + vencimento para virar aluno ativo.
              </p>
              <Button
                onClick={() => setConversionMode(true)}
                className="mt-3 bg-emerald-500 text-black hover:bg-emerald-400"
              >
                Converter em Aluno
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {showBillingFields && (
              <>
                <Field label="Mensalidade">
                  <input
                    value={draft.mensalidade}
                    onChange={(e) => setDraft((s) => ({ ...s, mensalidade: e.target.value }))}
                    className={INPUT_CLASS}
                    placeholder="Ex.: 299,90"
                  />
                </Field>
                <Field label="Dia do vencimento">
                  <input
                    value={draft.dia_vencimento}
                    onChange={(e) => setDraft((s) => ({ ...s, dia_vencimento: e.target.value.replace(/[^\d]/g, '') }))}
                    className={INPUT_CLASS}
                    placeholder="1 a 31"
                  />
                </Field>
              </>
            )}
            <Field label="Status" className={showBillingFields ? undefined : 'sm:col-span-3'}>
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

          <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className={cn('border rounded-full text-[11px] font-bold uppercase tracking-wider', FIN_STATUS_CLASS[finStatus])}>
                  {FIN_STATUS_LABEL[finStatus]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Último pagamento: {aluno.ultimo_pagamento_data ? aluno.ultimo_pagamento_data : '—'}
                </span>
              </div>

              {aluno.status === 'ATIVO' && (
                <Button
                  onClick={handleMarkPaid}
                  disabled={paying || finStatus === 'PAGO'}
                  className="inline-flex items-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Dar baixa / Marcar pago
                </Button>
              )}
            </div>

            {payError && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {payError}
              </div>
            )}
          </div>

          {saveError && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
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
                  className="border-slate-700 hover:border-slate-500"
                >
                  Cancelar conversão
                </Button>
              </>
            ) : (
            <Button
              onClick={() => saveCrmFields('default')}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-lime-400 text-black hover:bg-lime-300 border border-lime-400/70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar CRM
            </Button>
            )}
            <a
              href={buildPrefilledWhatsAppLink(aluno, quickAction)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-lime-400/25 text-lime-300 hover:border-lime-400/60"
            >
              <MessageCircle className="w-4 h-4" />
              {quickAction === 'charge' ? 'Mensagem de cobrança' : 'Mensagem de boas-vindas'}
            </a>
          </div>
        </Section>

        <Section title="Identificação" defaultOpen>
          <div className="divide-y divide-slate-800/70">
            {row('Nome', aluno.nome, { Icon: UserCircle, accent: true })}
            {row('Idade', formatAgeLabel(aluno.idade), { Icon: Hash })}
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
            {row('Mensalidade atual', formatCurrencyBR(aluno.mensalidade))}
            {row('Dia do vencimento', aluno.dia_vencimento ? `Dia ${aluno.dia_vencimento}` : '—')}
          </div>
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 text-black hover:bg-lime-300 border border-lime-400/70 font-bold tracking-wide uppercase text-sm transition-all duration-300"
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
                ['Idade', aluno.idade == null ? '' : `${aluno.idade}`],
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
            className="inline-flex items-center gap-2 border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300"
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

const INPUT_CLASS =
  'w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:border-lime-400 transition-all duration-300';

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
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
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
