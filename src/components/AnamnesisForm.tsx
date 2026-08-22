import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Dumbbell, ClipboardList, CheckCircle2, ArrowRight, ArrowLeft, PartyPopper, MessageCircle,
  HeartPulse, ThumbsUp, CalendarDays, Sparkles, AlertTriangle, Shield, Target, Clock, Users,
  FileSpreadsheet, Download, Database,
} from 'lucide-react';
import { useForm, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  buildSheetRow,
  buildUniversalPayload,
  payloadToURLSearchParams,
  reportToTableRows,
  buildSheetCSV,
  downloadCSV,
  formatWhatsApp,
  sheetSyncSelfTest,
  type SheetValidationReport,
} from '@/services/sheet-sync';
import {
  isSupabaseConfigured,
  getSupabase,
  insertAluno,
  formatSupabaseError,
  insertAlunoViaEdgeFunction,
  type AlunosRow,
  type AlunoStatus,
} from '@/lib/supabase';

const WHATSAPP_NUMBER = '5548988720439';

interface AnamnesisFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const schema = z.object({
  nome: z.string()
    .min(1, { message: 'Informe seu nome completo' })
    .trim()
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, {
      message: 'Informe nome e sobrenome (mínimo 2 palavras)',
    }),
  idade: z.coerce
    .number({ invalid_type_error: 'Idade deve ser um número' })
    .int({ message: 'Idade deve ser um número inteiro' })
    .min(14, { message: 'Idade mínima para avaliação é 14 anos' })
    .max(99, { message: 'Idade máxima aceita é 99 anos' }),
  whatsapp: z.string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11, {
      message: 'WhatsApp precisa ter 11 dígitos: DDD 2 + 9 dígitos',
    }),
  goal: z.string().min(1, { message: 'Selecione um objetivo principal' }),
  goalDetails: z.string().max(1000).optional(),
  frequency: z.string().min(1, { message: 'Selecione quantas vezes por semana pode treinar' }),
  hasInjury: z.enum(['s', 'n'], { required_error: 'Informe se tem lesão ou limitação' }),
  injuryDetails: z.string().optional(),
  rotina: z.string().max(1500).optional(),
  preferencia: z.enum(['presencial', 'online', 'qualquer'], {
    required_error: 'Selecione uma preferência de atendimento',
  }),
});

type FormValues = z.infer<typeof schema>;

const TOTAL_STEPS = 4;

const stepTitles = [
  'Dados básicos',
  'Objetivo',
  'Saúde e lesões',
  'Rotina e preferência',
];

const stepSubtitles = [
  'Para eu te conhecer e saber onde estamos começando.',
  'Para onde você quer chegar com o treinamento personalizado.',
  'Para montar um plano seguro e adaptado para você.',
  'Para encaixar tudo na sua rotina sem complicação.',
];

const goalOptions = [
  { value: 'emagrecer', label: 'Emagrecer com saúde', tag: 'Emagrecimento', Icon: Target },
  { value: 'hipertrofia', label: 'Ganhar massa muscular', tag: 'Hipertrofia', Icon: Dumbbell },
  { value: 'mobilidade', label: 'Melhorar mobilidade e dor', tag: 'Saúde Funcional', Icon: HeartPulse },
  { value: 'forca', label: 'Mais força e disposição', tag: 'Qualidade de vida', Icon: Sparkles },
  { value: 'outro', label: 'Outro objetivo', tag: 'Personalizado', Icon: ThumbsUp },
];

const frequencyOptions = [
  { value: '2x', label: '2x por semana', chip: '2x' },
  { value: '3x', label: '3x por semana', chip: '3x · recomendado' },
  { value: '4x', label: '4x por semana', chip: '4x' },
  { value: '5xmais', label: '5x ou mais por semana', chip: '5x+' },
];

const preferenceOptions = [
  { value: 'presencial' as const, label: 'Presencial', hint: 'Studio / Casa', Icon: Users },
  { value: 'online' as const, label: 'Online', hint: 'Todo o Brasil', Icon: MessageCircle },
  { value: 'qualquer' as const, label: 'Tanto faz', hint: 'Melhor opção', Icon: ThumbsUp },
];

