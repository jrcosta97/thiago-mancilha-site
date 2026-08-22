import { createClient, type SupabaseClient, type PostgrestError } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// Tipos da tabela `alunos` (supabase schema public)
// -----------------------------------------------------------------------------

export type AlunoStatus = 'ACTIVE' | 'ARCHIVED' | 'CONTACTED' | 'CONVERTED';

export interface AlunosRow {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  idade: number;
  whatsapp: string;
  objetivo: string;
  goal_details: string | null;
  frequency: string;
  has_injury: boolean;
  injury_details: string | null;
  rotina: string | null;
  preferencia: string | null;
  status: AlunoStatus;
  origem: string | null;
  sheet_sync_at: string | null;
  whatsapp_link: string | null;
}

export type AlunosInsert = Omit<AlunosRow, 'id' | 'created_at' | 'updated_at' | 'sheet_sync_at'> & {
  sheet_sync_at?: string | null;
};

export interface Database {
  public: {
    Tables: {
      alunos: {
        Row: AlunosRow;
        Insert: AlunosInsert;
        Update: Partial<AlunosInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      alunos_fts_nome: {
        Args: { '': string };
        Returns: AlunosRow[];
      };
    };
    Enums: Record<string, never>;
  };
}

// -----------------------------------------------------------------------------
// Variáveis e inicialização
// -----------------------------------------------------------------------------

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient<Database> | null = null;
let warnEmitted = false;

// 🔧 URL efetiva (sempre real em todos ambientes - NÃO usamos mais proxy Vite nesta máquina)
//    O Vite 5 + http-proxy crashava com 500 Internal Server Error, então usamos URL direta
//    e gerenciamos o CORS via painel Supabase Authentication URLs e SQL allowed origins.
const getEffectiveUrl = (): string | undefined => {
  return SUPABASE_URL;
};

export const isSupabaseConfigured = (): boolean => {
  const url = getEffectiveUrl();
  return (
    typeof url === 'string' && url.length > 0 &&
    typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 0
  );
};

export const createTypedSupabase = (): SupabaseClient<Database> | null => {
  const effectiveUrl = getEffectiveUrl();
  if (!isSupabaseConfigured()) {
    const msg =
      '[supabase] ERRO: Variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não foram configuradas no arquivo .env.\n' +
      '  - Adicione VITE_SUPABASE_URL=https://<PROJETO>.supabase.co\n' +
      '  - Adicione VITE_SUPABASE_ANON_KEY=<sua_chave_anon_publica>\n' +
      '  Obs: Em produção adicione as variáveis no painel Vercel/Supabase Hosting.';

    if (import.meta.env.DEV) {
      throw new Error(msg);
    }
    if (!warnEmitted && typeof window !== 'undefined') {
      warnEmitted = true;
      console.warn(msg);
    }
    return null;
  }

  const sb = createClient<Database>(effectiveUrl!, SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'thiago-mancilha-site',
      },
    },
  });

  if (typeof window !== 'undefined' && typeof console !== 'undefined' && typeof console.info === 'function') {
    try {
      const usingProxy = import.meta.env.DEV && typeof effectiveUrl === 'string' && effectiveUrl.includes('/__sb');
      const style = usingProxy
        ? 'color:#0ea5e9;font-weight:bold'
        : 'color:#a3e635;font-weight:bold';
      console.info('%c[supabase] Cliente inicializado', style, {
        url: effectiveUrl,
        modo: import.meta.env.DEV ? 'DEV' : 'PROD',
        proxy: usingProxy ? 'ATIVO (sem CORS)' : 'DESLIGADO',
        realUrl: SUPABASE_URL,
      });
    } catch {
      /* ignore console errors (strict mode, CSP, console undefined in SSR) */
    }
  }

  return sb;
};

