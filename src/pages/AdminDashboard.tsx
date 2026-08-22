import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { buildSheetCSV, buildWhatsAppLink, downloadCSV } from '@/services/sheet-sync';

const PAGE_SIZE = 10;
const AUTO_REFRESH_MS = 5 * 60 * 1000;

const STATUS_COLOR: Record<AlunoStatus, string> = {
  ACTIVE: 'bg-lime-400/15 text-lime-300 border-lime-400/40',
  ARCHIVED: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
  CONTACTED: 'bg-sky-400/15 text-sky-300 border-sky-400/40',
  CONVERTED: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40',
};

const STATUS_LABEL: Record<AlunoStatus, string> = {
  ACTIVE: 'Novo Lead',
  ARCHIVED: 'Arquivado',
  CONTACTED: 'Contatado',
  CONVERTED: 'Convertido',
};

interface DashboardState {
  rows: AlunosRow[];
  total: number;
  page: number;
  pageCount: number;
  searchTerm: string;
  loading: boolean;
  error: string | null;
  initialLoad: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState<DashboardState>({
    rows: [],
    total: 0,
    page: 1,
    pageCount: 0,
    searchTerm: '',
    loading: true,
    error: null,
    initialLoad: true,
  });
  const [selected, setSelected] = useState<AlunosRow | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const searchDebounceRef = useRef<number | undefined>(undefined);

  const supabaseOk = useMemo(() => isSupabaseConfigured(), []);

