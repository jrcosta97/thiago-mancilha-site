import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  LogIn,
  ArrowLeft,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSupabase, isSupabaseConfigured, runSupabaseDiagnostics, type SupabaseDiagnosticReport } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z
    .string({ required_error: 'Informe seu e-mail' })
    .email('Informe um e-mail válido')
    .trim(),
  password: z
    .string({ required_error: 'Informe sua senha' })
    .min(6, 'Senha muito curta (mínimo 6 caracteres)'),
});

type LoginValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const [loading, setLoading] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<SupabaseDiagnosticReport | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [supabaseOk, setSupabaseOk] = useState<boolean>(() => isSupabaseConfigured());

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        setSupabaseOk(false);
        return;
      }
      const sb = getSupabase();
      if (!sb) return;
      try {
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (session && mounted) navigate(from, { replace: true });
      } catch {
        /* no-op */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [from, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    if (loading) return;
    const sb = getSupabase();
    if (!sb) {
      setFeedbackType('error');
      setFeedbackMsg('Supabase não está configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.');
      return;
    }
    setLoading(true);
    setFeedbackType(null);
    setFeedbackMsg(null);

    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      if (data?.session) {
        setFeedbackType('success');
        setFeedbackMsg('Login realizado com sucesso. Redirecionando...');
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message ?? 'Erro ao fazer login')
          : 'Erro ao fazer login. Verifique suas credenciais.';
      setFeedbackType('error');
      setFeedbackMsg(msg.includes('Invalid') || msg.includes('password') || msg.includes('credentials')
        ? 'Credenciais inválidas. Verifique e-mail e senha.'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    if (diagnosticLoading) return;
    setDiagnosticLoading(true);
    setDiagnosticReport(null);
    try {
      const report = await runSupabaseDiagnostics();
      setDiagnosticReport(report);
      setFeedbackType(report.ok ? 'success' : 'info');
      setFeedbackMsg(
        report.ok
          ? 'Supabase respondeu nos testes básicos. Se o login ainda falhar, o próximo suspeito é credencial, usuário ou regra de auth.'
          : 'O diagnóstico encontrou um ou mais pontos com falha. Veja os checks abaixo para isolar o problema.'
      );
    } catch (err) {
      setFeedbackType('error');
      setFeedbackMsg(
        err instanceof Error
          ? `Falha ao rodar diagnóstico: ${err.message}`
          : 'Falha ao rodar diagnóstico do Supabase.'
      );
    } finally {
      setDiagnosticLoading(false);
    }
  };

  return (
    <section className="min-h-screen w-full bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[560px] bg-lime-400/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-0 w-[460px] h-[460px] bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-md w-full mx-auto px-4 py-10 sm:py-16 min-h-screen flex flex-col justify-center">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 rounded-lg px-2 py-1 ring-offset-background">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Voltar para o site
          </Link>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-lime-400/30 bg-lime-400/10 text-[11px] font-bold uppercase tracking-widest text-lime-300">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md shadow-[0_30px_80px_rgba(0,0,0,0.45)] p-6 sm:p-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-400/25 text-lime-400 flex items-center justify-center shrink-0">
              <LogIn className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-display font-black text-xl sm:text-2xl tracking-tight text-foreground">
                Acesso Administrativo
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Entre com suas credenciais para acessar o painel de alunos.
              </p>
            </div>
          </div>

          {!supabaseOk && (
            <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold text-amber-300 mb-0.5">Supabase não configurado</p>
                <p className="text-amber-200/80 leading-relaxed">
                  Adicione as variáveis <span className="font-mono text-xs bg-amber-400/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</span> e{' '}
                  <span className="font-mono text-xs bg-amber-400/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</span> no arquivo{' '}
                  <code className="font-mono text-xs">.env</code> ou no painel Vercel.
                </p>
              </div>
            </div>
          )}

          {feedbackType && (
            <div
              role="status"
              className={cn(
                'mb-5 rounded-xl border p-3.5 flex gap-3 items-start text-sm',
                feedbackType === 'success' && 'border-emerald-500/30 bg-emerald-500/10',
                feedbackType === 'error' && 'border-red-500/30 bg-red-500/10',
                feedbackType === 'info' && 'border-sky-500/30 bg-sky-500/10'
              )}
            >
              {feedbackType === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {feedbackType === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              {feedbackType === 'info' && <RefreshCcw className="w-5 h-5 text-sky-400 shrink-0 mt-0.5 animate-spin" />}
              <p
                className={cn(
                  'leading-relaxed',
                  feedbackType === 'success' && 'text-emerald-200',
                  feedbackType === 'error' && 'text-red-200',
                  feedbackType === 'info' && 'text-sky-200'
                )}
              >
                {feedbackMsg}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-slate-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com.br"
                  className={cn(
                    'w-full pl-10 pr-3 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 placeholder:text-slate-500 text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 focus-visible:border-lime-400 transition-all duration-300',
                    errors.email && 'border-red-500/70 focus-visible:ring-red-400'
                  )}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full pl-10 pr-3 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 placeholder:text-slate-500 text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 focus-visible:border-lime-400 transition-all duration-300',
                    errors.password && 'border-red-500/70 focus-visible:ring-red-400'
                  )}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !supabaseOk || !isValid}
              className={cn(
                'w-full py-3 rounded-xl font-bold tracking-wide uppercase text-sm',
                'bg-lime-400 text-black hover:bg-lime-300 border border-lime-400/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lime-400 ring-offset-background',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-xs text-muted-foreground leading-relaxed">
            <div className="mb-5 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Diagnóstico rápido do Supabase</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Testa ambiente, reachability do `auth` e health check da Edge Function.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRunDiagnostics}
                  disabled={diagnosticLoading}
                  className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200"
                >
                  {diagnosticLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      Testando...
                    </span>
                  ) : (
                    'Testar conexão'
                  )}
                </Button>
              </div>

              {diagnosticReport && (
                <div className="mt-4 space-y-2">
                  {diagnosticReport.steps.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-xs',
                        step.ok
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100'
                          : 'border-red-500/20 bg-red-500/5 text-red-100'
                      )}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {step.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span>{step.label}</span>
                        {typeof step.statusCode === 'number' && (
                          <span className="text-[11px] opacity-80">HTTP {step.statusCode}</span>
                        )}
                      </div>
                      <p className="mt-1 leading-relaxed opacity-90">{step.message}</p>
                      {step.details && (
                        <code className="mt-1 block whitespace-pre-wrap break-all text-[11px] opacity-75">
                          {step.details}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p>
              <span className="font-semibold text-slate-300">Dica:</span> crie o usuário administrador através do{' '}
              <span className="font-mono bg-slate-800/70 px-1.5 py-0.5 rounded">SQL Editor</span> do Supabase ou no
              painel Authentication → Users.
            </p>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/70 tracking-wide">
          © {new Date().getFullYear()} Thiago Mancilha Reis · Painel Administrativo
        </p>
      </div>
    </section>
  );
}