export const getSupabase = (): SupabaseClient<Database> | null => {
  if (!client) {
    client = createTypedSupabase();
  }
  // Resiliência: se em ambiente browser o client veio NULL (por top-level com window undefined em Strict Mode)
  // e agora window existe, força recriação:
  if (!client && typeof window !== 'undefined' && import.meta.env.DEV) {
    client = createTypedSupabase();
  }
  // Expor no console (debug F12) - só aqui, nunca no top-level (evita crash Strict Mode ESM)
  if (client && typeof window !== 'undefined') {
    try {
      window.__supabase__ = client;
    } catch {
      /* ignore strict mode / CSP window assignment errors */
    }
  }
  return client;
};

// -----------------------------------------------------------------------------
// Helpers de erro
// -----------------------------------------------------------------------------

export const formatSupabaseError = (
  err: unknown,
  context: string = 'Supabase'
): { message: string; error: unknown } => {
  const pgErr = err as PostgrestError | null | undefined;
  const code = pgErr && 'code' in pgErr ? (pgErr as PostgrestError).code : undefined;
  const hint = pgErr && 'hint' in pgErr ? (pgErr as PostgrestError).hint : undefined;
  const details = pgErr && 'details' in pgErr ? (pgErr as PostgrestError).details : undefined;
  const message = pgErr?.message ?? (err instanceof Error ? err.message : String(err ?? 'Erro desconhecido'));
  const full =
    `[${context}] ${message}` +
    (code ? ` (code=${code})` : '') +
    (hint ? ` · hint: ${hint}` : '') +
    (details ? ` · details: ${details}` : '');

  return { message: full, error: err };
};

// -----------------------------------------------------------------------------
// Helpers específicos da tabela alunos
// -----------------------------------------------------------------------------

export interface CreateAlunoPayload {
  nome: string;
  idade: number;
  whatsapp: string;
  objetivo: string;
  goal_details?: string | null;
  frequency: string;
  has_injury: boolean;
  injury_details?: string | null;
  rotina?: string | null;
  preferencia?: string | null;
  status?: AlunoStatus;
  origem?: string | null;
  whatsapp_link?: string | null;
}

const WHATSAPP_BR_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/;
const DIGITS_ONLY_REGEX = /^\d{10,11}$/;

const digitsOnly = (value: unknown): string =>
  String(value ?? '').replace(/\D+/g, '');

const formatWhatsAppBR = (raw: unknown): string => {
  const d = digitsOnly(raw);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`;
  return String(raw ?? '');
};

const buildWhatsAppLinkBR = (raw: unknown): string => {
  const d = digitsOnly(raw);
  if (d.length < 10) return '';
  const full = d.length === 11 ? `55${d}` : `55${d}`;
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(full)}`;
};

export const validateCreateAlunoPayload = (
  raw: CreateAlunoPayload
): { valid: boolean; payload: AlunosInsert; errors: string[] } => {
  const errors: string[] = [];

  const nome = String(raw.nome ?? '').trim();
  if (nome.length < 2) errors.push('nome: mínimo 2 caracteres');

  const idade = Number(raw.idade);
  if (!Number.isFinite(idade) || !Number.isInteger(idade) || idade < 10 || idade > 100)
    errors.push(`idade: inválida "${String(raw.idade)}" (deve ser inteiro entre 10 e 100)`);

  const whatsappFormatado = formatWhatsAppBR(raw.whatsapp);
  const okFormato =
    WHATSAPP_BR_REGEX.test(whatsappFormatado) ||
    DIGITS_ONLY_REGEX.test(digitsOnly(raw.whatsapp));
  if (!okFormato) errors.push(`whatsapp: formato inválido "${String(raw.whatsapp)}"`);

  const objetivo = String(raw.objetivo ?? '').trim() || 'nao_informado';
  const frequency = String(raw.frequency ?? '').trim() || 'nao_informado';
  const has_injury = Boolean(raw.has_injury);
  const injury_details = has_injury
    ? String(raw.injury_details ?? '').trim() || null
    : null;
  const goal_details = String(raw.goal_details ?? '').trim() || null;
  const rotina = String(raw.rotina ?? '').trim() || null;
  const preferencia = String(raw.preferencia ?? '').trim() || null;
  const origem = String(raw.origem ?? '').trim() || 'anamnese-site';
  const whatsapp_link =
    String(raw.whatsapp_link ?? '').trim() || buildWhatsAppLinkBR(raw.whatsapp) || null;
  const status: AlunoStatus = (raw.status as AlunoStatus | undefined) || 'ACTIVE';

  const payload: AlunosInsert = {
    nome,
    idade,
    whatsapp: whatsappFormatado || String(raw.whatsapp ?? ''),
    objetivo,
    goal_details,
    frequency,
    has_injury,
    injury_details,
    rotina,
    preferencia,
    status,
    origem,
    whatsapp_link,
  };

  return { valid: errors.length === 0, payload, errors };
};