  const loadAlunos = useCallback(async (opts?: { page?: number; search?: string; silent?: boolean }) => {
    const requestedPage = Math.max(1, opts?.page ?? 1);
    const search = String(opts?.search ?? '').trim();
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
      const from = (requestedPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = sb
        .from('alunos')
        .select('*', { count: 'exact', head: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search.length > 0) {
        const normalized = search
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
        query = query.or(
          [
            `nome.ilike.%${normalized}%`,
            `nome_text.like.*${normalized}*`,
            `whatsapp.ilike.%${normalized}%`,
            `objetivo.ilike.%${normalized}%`,
          ].join(',')
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const total = count ?? 0;
      const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const safePage = Math.min(requestedPage, pageCount);

      if (safePage !== requestedPage && total > 0) {
        loadAlunos({ page: safePage, search, silent });
        return;
      }

      setState((s) => ({
        ...s,
        rows: (data ?? []) as AlunosRow[],
        total,
        page: safePage,
        pageCount,
        searchTerm: search,
        loading: false,
        initialLoad: false,
        error: null,
      }));
    } catch (err) {
      const { message } = formatSupabaseError(err, 'Load alunos');
      setState((s) => ({
        ...s,
        rows: [],
        total: 0,
        page: 1,
        pageCount: 0,
        loading: false,
        initialLoad: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    loadAlunos({ page: 1, search: '' });
  }, [loadAlunos]);

  // -------- Busca em tempo real com debounce --------
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setState((s) => ({ ...s, searchTerm: value }));
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => {
      loadAlunos({ page: 1, search: value });
    }, 350);
  };

  // -------- Refresh automático a cada 5 minutos --------
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => ({ ...s, error: null }));
      loadAlunos({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadAlunos]);

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
    if (state.rows.length === 0) return;
    const header = [
      'ID',
      'Criado em',
      'Nome',
      'Idade',
      'WhatsApp',
      'Objetivo',
      'Detalhes Objetivo',
      'Frequência',
      'Tem Lesão?',
      'Detalhes Lesão',
      'Rotina',
      'Preferência',
      'Status',
      'Origem',
      'WhatsApp Link',
    ];
    const rows = state.rows.map((r) => [
      r.id,
      r.created_at ? new Date(r.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '',
      r.nome,
      String(r.idade),
      r.whatsapp,
      r.objetivo,
      r.goal_details ?? '',
      r.frequency,
      r.has_injury ? 'Sim' : 'Não',
      r.injury_details ?? '',
      r.rotina ?? '',
      r.preferencia ?? '',
      STATUS_LABEL[r.status] ?? r.status,
      r.origem ?? '',
      r.whatsapp_link ?? buildWhatsAppLink(r.whatsapp),
    ]);
    const csv = buildSheetCSV([header, ...rows]);
    downloadCSV(csv, `alunos-pag-${state.page}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <section className="min-h-screen w-full bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-[620px] h-[620px] bg-lime-400/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 right-0 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ---------------- Header ---------------- */}
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
              variant="outline"
              onClick={() => loadAlunos({ page: state.page, search: state.searchTerm })}
              disabled={state.loading || !supabaseOk}
              className="inline-flex items-center gap-2 border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background"
            >
              <RefreshCcw className={cn('w-4 h-4', state.loading && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={exportCurrentToCSV}
              disabled={state.rows.length === 0}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-foreground">
              Painel Administrativo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Alunos cadastrados através da Ficha de Avaliação Gratuita — {state.total.toLocaleString('pt-BR')} registrado(s)
            </p>
          </div>
          <div className="w-full sm:max-w-md">
            <label htmlFor="q" className="block text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">
              Buscar aluno
            </label>
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="q"
                type="search"
                value={state.searchTerm}
                placeholder="Nome, WhatsApp, objetivo..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-foreground placeholder:text-slate-500',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 focus-visible:border-lime-400 transition-all duration-300'
                )}
              />
            </div>
          </div>
        </div>

        {/* ---------------- Erro / não configurado ---------------- */}
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
                <h2 className="font-bold text-red-300 mb-1">Erro ao carregar alunos</h2>
                <p className="text-sm text-red-200/80 leading-relaxed">{state.error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => loadAlunos({ page: state.page, search: state.searchTerm })}
              className="self-end sm:self-start border-red-400/50 hover:border-red-400 hover:bg-red-500/10 text-red-200 hover:text-red-100 transition-all duration-300 inline-flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {/* ---------------- Loading inicial ---------------- */}
        {state.initialLoad && state.loading && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
            <p className="text-muted-foreground text-sm">Carregando alunos...</p>
          </div>
        )}

        {/* ---------------- Estado vazio ---------------- */}
        {!state.initialLoad && !state.loading && state.rows.length === 0 && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-center text-muted-foreground">
              <Inbox className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl text-foreground mb-1">
                {state.searchTerm ? 'Nenhum resultado para sua busca' : 'Nenhum aluno cadastrado ainda'}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                {state.searchTerm
                  ? 'Tente outros termos (nome, DDD, objetivo...). As buscas são por texto parcial e ignoram acentos.'
                  : 'Assim que novos alunos preencherem a Ficha de Avaliação Gratuita, aparecerão aqui ordenados por data.'}
              </p>
            </div>
            {state.searchTerm && (
              <Button
                variant="outline"
                onClick={() => handleSearchChange('')}
                className="inline-flex items-center gap-2 border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300"
              >
                <X className="w-4 h-4" />
                Limpar busca
              </Button>
            )}
          </div>
        )}

        {/* ---------------- Tabela / Grid ---------------- */}
        {!state.initialLoad && state.rows.length > 0 && (
          <>
            {/* Tabela Desktop */}
            <div className="hidden md:block rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <th className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Data
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <UserCircle className="w-3.5 h-3.5" />
                          Nome
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" />
                          Idade
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          Objetivo
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          Frequência
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <HeartPulse className="w-3.5 h-3.5" />
                          Lesão?
                        </span>
                      </th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold pr-5">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={cn(
                          'border-b border-slate-800/80 last:border-b-0 hover:bg-slate-800/40 transition-colors group',
                          idx % 2 === 1 && 'bg-slate-950/30'
                        )}
                      >
                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                          <time
                            dateTime={r.created_at}
                            className="text-xs text-slate-400 font-mono"
                          >
                            {r.created_at
                              ? new Date(r.created_at).toLocaleString('pt-BR', {
                                  timeZone: 'America/Sao_Paulo',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </time>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="font-semibold text-foreground leading-tight text-sm">
                            {r.nome}
                          </p>
                          {r.preferencia && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Pref: {r.preferencia}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-sm text-slate-300 tabular-nums">
                          {r.idade} anos
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <a
                            href={r.whatsapp_link || buildWhatsAppLink(r.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-lime-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 rounded"
                          >
                            <MessageCircle className="w-4 h-4 text-lime-400/80" />
                            <span className="font-mono tabular-nums">{r.whatsapp}</span>
                          </a>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="text-sm text-slate-200 leading-tight">{r.objetivo}</p>
                          {r.goal_details && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 max-w-xs">
                              {r.goal_details}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-sm text-slate-300">{r.frequency}</td>
                        <td className="px-4 py-3 align-middle">
                          {r.has_injury ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-red-500/15 text-red-300 border border-red-400/30 text-[11px] font-semibold">
                              <HeartPulse className="w-3 h-3" />
                              Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Badge
                            className={cn(
                              'border rounded-full text-[11px] font-bold uppercase tracking-wider',
                              STATUS_COLOR[r.status] ?? STATUS_COLOR.ACTIVE
                            )}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-middle text-right pr-5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(r)}
                            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-lime-400 hover:bg-lime-400/10 focus-visible:ring-offset-2 focus-visible:ring-lime-400"
                          >
                            <ListTodo className="w-4 h-4" />
                            Ficha completa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards Mobile */}
            <div className="md:hidden space-y-3">
              {state.rows.map((r) => (
                <motion.button
                  key={r.id}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => setSelected(r)}
                  className={cn(
                    'w-full text-left rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-4',
                    'hover:border-lime-500/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-foreground leading-tight">{r.nome}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                          : ''}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'border rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                        STATUS_COLOR[r.status] ?? STATUS_COLOR.ACTIVE
                      )}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <p>
                      <span className="text-slate-500">Idade:</span> {r.idade} anos
                    </p>
                    <p>
                      <span className="text-slate-500">Freq:</span> {r.frequency}
                    </p>
                    <p className="col-span-2 font-mono tabular-nums">
                      <span className="text-slate-500">WhatsApp:</span> {r.whatsapp}
                    </p>
                    <p className="col-span-2">
                      <span className="text-slate-500">Objetivo:</span> {r.objetivo}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {r.has_injury ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-red-500/15 text-red-300 border border-red-400/30 text-[11px] font-semibold">
                        <HeartPulse className="w-3 h-3" /> Com lesão/limitação
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                        Sem lesões
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-400">
                      Ver ficha
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Paginação */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Mostrando{' '}
                <span className="font-semibold text-slate-300">
                  {state.total === 0 ? 0 : (state.page - 1) * PAGE_SIZE + 1}
                </span>{' '}
                —{' '}
                <span className="font-semibold text-slate-300">
                  {Math.min(state.page * PAGE_SIZE, state.total)}
                </span>{' '}
                de <span className="font-semibold text-slate-300">{state.total}</span> resultados
                {state.searchTerm && (
                  <> · filtrando por "<span className="text-lime-400">{state.searchTerm}</span>"</>
                )}
              </p>
              <div className="inline-flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAlunos({ page: state.page - 1, search: state.searchTerm })}
                  disabled={state.page <= 1 || state.loading}
                  className="border-slate-700 hover:border-lime-400 hover:text-lime-400 transition-all duration-300 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs tabular-nums text-slate-300">
                  Página <span className="font-bold text-lime-400">{state.page}</span> / {state.pageCount}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAlunos({ page: state.page + 1, search: state.searchTerm })}
                  disabled={state.page >= state.pageCount || state.loading}
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

      {/* ---------------- Modal Ficha Completa ---------------- */}
      <AnimatePresence>
        <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-hidden p-0 gap-0 border border-slate-800/80 bg-slate-900/95 backdrop-blur-xl">
            <div className="sr-only">
              <DialogTitle>Ficha completa do aluno</DialogTitle>
              <DialogDescription>
                Todos os dados coletados na ficha de anamnese, incluindo lesões, detalhes de objetivo e rotina diária.
              </DialogDescription>
            </div>
            {selected && <DetailModal aluno={selected} onClose={() => setSelected(null)} />}
          </DialogContent>
        </Dialog>
      </AnimatePresence>
    </section>
  );
}

// =============================================================================
// Subcomponente: modal detalhes (acessível com foco, navegação por teclado)
// =============================================================================

function DetailModal({ aluno, onClose }: { aluno: AlunosRow; onClose: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    objetivo: true,
    saude: true,
    rotina: true,
    admin: false,
  });

  const toggle = (key: string) =>
    setExpanded((e) => ({ ...e, [key]: !e[key] }));

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
              Cadastrado em{' '}
              {aluno.created_at
                ? new Date(aluno.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={cn(
              'border rounded-full text-[11px] font-bold uppercase tracking-wider',
              STATUS_COLOR[aluno.status] ?? STATUS_COLOR.ACTIVE
            )}
          >
            {STATUS_LABEL[aluno.status] ?? aluno.status}
          </Badge>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar detalhes da ficha"
            className="w-9 h-9 rounded-xl border border-slate-700/80 text-slate-400 hover:text-lime-400 hover:border-lime-400 hover:bg-lime-400/10 inline-flex items-center justify-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-slate-950"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-4">
        {/* Identificação */}
        <Section title="Identificação" defaultOpen>
          <div className="divide-y divide-slate-800/70">
            {row('Nome', aluno.nome, { Icon: UserCircle, accent: true })}
            {row('Idade', `${aluno.idade} anos`, { Icon: Hash })}
            {row(
              'WhatsApp',
              aluno.whatsapp_link ? (
                <a
                  href={aluno.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-lime-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 rounded"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-lime-400" />
                  Abrir conversa
                </a>
              ) : (
                buildWhatsAppLink(aluno.whatsapp) || aluno.whatsapp
              ),
              { Icon: MessageCircle, mono: true }
            )}
          </div>
        </Section>

        {/* Objetivo */}
        <Section
          title="Objetivo e frequência"
          open={expanded.objetivo}
          onToggle={() => toggle('objetivo')}
        >
          <div className="divide-y divide-slate-800/70">
            {row('Objetivo principal', aluno.objetivo, { Icon: Target, accent: true })}
            {row('Detalhes do objetivo', aluno.goal_details || '— (não informado)')}
            {row('Frequência semanal', aluno.frequency, { Icon: Activity })}
            {row('Preferência atendimento', aluno.preferencia || '— (não informado)')}
          </div>
        </Section>

        {/* Saúde */}
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

        {/* Rotina */}
        <Section title="Rotina e observações" open={expanded.rotina} onToggle={() => toggle('rotina')}>
          <div className="divide-y divide-slate-800/70">
            {row('Rotina diária / semanal', aluno.rotina || '— (não informado)', { Icon: ListTodo })}
            {row('Origem / Canal', aluno.origem || 'site — anamnese', { Icon: ArrowLeftRight })}
          </div>
        </Section>

        {/* Admin */}
        <Section title="Dados internos" open={expanded.admin} onToggle={() => toggle('admin')}>
          <div className="divide-y divide-slate-800/70">
            {row('ID do banco', aluno.id, { Icon: FileSpreadsheet, mono: true })}
            {row('Atualizado em', aluno.updated_at ? new Date(aluno.updated_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—', {
              Icon: CalendarDays,
              mono: true,
            })}
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

        {/* Ações rodapé */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <a
            href={aluno.whatsapp_link || buildWhatsAppLink(aluno.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 text-black hover:bg-lime-300 border border-lime-400/70 font-bold tracking-wide uppercase text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-slate-950 transition-all duration-300"
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
                ['Idade', `${aluno.idade}`],
                ['WhatsApp', aluno.whatsapp],
                ['Link WhatsApp', aluno.whatsapp_link || buildWhatsAppLink(aluno.whatsapp)],
                ['Objetivo', aluno.objetivo],
                ['Detalhes Objetivo', aluno.goal_details ?? ''],
                ['Frequência', aluno.frequency],
                ['Lesão?', aluno.has_injury ? 'Sim' : 'Não'],
                ['Detalhes Lesão', aluno.injury_details ?? ''],
                ['Rotina', aluno.rotina ?? ''],
                ['Preferência', aluno.preferencia ?? ''],
                ['Status', STATUS_LABEL[aluno.status] ?? aluno.status],
                ['Origem', aluno.origem ?? ''],
                ['Criado em', aluno.created_at ?? ''],
              ];
              const csv = buildSheetCSV([header, ...rows]);
              downloadCSV(csv, `ficha-${aluno.nome.toLowerCase().replace(/\s+/g, '-').slice(0, 32)}.csv`);
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