const cleanWhats = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const pad = (n: number) => String(n).padStart(2, '0');
const formatDateBR = (d = new Date()) => {
  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

const mapObjetivoLabel = (value: string, goalDetails?: string): string => {
  const base = (() => {
    switch (value) {
      case 'emagrecer': return 'Emagrecimento';
      case 'hipertrofia': return 'Ganho de Massa Muscular';
      case 'mobilidade': return 'Saúde Funcional e Mobilidade';
      case 'forca': return 'Força e Disposição';
      case 'outro': {
        const extra = String(goalDetails || '').trim();
        if (extra && extra.length <= 40) return extra;
        if (extra) return extra.slice(0, 60);
        return 'Outro';
      }
      default: return value || 'Não informado';
    }
  })();
  return base;
};

const mapFrequenciaLabel = (value: string): string => {
  switch (value) {
    case '2x': return '1 a 2 vezes por semana';
    case '3x': return '3 a 4 vezes por semana';
    case '4x': return '3 a 4 vezes por semana';
    case '5xmais': return '5 a 6 vezes por semana';
    default: return value || 'Não informado';
  }
};

const mapLesoesCell = (hasInjury: 's' | 'n' | '', details?: string): string => {
  if (hasInjury !== 's') return 'Não';
  const d = String(details || '').trim();
  if (!d) return 'Sim';
  const pretty = d.charAt(0).toUpperCase() + d.slice(1);
  return `Sim — ${pretty}`;
};

const mapPreferenciaLabel = (value: string): string => {
  switch (value) {
    case 'presencial': return 'Atendimento Presencial';
    case 'online': return 'Atendimento Online';
    case 'qualquer': return 'Tanto faz';
    default: return value || 'Não informado';
  }
};

export default function AnamnesisForm({ isOpen, onClose }: AnamnesisFormProps) {
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<SheetValidationReport | null>(null);

  const defaultValues = useMemo<FormValues>(() => ({
    nome: '',
    idade: undefined as unknown as number,
    whatsapp: '',
    goal: '',
    goalDetails: '',
    frequency: '',
    hasInjury: undefined as unknown as 's' | 'n',
    injuryDetails: '',
    rotina: '',
    preferencia: undefined as unknown as 'presencial' | 'online' | 'qualquer',
  }), []);

  const {
    register, setValue, watch, trigger, clearErrors, formState: { errors, isValid }, handleSubmit, getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues,
    shouldUnregister: false,
  });

  const values = watch();

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSending(false);
      setSuccess(false);
      setStepError(null);
      setLastReport(null);
      Object.entries(defaultValues).forEach(([k, v]) => {
        setValue(k as Path<FormValues>, v as never, { shouldValidate: false, shouldDirty: false, shouldTouch: false });
      });
      clearErrors();
    }
  }, [isOpen, defaultValues, setValue, clearErrors]);

  useEffect(() => {
    const sub = watch((v, { name, type }) => {
      if (name === 'whatsapp' && type === 'change' && typeof v.whatsapp === 'string') {
        setValue('whatsapp', cleanWhats(v.whatsapp) as never, { shouldValidate: true, shouldDirty: true });
      }
      if (name === 'idade' && type === 'change') {
        const raw = String(v.idade ?? '').replace(/\D/g, '').slice(0, 2);
        setValue('idade', (raw === '' ? undefined : Number(raw)) as never, { shouldValidate: true, shouldDirty: true });
      }
    });
    return () => sub.unsubscribe();
  }, [watch, setValue]);

  const fieldsForStep = (s: number): Path<FormValues>[] => {
    switch (s) {
      case 0: return ['nome', 'idade', 'whatsapp'];
      case 1: return ['goal'];
      case 2: return ['hasInjury', 'injuryDetails'];
      case 3: return ['frequency', 'preferencia'];
      default: return [];
    }
  };

  const next = async () => {
    setStepError(null);
    const keys = fieldsForStep(step);
    const ok = await trigger(keys as never, { shouldFocus: true });
    if (!ok) {
      const firstMsg = keys
        .map((k) => (errors as unknown as Record<string, { message?: string }>)[k]?.message)
        .find(Boolean);
      setStepError(firstMsg ?? 'Preencha todos os campos corretamente antes de avançar.');
      return;
    }
    if (step === 2 && values.hasInjury === 's' && (values.injuryDetails || '').trim().length < 5) {
      setStepError('Conte brevemente qual(is) lesão/ões ou limitações você tem.');
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    await handleSubmit(submit)();
  };

  const submit = async (data: FormValues) => {
    if (sending) return;
    setSending(true);
    setStepError(null);

    const now = new Date();
    const preferenciaPretty = String(data.preferencia || '').trim();

    const report: SheetValidationReport = buildSheetRow(
      {
        nome: data.nome,
        idade: Number.isFinite(Number(data.idade)) ? Number(data.idade) : String(data.idade ?? ''),
        whatsapp: data.whatsapp,
        goal: data.goal,
        goalDetails: data.goalDetails,
        frequency: data.frequency,
        hasInjury: data.hasInjury,
        injuryDetails: data.injuryDetails,
        preferencia: preferenciaPretty,
        rotina: data.rotina,
      },
      { now, statusLead: 'Novo Lead', allowFallbackDefaults: true }
    );

    const universalPayload = buildUniversalPayload(report);

    if (preferenciaPretty.length > 0) {
      universalPayload['Preferência de Atendimento'] = preferenciaPretty;
      universalPayload['preferencia'] = preferenciaPretty;
      universalPayload['preferência'] = preferenciaPretty;
    }
    if (String(data.goalDetails || '').trim().length > 0) {
      universalPayload['Detalhes do Objetivo'] = String(data.goalDetails).trim();
      universalPayload['detalhes_objetivo'] = String(data.goalDetails).trim();
      universalPayload['objetivo_detalhes'] = String(data.goalDetails).trim();
    }
    if (String(data.injuryDetails || '').trim().length > 0) {
      universalPayload['lesao_detalhes'] = String(data.injuryDetails).trim();
      universalPayload['lesao_details'] = String(data.injuryDetails).trim();
      universalPayload['detalhes_lesao'] = String(data.injuryDetails).trim();
    }
    if (String(data.rotina || '').trim().length > 0) {
      universalPayload['Observações / Rotina'] = String(data.rotina).trim();
      universalPayload['Observacoes / Rotina'] = String(data.rotina).trim();
      universalPayload['rotina'] = String(data.rotina).trim();
    }
    universalPayload['Origem'] = 'Site — Ficha de Avaliação Gratuita';
    universalPayload['source'] = 'anamnese-site';

    const params = payloadToURLSearchParams(universalPayload);
    const bodyUrlEncoded = params.toString();

    const WEBHOOK =
      (import.meta.env.VITE_GOOGLE_SCRIPT_URL as string | undefined) ||
      'https://script.google.com/macros/s/AKfycbzWebhookPlaceholder/exec';

    // ----- Supabase payload -----
    const idadeNumeric = Number.isFinite(Number(data.idade)) ? Number(data.idade) : NaN;
    const hasInjuryBool = data.hasInjury === 's';
    const supabasePayload = {
      nome: String(data.nome ?? '').trim(),
      idade: idadeNumeric,
      whatsapp: String(data.whatsapp ?? '').trim(),
      objetivo: String(data.goal ?? '').trim(),
      goal_details: String(data.goalDetails ?? '').trim() || null,
      frequency: String(data.frequency ?? '').trim(),
      has_injury: hasInjuryBool,
      injury_details: hasInjuryBool ? String(data.injuryDetails ?? '').trim() || null : null,
      rotina: String(data.rotina ?? '').trim() || null,
      preferencia: preferenciaPretty || null,
      status: 'ACTIVE' as AlunoStatus,
      origem: 'anamnese-site',
      whatsapp_link: report.rowByLetter.I || undefined,
    };

    type ResultadoGAS = { ok: boolean; error?: unknown; response?: Response; url: string; body: string };
    type ResultadoSUPA = { ok: boolean; configured: boolean; error?: unknown; validationErrors?: string[]; inserted: AlunosRow | null };

    let gasResult: ResultadoGAS = { ok: false, url: WEBHOOK, body: bodyUrlEncoded };
    let supaResult: ResultadoSUPA = { ok: false, configured: isSupabaseConfigured(), inserted: null };

    try {
      console.group('%c[Anamnesis] Envio para Google Apps Script + Supabase (Promise.all paralelo)', 'color:#CCFF00;font-weight:bold;');
      console.log('➡️ URL do Webhook:', WEBHOOK);
      console.log('➡️ Supabase configurado?', isSupabaseConfigured() ? 'SIM (tentando insert alunos)' : 'NÃO (pulando insert)');
      console.log('➡️ MÓDULO: sheet-sync.ts v2 buildSheetRow + buildUniversalPayload');
      console.log('➡️ MÉTODO DE ENVIO: application/x-www-form-urlencoded (URLSearchParams, compatível com e.parameter do GAS)');
      console.log('➡️ Relatório buildSheetRow (9 células em ORDEM A..I):', report);
      console.log('➡️ Payload UNIVERSAL (todas as chaves 5 formatos):', universalPayload);
      console.log('➡️ Payload SUPABASE tabela alunos (mapeamento exato):', supabasePayload);
      console.log('➡️ Query string URLSearchParams.toString() — cole aqui em caso de dúvida:\n', bodyUrlEncoded);
      console.log('➡️ Headers GAS:', { method: 'POST', mode: 'no-cors', 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' });

      console.groupCollapsed('%c[Anamnesis] Relatório INTEGRIDADE célula a célula (sheet-sync)', 'color:#8b5cf6;font-weight:bold;');
      console.table(reportToTableRows(report));
      console.groupEnd();

      console.log(`%c[Anamnesis] Resumo do relatório: hasCriticalErrors=${report.hasCriticalErrors} · gapCount=${report.gapCount} · fixableGapCount=${report.fixableGapCount}`, report.hasCriticalErrors ? 'color:#ef4444;font-weight:bold;' : 'color:#22c55e;font-weight:bold;');

      if (report.gapCount > 0) {
        console.groupCollapsed(`%c[Anamnesis] ⚠️ ${report.gapCount} lacuna(s) detectada(s) — detalhes:`, 'color:#f59e0b;font-weight:bold;');
        report.errors.forEach((e) => console.error(`[ERRO ${e.code}] ${e.letter} ${e.header}: ${e.reason} · valor raw=${String(e.rawValue)} · fallback usado: ${e.insertedValue}`));
        report.warnings.forEach((w) => console.warn(`[WARN ${w.code}] ${w.letter} ${w.header}: ${w.reason} · raw=${String(w.rawValue)} · fallback: ${w.insertedValue}`));
        console.groupEnd();
      }

      console.warn('[Debug GAS] Valores DAS COLUNAS QUE FICAVAM VAZIAS ANTES:');
      console.warn('  · COLUNA F Frequencia (chaves enviadas):', {
        '0..8[5]': report.row[5],
        col_5: universalPayload['col_5'],
        F: universalPayload['F'],
        Frequencia: universalPayload['Frequencia'],
        'Frequência': universalPayload['Frequência'],
        frequencia: universalPayload['frequencia'],
        'frequência': universalPayload['frequência'],
        frequencia_semanal: universalPayload['frequencia_semanal'],
        freq: universalPayload['freq'],
      });
      console.warn('  · COLUNA G lesões (chaves enviadas):', {
        '0..8[6]': report.row[6],
        col_6: universalPayload['col_6'],
        G: universalPayload['G'],
        Lesões: universalPayload['Lesões'],
        Lesoes: universalPayload['Lesoes'],
        'lesões': universalPayload['lesões'],
        lesoes: universalPayload['lesoes'],
        lesao: universalPayload['lesao'],
        les: universalPayload['les'],
        tem_lesao: universalPayload['tem_lesao'],
      });

      // ---- CHAMADAS PARALELAS (Promise.allSettled p/ ambas prosseguir mesmo se uma falhar) ----
      const chamadas: Promise<ResultadoGAS | ResultadoSUPA>[] = [];

      chamadas.push(
        (async (): Promise<ResultadoGAS> => {
          try {
            const response = await fetch(WEBHOOK, {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                'X-Sent-With': 'AnamnesisForm-v3-sheet-sync-service',
              },
              body: bodyUrlEncoded,
            });
            console.log('✅ [GAS] Resposta recebida (no-cors - body é opaco):', {
              status: response.status, type: response.type, ok: response.ok, redirected: response.redirected,
            });
            return { ok: true, response, url: WEBHOOK, body: bodyUrlEncoded };
          } catch (err) {
            console.group('%c[Anamnesis] ❌ Erro durante envio Google Apps Script', 'color:#ef4444;font-weight:bold;');
            console.error('Detalhes do erro GAS:', err);
            console.log('URL usada:', WEBHOOK);
            console.log('Body URLSearchParams enviado:', bodyUrlEncoded);
            console.groupEnd();
            return { ok: false, error: err, url: WEBHOOK, body: bodyUrlEncoded };
          }
        })()
      );

      chamadas.push(
        (async (): Promise<ResultadoSUPA> => {
          if (!isSupabaseConfigured()) {
            console.warn('%c[SUPABASE] Pulado: VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY ausentes.', 'color:#f59e0b;font-weight:bold;');
            return { ok: false, configured: false, inserted: null };
          }
          try {
            // ===================== FALLBACK OBRIGATÓRIO =====================
            // O PostgREST desta máquina (/rest/v1/) está com bug de cache no
            // Authentication URL Configuration: não carrega origins permitidas,
            // então CORS ALWAYS FALHA. Resolução: usar Edge Function (server side)
            // como método principal (zero CORS, bypass total).
            // ================================================================
            console.log('%c[SUPABASE] ▶️ Usando Edge Function (bypass CORS garantido):', 'color:#6d28d9;font-weight:bold;', 'insert-aluno');
            const edgeResult = await insertAlunoViaEdgeFunction(supabasePayload);

            if (edgeResult.validationErrors && edgeResult.validationErrors.length > 0) {
              console.group('%c[SUPABASE] ⚠️ Validação antes do insert (Edge Function) falhou', 'color:#f59e0b;font-weight:bold;');
              edgeResult.validationErrors.forEach((e) => console.warn('  -', e));
              console.groupEnd();
              return { ok: false, configured: true, validationErrors: edgeResult.validationErrors, inserted: null };
            }
            if (!edgeResult.ok || edgeResult.error) {
              const errObj = edgeResult.error;
              const fmtMessage =
                errObj && typeof errObj === 'object' && 'message' in errObj
                  ? (errObj as { message: string }).message
                  : 'Erro desconhecido na Edge Function';
              console.group('%c[Anamnesis] ❌ Erro durante insert Supabase (Edge Function)', 'color:#ef4444;font-weight:bold;');
              console.error('Mensagem:', fmtMessage);
              console.error('Erro completo:', errObj);
              console.groupEnd();
              return { ok: false, configured: true, error: fmtMessage, inserted: null };
            }
            console.log('%c[SUPABASE] ✅ aluno inserido com SUCESSO (via Edge Function):', 'color:#22c55e;font-weight:bold;', edgeResult.data);
            return { ok: true, configured: true, inserted: (edgeResult.data ?? null) as AlunosRow | null };
          } catch (err) {
            const fmt = formatSupabaseError(err, 'Supabase insert alunos catch');
            console.group('%c[Anamnesis] ❌ Erro inesperado (catch) durante insert Supabase (Edge Function)', 'color:#ef4444;font-weight:bold;');
            console.error(fmt.message);
            console.error('Erro completo:', err);
            console.groupEnd();
            return { ok: false, configured: true, error: err, inserted: null };
          }
        })()
      );

      const resultados = await Promise.allSettled(chamadas);
      const resultadoGasRaw = resultados[0];
      const resultadoSupaRaw = resultados[1];

      gasResult = resultadoGasRaw.status === 'fulfilled'
        ? (resultadoGasRaw.value as ResultadoGAS)
        : { ok: false, error: resultadoGasRaw.status === 'rejected' ? resultadoGasRaw.reason : 'promise rejeitada', url: WEBHOOK, body: bodyUrlEncoded };

      supaResult = resultadoSupaRaw.status === 'fulfilled'
        ? (resultadoSupaRaw.value as ResultadoSUPA)
        : { ok: false, configured: isSupabaseConfigured(), error: resultadoSupaRaw.status === 'rejected' ? resultadoSupaRaw.reason : 'promise rejeitada', inserted: null };

      console.group('%c[Anamnesis] RESUMO das chamadas paralelas (Promise.allSettled):', 'color:#22c55e;font-weight:bold;');
      console.log('Google Apps Script:', gasResult.ok ? '✅ SUCESSO' : '❌ FALHA', gasResult);
      console.log('Supabase:', supaResult.ok ? '✅ SUCESSO' : (supaResult.configured ? '❌ FALHA' : '⏭️  NÃO CONFIGURADO (pulado)'), supaResult);
      console.groupEnd();
      console.groupEnd();
    } catch (err) {
      console.group('%c[Anamnesis] ❌ Erro GLOBAL durante envio (catch externo)', 'color:#ef4444;font-weight:bold;');
      console.error('Detalhes do erro global:', err);
      console.groupEnd();
      setStepError('Não foi possível enviar sua ficha agora. Tente novamente em alguns segundos ou entre em contato pelo WhatsApp.');
      setSending(false);
      setLastReport(report);
      return;
    }

    const ambasFalharam =
      !gasResult.ok &&
      supaResult.configured === true && !supaResult.ok;

    const aoMenosUmaFuncionou = gasResult.ok || supaResult.ok || (!supaResult.configured && gasResult.ok);

    if (ambasFalharam) {
      setStepError('Não foi possível salvar sua ficha no momento. Clique no ícone de WhatsApp abaixo e envie seus dados diretamente para o Thiago.');
    }
    if (!aoMenosUmaFuncionou && !ambasFalharam) {
      setStepError('Não foi possível enviar sua ficha. Confira sua conexão ou use o botão de WhatsApp para contato direto.');
    }

    setSuccess(aoMenosUmaFuncionou || !ambasFalharam ? true : success);
    setSending(false);
    setLastReport(report);
  };

  const progressPercent = success ? 100 : ((step + 1) / TOTAL_STEPS) * 100;

  const objetivoWhats = lastReport?.rowByLetter?.E ?? (() => {
    const g = String(values.goal ?? '');
    if (!g) return '';
    return String({
      emagrecer: 'Emagrecimento',
      hipertrofia: 'Ganho de Massa Muscular',
      mobilidade: 'Saúde Funcional e Mobilidade',
      forca: 'Força e Disposição',
      definicao: 'Definição',
      definicão: 'Definição',
      condicionamento: 'Condicionamento Físico',
    }[g.toLowerCase()] ?? (String(values.goalDetails ?? '').trim() || g));
  })();
  const frequenciaWhats = lastReport?.rowByLetter?.F ?? (() => {
    const f = String(values.frequency ?? '').toLowerCase();
    if (['2x', '1 a 2', '1-2', '1_e_2'].includes(f)) return '1 a 2 vezes por semana';
    if (['3x', '4x', '3 a 4', '3-4', '3_e_4'].includes(f)) return '3 a 4 vezes por semana';
    if (['5xmais', '5x+', '5+', '5 a 6'].includes(f)) return '5 a 6 vezes por semana';
    return f;
  })();
  const lesoesWhats = lastReport?.rowByLetter?.G ?? (values.hasInjury === 's'
    ? String(values.injuryDetails ?? '').trim()
      ? `Sim — ${String(values.injuryDetails).trim().charAt(0).toUpperCase() + String(values.injuryDetails).trim().slice(1)}`
      : 'Sim'
    : 'Não');
  const preferenciaWhats = values.preferencia === 'presencial' ? 'Atendimento Presencial' : values.preferencia === 'online' ? 'Atendimento Online' : values.preferencia === 'qualquer' ? 'Tanto faz' : '';
  const whatsappWhats = lastReport?.rowByLetter?.D ?? formatWhatsApp(values.whatsapp ?? '').formatted;

  const successWhats = encodeURIComponent(
    `Olá Thiago! Acabei de preencher a Ficha de Avaliação no site. Seguem meus dados:

• Nome: ${values.nome}
• Idade: ${values.idade} anos
• WhatsApp: ${whatsappWhats}
• Objetivo principal: ${objetivoWhats || String(values.goal ?? '')}${(values.goalDetails ?? '').trim() && values.goal !== 'outro' ? ` · Detalhes: ${values.goalDetails}` : ''}
• Frequência semanal: ${frequenciaWhats || String(values.frequency ?? '')}
• Lesões / limitações: ${lesoesWhats}
• Preferência de atendimento: ${preferenciaWhats}${(values.rotina ?? '').trim() ? `\n• Observações sobre minha rotina: ${values.rotina}` : ''}

Quando você puder me chamar para conversarmos melhor? Obrigado!`
  );
  const successWhatsLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${successWhats}`;

  const handleDownloadCurrentCSV = () => {
    if (!lastReport) return;
    const csv = buildSheetCSV([lastReport.row]);
    downloadCSV(csv, `ficha-avaliacao-__${Date.now()}.csv`);
  };

  const fieldError = (k: Path<FormValues>) => (errors as unknown as Record<string, { message?: string }>)[k]?.message || undefined;

  const inputBase =
    'w-full rounded-2xl bg-slate-950/40 border text-foreground px-4 sm:px-5 font-bold text-base outline-none transition-all placeholder:text-text-muted/70 ' +
    'focus:ring-2 focus:ring-lime-400/30 ';

  const errRing = 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20';
  const okRing = 'border-slate-800/80 focus:border-lime-400';

  const errorLabel = (msg: string) => (
    <p className="mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold leading-snug text-red-400">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2.5} />
      {msg}
    </p>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogTitle className="sr-only">Ficha de Avaliação — Thiago Mancilha Reis (CREF 008289-G/AM)</DialogTitle>
      <DialogDescription className="sr-only">
        Formulário multi-step de anamnese para agendar sua avaliação gratuita com o personal trainer Thiago Mancilha Reis.
      </DialogDescription>
      <DialogContent
        showCloseButton={false}
        className="!max-w-xl !w-full !mx-0 !rounded-2xl md:!rounded-3xl !bg-slate-950/95 !max-h-[88dvh] md:!max-h-[90dvh] !h-auto !p-0 flex flex-col !gap-0 !border !border-slate-800/80 !shadow-2xl backdrop-blur-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800/60 bg-gradient-to-r from-lime-400/10 via-slate-950 to-slate-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-lime-400/15 border border-lime-400/30 text-lime-400 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-100 text-sm sm:text-base leading-tight">
                Ficha de Avaliação Gratuita
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                CREF 008289-G/AM · Leva menos de 2 minutos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar"
            className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-100 inline-flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.3} />
          </button>
        </div>

        <div className="px-5 sm:px-7 pt-4 pb-3 space-y-2.5 bg-slate-950/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[12px] font-extrabold bg-lime-400/15 border border-lime-400/30 text-lime-400">
                {step + 1}
              </span>
              <p className="text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-slate-300">
                Passo {success ? TOTAL_STEPS : step + 1} de {TOTAL_STEPS}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
              <Clock className="w-3.5 h-3.5" strokeWidth={2.4} />
              ~ 2 min
            </div>
          </div>
          <Progress value={progressPercent} className="h-2 rounded-full bg-slate-800/70" />
        </div>

        <form
          id="anamnesis-form"
          onSubmit={(e) => { e.preventDefault(); void next(); }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <div id="anamnesis-scroll" className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 sm:px-7 py-4 sm:py-5">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center py-2 sm:py-4 space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 -m-4 bg-lime-400/25 blur-3xl rounded-full pointer-events-none" />
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-lime-400 via-lime-300 to-emerald-400 flex items-center justify-center shadow-[0_0_50px_rgba(204,255,0,0.4)]">
                      <PartyPopper className="w-9 h-9 sm:w-11 sm:h-11 text-slate-950" strokeWidth={2.2} />
                    </div>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-lime-400 text-slate-950 border-2 border-slate-950 flex items-center justify-center text-[11px] font-extrabold shadow-lg"
                    >
                      OK!
                    </motion.span>
                  </motion.div>

                  <div className="space-y-2 max-w-md">
                    <h3 className="font-extrabold text-slate-100 text-2xl sm:text-3xl tracking-tight leading-tight">
                      Ficha enviada com <span className="text-lime-400">sucesso</span>!
                    </h3>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                      Recebi seus dados, <strong className="text-slate-100">{String(values.nome || '').trim().split(' ')[0] || 'obrigado'}!</strong> Vou analisar pessoalmente e te chamar no WhatsApp em até <strong className="text-lime-400">24h úteis</strong> para conversarmos e combinarmos sua avaliação.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-md">
                    {[
                      { k: 'Análise rápida', v: '< 24h', Icon: Clock },
                      { k: 'Atendimento', v: '1:1 humano', Icon: Users },
                      { k: 'Plano sob medida', v: 'Individual', Icon: Target },
                    ].map((x) => (
                      <div key={x.k} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 flex flex-col items-start gap-2">
                        <x.Icon className="w-4 h-4 text-lime-400 shrink-0" strokeWidth={2.5} />
                        <p className="font-extrabold text-slate-100 text-xs sm:text-sm leading-tight">{x.v}</p>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 leading-snug">{x.k}</p>
                      </div>
                    ))}
                  </div>

                  <div className="w-full max-w-md space-y-3 pt-2">
                    <a
                      href={successWhatsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 sm:h-14 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] transition-all text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_10px_35px_rgba(37,211,102,0.45)] group"
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                      Falar com o Thiago agora no WhatsApp
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                    </a>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full h-11 sm:h-12 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-200 hover:text-lime-400 hover:border-lime-400/40 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      Fechar esta janela
                    </button>
                  </div>

                  <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-lime-400/30 bg-gradient-to-br from-lime-400/10 via-slate-900 to-slate-900 p-4 sm:p-5 text-left space-y-3">
                    {[
                      { emoji: '🎯', title: 'Seu objetivo é claro', text: 'Agora vem a estratégia e a constância. Vamos juntos!' },
                      { emoji: '🩺', title: 'Avaliação gratuita', text: 'Sem compromisso. Te explico tudo e você decide.' },
                    ].map((t, i) => (
                      <motion.div
                        key={t.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.1 }}
                        className={`flex items-start gap-3 ${i > 0 ? 'mt-0' : ''}`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800 text-lg">
                          {t.emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-100 text-sm sm:text-base leading-tight">{t.title}</p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">{t.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 120, damping: 14 }}
                    className="w-full max-w-md rounded-3xl border border-orange-400/25 bg-gradient-to-br from-orange-400/8 via-slate-900 to-slate-900 p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-orange-400/15 border border-orange-400/30 text-orange-400 shrink-0 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-100 text-sm sm:text-base leading-tight">
                          Correção da planilha · linhas quebradas
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-1">
                          Baixe o CSV abaixo para colar manualmente as <strong className="text-orange-400">células F (Frequencia) e G (lesões)</strong> que ficaram vazias nas últimas linhas da planilha.
                        </p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadCurrentCSV}
                        className="h-11 rounded-2xl bg-lime-400 text-slate-950 hover:bg-lime-300 transition-all font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" strokeWidth={2.3} />
                        Baixar CSV da ficha atual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const rows = (
                              (window as unknown as { __sheetSync__?: { sheetSyncSelfTest: () => unknown[] } }).__sheetSync__?.sheetSyncSelfTest as () => unknown[] | undefined
                            )?.()?.filter?.((p: unknown) => typeof p === 'object' && p !== null && 'rowPrevia' in (p as object)) as Array<{ rowPrevia: string }> | undefined;
                            const sample = (rows ?? []).map((r) => {
                              const parts = String(r.rowPrevia)
                                .split(' | ')
                                .map((s) => s.split('=')[1] ?? '');
                              return parts;
                            });
                            const csv = buildSheetCSV(sample);
                            downloadCSV(csv, `exemplos-lacunas-planilha-__${Date.now()}.csv`);
                          } catch (err) {
                            console.warn('[CSV] Falha ao gerar amostras:', err);
                          }
                        }}
                        className="h-11 rounded-2xl border border-slate-800 bg-slate-900/70 text-slate-200 hover:bg-slate-800 hover:text-lime-400 hover:border-lime-400/30 transition-all font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" strokeWidth={2.3} />
                        Baixar 6 exemplos de teste
                      </button>
                    </div>
                    <p className="text-[10px] sm:text-[11px] leading-snug text-slate-500">
                      💡 Dica: abra o CSV no <strong>Google Sheets</strong> (Arquivo → Importar) e cole as colunas <code className="text-orange-400">F e G</code> nas respectivas linhas que estão vazias.
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  className="space-y-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-lime-400/15 border border-lime-400/35 text-lime-400 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" strokeWidth={2.3} />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-widest font-extrabold">
                        Passo {step + 1} de {TOTAL_STEPS}
                      </p>
                      <h3 className="font-extrabold text-slate-100 text-xl sm:text-2xl leading-tight mt-0.5">
                        {stepTitles[step]}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-400 mt-1.5 leading-relaxed">
                        {stepSubtitles[step]}
                      </p>
                    </div>
                  </div>

                  {stepError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-red-500/35 bg-red-500/10 p-3.5 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" strokeWidth={2.4} />
                      <p className="text-[13px] font-semibold text-red-300 leading-snug">{stepError}</p>
                    </motion.div>
                  )}

                  {step === 0 && (
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          Nome completo
                        </label>
                        <input
                          {...register('nome')}
                          placeholder="Ex: Maria da Silva"
                          type="text"
                          autoComplete="name"
                          className={`${inputBase} h-12 sm:h-14 ${fieldError('nome') ? errRing : okRing}`}
                        />
                        {fieldError('nome') && errorLabel(fieldError('nome') as string)}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                            Idade
                          </label>
                          <input
                            {...register('idade', { valueAsNumber: true })}
                            value={Number.isFinite(getValues('idade')) ? (getValues('idade') as number) : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
                              setValue('idade', (raw === '' ? undefined : Number(raw)) as never, { shouldValidate: true, shouldDirty: true });
                            }}
                            placeholder="Ex: 52"
                            type="text"
                            inputMode="numeric"
                            className={`${inputBase} h-12 sm:h-14 font-display text-xl ${fieldError('idade') ? errRing : okRing}`}
                          />
                          {fieldError('idade') && errorLabel(fieldError('idade') as string)}
                        </div>
                        <div>
                          <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                            Seu WhatsApp
                          </label>
                          <input
                            {...register('whatsapp')}
                            value={getValues('whatsapp') as string}
                            onChange={(e) => {
                              setValue('whatsapp', cleanWhats(e.target.value) as never, { shouldValidate: true, shouldDirty: true });
                            }}
                            placeholder="(00) 00000-0000"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            className={`${inputBase} h-12 sm:h-14 font-display text-xl ${fieldError('whatsapp') ? errRing : okRing}`}
                          />
                          {fieldError('whatsapp') && errorLabel(fieldError('whatsapp') as string)}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          Qual seu objetivo principal?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {goalOptions.map((g) => {
                            const active = values.goal === g.value;
                            const Icon = g.Icon;
                            return (
                              <button
                                type="button"
                                key={g.value}
                                onClick={() => setValue('goal', g.value as never, { shouldValidate: true, shouldDirty: true })}
                                className={`text-left rounded-2xl border p-4 sm:p-5 transition-all flex items-start gap-3 sm:gap-4 group ${
                                  active
                                    ? 'bg-lime-400/12 border-lime-400/60 shadow-[0_0_30px_rgba(204,255,0,0.14)]'
                                    : 'bg-slate-900/35 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                                }`}
                              >
                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex items-center justify-center border ${
                                  active ? 'bg-lime-400/20 text-lime-400 border-lime-400/35' : 'bg-slate-900/70 text-slate-400 border-slate-800'
                                } group-hover:border-slate-700`}>
                                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`font-extrabold text-sm sm:text-base leading-tight ${active ? 'text-slate-100' : 'text-slate-200'}`}>{g.label}</p>
                                  <p className={`text-[11px] mt-0.5 uppercase tracking-widest font-extrabold ${active ? 'text-lime-400' : 'text-slate-500'}`}>{g.tag}</p>
                                </div>
                                {active && <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" strokeWidth={2.5} />}
                              </button>
                            );
                          })}
                        </div>
                        {fieldError('goal') && errorLabel(fieldError('goal') as string)}
                      </div>
                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          Conte mais (opcional, ajuda a personalizar)
                        </label>
                        <textarea
                          {...register('goalDetails')}
                          rows={3}
                          placeholder="Ex: Quero perder 10 kg, tenho dores no joelho e preciso ganhar disposição para brincar com os netos."
                          className={`${inputBase} p-4 font-medium text-sm leading-relaxed resize-none h-auto min-h-[92px] ${fieldError('goalDetails') ? errRing : okRing}`}
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 sm:space-y-5">
                      <div className="rounded-3xl border border-orange-400/20 bg-orange-400/5 p-4 sm:p-5 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" strokeWidth={2.3} />
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-100 text-sm sm:text-base leading-tight">
                            Segurança primeiro
                          </p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">
                            Essa informação é fundamental para eu adaptar cada exercício, evitar dor e, se necessário,
                            conversar com seu fisioterapeuta ou médico.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          Tem ou já teve lesão, dor ou limitação?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { k: 's' as const, label: 'Sim, tenho / já tive', hint: 'Dor, lesão, cirurgia', color: 'orange' },
                            { k: 'n' as const, label: 'Não, nada atualmente', hint: '100% saudável', color: 'lime' },
                          ].map((o) => {
                            const active = values.hasInjury === o.k;
                            const isOrange = o.color === 'orange';
                            return (
                              <button
                                type="button"
                                key={o.k}
                                onClick={() => setValue('hasInjury', o.k as never, { shouldValidate: true, shouldDirty: true })}
                                className={`rounded-2xl border p-4 text-left transition-all ${
                                  active
                                    ? isOrange
                                      ? 'bg-orange-400/12 border-orange-400/50'
                                      : 'bg-lime-400/12 border-lime-400/55 shadow-[0_0_30px_rgba(204,255,0,0.14)]'
                                    : 'bg-slate-900/35 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                                }`}
                              >
                                <p className={`font-extrabold text-sm sm:text-base leading-tight ${active ? 'text-slate-100' : 'text-slate-200'}`}>{o.label}</p>
                                <p className={`text-[11px] mt-0.5 uppercase tracking-widest font-extrabold ${active ? (isOrange ? 'text-orange-400' : 'text-lime-400') : 'text-slate-500'}`}>{o.hint}</p>
                              </button>
                            );
                          })}
                        </div>
                        {fieldError('hasInjury') && errorLabel(fieldError('hasInjury') as string)}
                      </div>

                      {values.hasInjury === 's' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          transition={{ duration: 0.22 }}
                          className="space-y-2"
                        >
                          <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider inline-flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            Quais lesões / dores / limitações? Onde e desde quando?
                          </label>
                          <textarea
                            {...register('injuryDetails')}
                            rows={4}
                            placeholder="Ex: Dor no joelho direito desde 2023 ao agachar; hérnia de disco L4-L5; cirurgia no ombro em 2021..."
                            className={`${inputBase} p-4 font-medium text-sm leading-relaxed resize-none h-auto min-h-[112px] border-orange-500/40 focus:border-orange-400 focus:ring-orange-400/20`}
                          />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          Quantas vezes por semana você consegue se dedicar?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {frequencyOptions.map((f) => {
                            const active = values.frequency === f.value;
                            return (
                              <button
                                type="button"
                                key={f.value}
                                onClick={() => setValue('frequency', f.value as never, { shouldValidate: true, shouldDirty: true })}
                                className={`rounded-2xl border p-4 text-left flex items-center justify-between gap-3 transition-all ${
                                  active ? 'bg-lime-400/12 border-lime-400/55 shadow-[0_0_30px_rgba(204,255,0,0.14)]' : 'bg-slate-900/35 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                                }`}
                              >
                                <p className={`font-extrabold text-sm sm:text-base leading-tight ${active ? 'text-slate-100' : 'text-slate-200'}`}>{f.label}</p>
                                <span className={`shrink-0 px-2.5 h-7 rounded-lg inline-flex items-center text-[11px] font-extrabold uppercase tracking-wider ${
                                  active ? 'bg-lime-400 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                                }`}>{f.chip}</span>
                              </button>
                            );
                          })}
                        </div>
                        {fieldError('frequency') && errorLabel(fieldError('frequency') as string)}
                      </div>

                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          Preferência de atendimento
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {preferenceOptions.map((p) => {
                            const Icon = p.Icon;
                            const active = values.preferencia === p.value;
                            return (
                              <button
                                type="button"
                                key={p.value}
                                onClick={() => setValue('preferencia', p.value as never, { shouldValidate: true, shouldDirty: true })}
                                className={`rounded-2xl border p-3 sm:p-4 flex flex-col items-start gap-2 transition-all ${
                                  active ? 'bg-lime-400/12 border-lime-400/55' : 'bg-slate-900/35 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                                }`}
                              >
                                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-lime-400' : 'text-slate-500'}`} strokeWidth={2.3} />
                                <p className={`font-extrabold text-sm leading-tight ${active ? 'text-slate-100' : 'text-slate-200'}`}>{p.label}</p>
                                <p className={`text-[10px] sm:text-[11px] leading-snug ${active ? 'text-lime-400' : 'text-slate-500'}`}>{p.hint}</p>
                              </button>
                            );
                          })}
                        </div>
                        {fieldError('preferencia') && errorLabel(fieldError('preferencia') as string)}
                      </div>

                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          Observações sobre sua rotina
                          <span className="text-slate-500 normal-case font-medium tracking-normal">· opcional</span>
                        </label>
                        <textarea
                          {...register('rotina')}
                          rows={3}
                          placeholder="Ex: Trabalho home office 8h por dia, acordo às 06:30, tenho 2 filhos pequenos. Prefiro treino antes do almoço ou à noite."
                          className={`${inputBase} p-4 font-medium text-sm leading-relaxed resize-none h-auto min-h-[92px] ${fieldError('rotina') ? errRing : okRing}`}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!success && (
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-slate-800/60 bg-gradient-to-r from-slate-950 via-slate-950 to-lime-400/5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={step === 0 ? onClose : () => { setStepError(null); setStep(step - 1); }}
                className={`h-11 sm:h-12 px-4 sm:px-5 rounded-2xl border font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all ${
                  step === 0
                    ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:border-slate-700'
                }`}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2.3} />
                {step === 0 ? 'Cancelar' : 'Voltar'}
              </button>

              <div className="flex-1 hidden sm:flex items-center justify-center px-2">
                <p className="text-xs text-slate-500 text-center max-w-md">
                  Seus dados são confidenciais. Sem spam, sem compartilhamento.
                </p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className={`h-11 sm:h-12 px-4 sm:px-6 rounded-2xl font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-[0_0_0_1px_rgba(204,255,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
                  step === TOTAL_STEPS - 1
                    ? 'bg-lime-400 text-slate-950 hover:bg-lime-300'
                    : 'bg-gradient-to-r from-lime-400 via-lime-300 to-emerald-400 text-slate-950 hover:brightness-105'
                }`}
              >
                {sending ? (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    Enviando...
                  </>
                ) : step === TOTAL_STEPS - 1 ? (
                  <>
                    <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.3} />
                    Finalizar e Enviar
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.3} />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