export const insertAluno = async (
  client: SupabaseClient<Database>,
  raw: CreateAlunoPayload
): Promise<{ data: AlunosRow | null; error: PostgrestError | Error | null; validationErrors: string[] }> => {
  const { valid, payload, errors: validationErrors } = validateCreateAlunoPayload(raw);
  if (!valid) {
    return { data: null, error: null, validationErrors };
  }

  if (import.meta.env.DEV && typeof console !== 'undefined' && typeof console.debug === 'function') {
    try {
      console.debug('%c[supabase] Insert aluno payload enviado:', 'color:#334155;font-weight:600', {
        payload,
        rawInput: raw,
      });
    } catch { /* ignore */ }
  }

  // Timeout de segurança (15s) para não travar "Enviando..." infinito
  const hasWindow = typeof window !== 'undefined';
  const controller = hasWindow && typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller && hasWindow
    ? window.setTimeout(() => controller.abort(), 15000)
    : undefined;

  try {
    const promise = client
      .from('alunos')
      .insert(payload as unknown as never[])
      .select()
      .maybeSingle();

    const result = controller
      ? await Promise.race([
          promise,
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () =>
              reject(new Error('[supabase] Timeout de 15s ao inserir aluno (verifique proxy/URL/CORS).'))
            );
          }),
        ])
      : await promise;

    const { data, error } = result as { data: unknown; error: unknown };

    if (timeoutId !== undefined && hasWindow) window.clearTimeout(timeoutId);

    if (import.meta.env.DEV && typeof console !== 'undefined') {
      try {
        if (error) {
          console.error('%c[supabase] Insert ERRO:', 'color:#b91c1c;font-weight:700', {
            error: error ?? null,
            errorString: JSON.stringify(error, null, 2),
          });
        } else {
          console.log('%c[supabase] Insert SUCESSO:', 'color:#15803d;font-weight:700', { inserted: data });
        }
      } catch { /* ignore */ }
    }

    return {
      data: (data as AlunosRow) ?? null,
      error: (error as PostgrestError | Error | null) ?? null,
      validationErrors,
    };
  } catch (err) {
    if (timeoutId !== undefined && hasWindow) window.clearTimeout(timeoutId);
    if (import.meta.env.DEV && typeof console !== 'undefined') {
      try {
        console.error('[supabase] Insert EXCEPTION catch:', err);
      } catch { /* ignore */ }
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err ?? 'Erro desconhecido no insert')),
      validationErrors,
    };
  }
};

// -----------------------------------------------------------------------------
// Insert via Edge Function (bypass TOTAL de CORS — fallback obrigatório nesta máquina
// onde o PostgREST não carregou as origins permitidas do Authentication URL Config.)
// -----------------------------------------------------------------------------

const getEdgeFunctionBaseUrl = (): string | null => {
  const effectiveUrl = getEffectiveUrl();
  if (!effectiveUrl) return null;
  return `${effectiveUrl.replace(/\/+$/, '')}/functions/v1`;
};

export interface InsertAlunoViaEdgeResult {
  ok: boolean;
  data?: AlunosRow | null;
  error?: { message: string; code?: string; hint?: string; details?: string } | Error | null;
  validationErrors?: string[];
  statusCode?: number;
  transport?: 'cors' | 'no-cors';
}

export interface SupabaseDiagnosticStep {
  id: string;
  label: string;
  ok: boolean;
  message: string;
  statusCode?: number;
  details?: string;
}

export interface SupabaseDiagnosticReport {
  ok: boolean;
  ranAt: string;
  steps: SupabaseDiagnosticStep[];
}

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err ?? 'Erro desconhecido');

const parseJsonSafely = async (res: Response): Promise<Record<string, unknown> | null> => {
  const rawText = await res.text().catch(() => '');
  if (!rawText) return null;
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return { rawText };
  }
};

const withTimeout = async <T>(promiseFactory: (signal?: AbortSignal) => Promise<T>, ms: number): Promise<T> => {
  if (typeof AbortController === 'undefined' || typeof window === 'undefined') {
    return promiseFactory(undefined);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ms);

  try {
    return await promiseFactory(controller.signal);
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const runSupabaseDiagnostics = async (): Promise<SupabaseDiagnosticReport> => {
  const steps: SupabaseDiagnosticStep[] = [];
  const configured = isSupabaseConfigured();
  const effectiveUrl = getEffectiveUrl();
  const edgeBaseUrl = getEdgeFunctionBaseUrl();

  steps.push({
    id: 'env',
    label: 'Ambiente',
    ok: configured,
    message: configured
      ? 'Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` carregadas.'
      : 'Variáveis de ambiente ausentes ou vazias.',
    details: effectiveUrl ?? undefined,
  });

  if (!configured || !effectiveUrl || !edgeBaseUrl) {
    return { ok: false, ranAt: new Date().toISOString(), steps };
  }

  try {
    const authRes = await withTimeout(
      (signal) => fetch(`${effectiveUrl.replace(/\/+$/, '')}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {}),
          ...(SUPABASE_ANON_KEY ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}),
        },
        signal,
      }),
      10000
    );
    const authReachable = authRes.ok || authRes.status === 401;
    steps.push({
      id: 'auth-settings',
      label: 'Auth reachability',
      ok: authReachable,
      message: authRes.ok
        ? 'Endpoint `auth/v1/settings` respondeu normalmente.'
        : authRes.status === 401
          ? 'Endpoint de auth foi alcançado, mas respondeu `401`. Isso indica reachability ok e rejeição de autorização para esse check específico.'
          : `Endpoint de auth respondeu com HTTP ${authRes.status}.`,
      statusCode: authRes.status,
    });
  } catch (err) {
    steps.push({
      id: 'auth-settings',
      label: 'Auth reachability',
      ok: false,
      message: `Falha ao alcançar auth: ${getErrorMessage(err)}`,
    });
  }

  try {
    const edgeRes = await withTimeout(
      (signal) => fetch(`${edgeBaseUrl}/insert-aluno?health=1`, { method: 'GET', signal }),
      10000
    );
    const edgeJson = await parseJsonSafely(edgeRes);
    steps.push({
      id: 'edge-health',
      label: 'Edge Function',
      ok: edgeRes.ok,
      message: edgeRes.ok
        ? 'Health check da Edge Function respondeu.'
        : `Health check respondeu com HTTP ${edgeRes.status}.`,
      statusCode: edgeRes.status,
      details: edgeJson ? JSON.stringify(edgeJson) : undefined,
    });
  } catch (err) {
    steps.push({
      id: 'edge-health',
      label: 'Edge Function',
      ok: false,
      message: `Falha ao alcançar a Edge Function: ${getErrorMessage(err)}`,
    });
  }

  const sb = getSupabase();
  steps.push({
    id: 'client',
    label: 'Cliente',
    ok: Boolean(sb),
    message: sb
      ? 'Cliente Supabase inicializado no front.'
      : 'Cliente Supabase não pôde ser inicializado.',
  });

  return {
    ok: steps.every((step) => step.ok),
    ranAt: new Date().toISOString(),
    steps,
  };
};

export const insertAlunoViaEdgeFunction = async (
  raw: CreateAlunoPayload
): Promise<InsertAlunoViaEdgeResult> => {
  const { valid, payload, errors: validationErrors } = validateCreateAlunoPayload(raw);
  if (!valid) {
    return { ok: false, validationErrors };
  }

  try {
    if (import.meta.env.DEV && typeof console !== 'undefined' && typeof console.debug === 'function') {
      try {
        console.debug('%c[supabase-edge] Insert via Edge Function payload enviado:', 'color:#6d28d9;font-weight:600', {
          payload,
          rawInput: raw,
        });
      } catch { /* ignore */ }
    }

    const edgeBaseUrl = getEdgeFunctionBaseUrl();
    if (!edgeBaseUrl) {
      return {
        ok: false,
        error: new Error('URL base da Edge Function não está configurada.'),
      };
    }

    const url = `${edgeBaseUrl}/insert-aluno`;
    const anonKey = SUPABASE_ANON_KEY ?? '';

    try {
      const res = await withTimeout(
        (signal) => fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'x-application-name': 'thiago-mancilha-site-via-edge',
            ...(anonKey ? { apikey: anonKey } : {}),
            ...(anonKey ? { Authorization: `Bearer ${anonKey}` } : {}),
          },
          body: JSON.stringify(payload),
          signal,
        }),
        20000
      );

      const parsed = await parseJsonSafely(res);

      if (import.meta.env.DEV && typeof console !== 'undefined') {
        try {
          if (res.ok) {
            console.log('%c[supabase-edge] Insert SUCESSO (cors):', 'color:#15803d;font-weight:700', { parsed });
          } else {
            console.error('%c[supabase-edge] Insert ERRO HTTP (cors):', 'color:#b91c1c;font-weight:700', {
              status: res.status,
              statusText: res.statusText,
              parsed,
            });
          }
        } catch { /* ignore */ }
      }

      if (!res.ok) {
        const errMsg =
          parsed && typeof parsed.error === 'object' && parsed.error !== null && !Array.isArray(parsed.error)
            ? ((parsed.error as { message?: string }).message ?? `HTTP ${res.status}`)
            : (parsed && typeof parsed.error === 'string' ? parsed.error : `HTTP ${res.status} ${res.statusText}`);
        return {
          ok: false,
          error: { message: errMsg, code: String(res.status) },
          statusCode: res.status,
          validationErrors: parsed?.validationErrors as string[] | undefined,
          transport: 'cors',
        };
      }

      return {
        ok: true,
        data: (parsed?.data as AlunosRow | null) ?? null,
        statusCode: res.status,
        transport: 'cors',
      };
    } catch (corsErr) {
      const message = getErrorMessage(corsErr);
      const canFallbackNoCors =
        !/aborted|timeout/i.test(message) &&
        /fetch|network|cors|load|failed/i.test(message);

      if (!canFallbackNoCors) {
        throw corsErr;
      }

      if (import.meta.env.DEV && typeof console !== 'undefined') {
        try {
          console.warn('[supabase-edge] Falha no transporte CORS, tentando fallback no-cors:', message);
        } catch { /* ignore */ }
      }
    }

    const noCorsRes = await withTimeout(
      (signal) => fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body: JSON.stringify(payload),
        signal,
      }),
      20000
    );

    if (import.meta.env.DEV && typeof console !== 'undefined') {
      try {
        console.log('%c[supabase-edge] Fallback NO-CORS concluído:', 'color:#15803d;font-weight:700', {
          type: noCorsRes.type,
          ok: noCorsRes.ok,
          nota: 'Resposta opaca; validar resultado no dashboard/logs da Edge Function se necessário.',
        });
      } catch { /* ignore */ }
    }

    return {
      ok: true,
      statusCode: 0,
      data: null,
      transport: 'no-cors',
    };
  } catch (err) {
    if (import.meta.env.DEV && typeof console !== 'undefined') {
      try {
        console.error('[supabase-edge] Insert EXCEPTION catch:', err);
      } catch { /* ignore */ }
    }
    return {
      ok: false,
      error: err instanceof Error ? err : new Error(String(err ?? 'Erro desconhecido na Edge Function')),
    };
  }
};

// -----------------------------------------------------------------------------
// Expor no console (debug F12) - feito dentro de getSupabase(), NÃO no top-level
// -----------------------------------------------------------------------------

declare global {
  interface Window {
    __supabase__?: SupabaseClient<Database> | null;
  }
}
