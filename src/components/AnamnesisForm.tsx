import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRight, ArrowLeft, User, Target, Dumbbell,
  ClipboardList, Send, CheckCircle2, CalendarCheck, Zap,
  Flame, Heart, Sparkles, Activity, ShieldCheck, Loader2,
  PartyPopper, MessageCircle,
} from 'lucide-react';

interface AnamnesisFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string;
}

type GoalOption =
  | 'Emagrecimento'
  | 'Ganho de Massa Muscular'
  | 'Condicionamento Físico'
  | 'Definição'
  | 'Reabilitação / Saúde';

type FrequencyOption =
  | 'Sedentário (nenhum)'
  | '1 a 2 vezes por semana'
  | '3 a 4 vezes por semana'
  | '5 a 6 vezes por semana'
  | 'Todos os dias';

const stepsTitles = [
  { id: 1, title: 'Dados Pessoais', icon: User },
  { id: 2, title: 'Seu Objetivo', icon: Target },
  { id: 3, title: 'Histórico de Treino', icon: Dumbbell },
  { id: 4, title: 'Finalizar', icon: ClipboardList },
];

const goals: { value: GoalOption; desc: string; icon: typeof Flame }[] = [
  { value: 'Emagrecimento', desc: 'Queimar gordura e reduzir medidas com saúde.', icon: Flame },
  { value: 'Ganho de Massa Muscular', desc: 'Hipertrofia com foco em evolução consistente.', icon: Dumbbell },
  { value: 'Condicionamento Físico', desc: 'Mais energia, fôlego e performance.', icon: Activity },
  { value: 'Definição', desc: 'Ressaltar músculos eliminando gordura localizada.', icon: Sparkles },
  { value: 'Reabilitação / Saúde', desc: 'Recuperar mobilidade, qualidade de vida e saúde.', icon: Heart },
];

const frequencies: FrequencyOption[] = [
  'Sedentário (nenhum)',
  '1 a 2 vezes por semana',
  '3 a 4 vezes por semana',
  '5 a 6 vezes por semana',
  'Todos os dias',
];

const WHATSAPP_NUMBER = '5548988720439';

const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzth3gCKeJGVHn9XMW1tFjMOuXIcraFu-gV5pb3nIhuvzHGZZaAwcybhwkDpea3SUjK/exec";

export default function AnamnesisForm({ isOpen, onClose, selectedPlan }: AnamnesisFormProps) {
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [goal, setGoal] = useState<GoalOption | null>(null);
  const [frequency, setFrequency] = useState<FrequencyOption | null>(null);
  const [hasInjury, setHasInjury] = useState<boolean | null>(null);
  const [injuryDetails, setInjuryDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsSubmitting(false);
      setIsSubmitted(false);
      setSubmitError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const el = document.getElementById('anamnesis-scroll');
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
    const onVisualResize = () => {
      requestAnimationFrame(() => { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); });
    };
    window.addEventListener('resize', onVisualResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onVisualResize);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onVisualResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onVisualResize);
      }
    };
  }, [step, isOpen, isSubmitting, hasInjury, isSubmitted]);

  const formatWhatsApp = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1:
        return fullName.trim().length >= 3 && /^\d{2}$/.test(age) && whatsapp.replace(/\D/g, '').length >= 10;
      case 2:
        return goal !== null;
      case 3:
        return frequency !== null && hasInjury !== null;
      default:
        return true;
    }
  };

  const buildMessage = () => {
    const firstName = fullName.trim().split(' ')[0] || fullName.trim();

    const lines: string[] = [];
    lines.push(`Olá Thiago!${firstName ? ` Sou o ${firstName},` : ''} acabei de preencher a avaliação no seu site.`);
    lines.push('');
    lines.push('📌 *Minha Ficha:*');
    lines.push(`• *Nome:* ${fullName.trim()} (${age} anos)`);
    lines.push(`• *WhatsApp para contato:* ${whatsapp || 'não informado'}`);
    lines.push(`• *Objetivo:* ${goal || 'não informado'}`);
    lines.push(`• *Frequência de treino:* ${frequency || 'não informada'}`);
    if (hasInjury === true) {
      lines.push(`• *Atenção (lesão / limitação):* ${injuryDetails.trim() ? injuryDetails : 'informei que tenho, mas sem detalhes específicos'}`);
    } else if (hasInjury === false) {
      lines.push(`• *Lesões / limitações:* não tenho nenhuma no momento ✅`);
    }
    if (selectedPlan?.trim()) {
      lines.push('');
      lines.push(`Aliás, me interessei pelo *${selectedPlan}*.`);
    }
    lines.push('');
    lines.push('Quero agendar minha Avaliação Gratuita! 😃');

    return lines.join('\n');
  };

  const openWhatsAppDirect = () => {
    const rawMessage = buildMessage();
    const encodedMessage = encodeURIComponent(rawMessage);
    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const injurySummary = hasInjury
      ? `Sim - ${injuryDetails.trim() ? injuryDetails : 'Sem detalhes'}`
      : 'Não';

    const payload = {
      nome: fullName.trim(),
      idade: age,
      whatsapp: whatsapp,
      objetivo: goal || '',
      historico: {
        frequencia: frequency || '',
        lesao: injurySummary,
      },
      plano_interesse: selectedPlan || '',
      data_envio: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };

    try {
      await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Erro ao enviar para Google Sheets:', err);
      setSubmitError('Não foi possível registrar sua ficha agora. Mas fale diretamente comigo pelo WhatsApp abaixo.');
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveStep = isSubmitted ? 5 : step;
  const progressPct = isSubmitted ? 100 : ((step - 1) / (stepsTitles.length - 1)) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-2 md:mx-auto card-dark !rounded-2xl md:!rounded-3xl !bg-background-card max-h-[85dvh] md:max-h-[88dvh] flex flex-col shadow-2xl border border-white/10 overflow-hidden"
          >
            <div className="sticky top-0 z-20 shrink-0 bg-gradient-to-b from-background-card via-background-card to-background-card/95 border-b border-white/5">
              <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-3 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] uppercase tracking-widest text-accent font-bold">
                      {isSubmitted ? 'Concluído ✓' : `Passo ${step} de ${stepsTitles.length}`}
                    </span>
                  </div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-text-primary leading-tight">
                    Formulário de Avaliação Inicial
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">
                    Menos de 60 segundos. Seus dados vão direto para o meu WhatsApp.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="w-10 h-10 -mr-2 rounded-xl bg-white/5 hover:bg-accent/10 text-text-secondary hover:text-accent border border-white/5 hover:border-accent/40 transition-all flex items-center justify-center shrink-0"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="px-5 sm:px-8 pb-4">
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-accent via-accent-hover to-accent rounded-full"
                  />
                </div>
                <div className="hidden sm:flex justify-between mt-3 gap-1">
                  {stepsTitles.map((s) => {
                    const Active = s.id <= step;
                    return (
                      <div key={s.id} className="flex items-center gap-2 shrink-0 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          Active
                            ? 'bg-accent text-background shadow-neon'
                            : 'bg-white/5 text-text-muted border border-white/5'
                        }`}>
                          <s.icon className="w-3.5 h-3.5" strokeWidth={s.id === step ? 3 : 2.5} />
                        </div>
                        <span className={`text-xs truncate ${Active ? 'text-text-primary font-semibold' : 'text-text-muted'}`}>
                          {s.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth" id="anamnesis-scroll">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="px-5 sm:px-8 py-6 sm:py-8 space-y-5"
                  >
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/5 border border-accent/15">
                      <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-text-primary text-lg">Dados Pessoais</h3>
                        <p className="text-xs text-text-secondary">Primeiro, como podemos te chamar?</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Digite seu nome e sobrenome"
                        className="input-field"
                        autoComplete="name"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Idade
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={2}
                          value={age}
                          onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 28"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          WhatsApp com DDD
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                          placeholder="(11) 98765-4321"
                          className="input-field"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div className="text-xs text-text-secondary leading-relaxed">
                        <span className="font-semibold text-text-primary">Seus dados estão 100% seguros.</span>{' '}
                        Não compartilhamos nada com terceiros.
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="px-5 sm:px-8 py-6 sm:py-8 space-y-5"
                  >
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent-orange/5 border border-accent-orange/15">
                      <div className="w-11 h-11 rounded-xl bg-accent-orange/15 text-accent-orange flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-text-primary text-lg">Qual é o seu objetivo principal?</h3>
                        <p className="text-xs text-text-secondary">Selecione a opção que melhor descreve o que você quer alcançar.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {goals.map((g) => {
                        const selected = goal === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => setGoal(g.value)}
                            className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all group ${
                              selected
                                ? 'bg-accent/10 border-accent/50 shadow-neon'
                                : 'bg-white/5 border-white/10 hover:border-accent/30 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center transition-all ${
                                selected
                                  ? 'bg-accent text-background'
                                  : 'bg-white/5 text-text-secondary group-hover:text-accent'
                              }`}>
                                <g.icon className="w-5 h-5" strokeWidth={2.5} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <p className={`font-display font-bold text-base sm:text-lg ${selected ? 'text-accent' : 'text-text-primary'}`}>
                                    {g.value}
                                  </p>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    selected ? 'border-accent bg-accent' : 'border-white/20'
                                  }`}>
                                    {selected && <CheckCircle2 className="w-4 h-4 text-background" strokeWidth={4} />}
                                  </div>
                                </div>
                                <p className={`text-sm mt-0.5 ${selected ? 'text-text-primary/80' : 'text-text-secondary'}`}>
                                  {g.desc}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="px-5 sm:px-8 py-6 sm:py-8 space-y-6"
                  >
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                      <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-text-primary text-lg">Histórico de Treino</h3>
                        <p className="text-xs text-text-secondary">Para montar um plano 100% alinhado ao seu momento atual.</p>
                      </div>
                    </div>

                    <div>
                      <p className="block text-sm font-semibold text-text-primary mb-3">
                        Frequência atual de treinos
                      </p>
                      <div className="space-y-2">
                        {frequencies.map((f) => {
                          const active = frequency === f;
                          return (
                            <button
                              key={f}
                              onClick={() => setFrequency(f)}
                              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                active
                                  ? 'bg-accent/10 text-accent border-accent/50'
                                  : 'bg-white/5 text-text-secondary border-white/10 hover:border-accent/30 hover:text-text-primary'
                              }`}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5">
                      <p className="block text-sm font-semibold text-text-primary mb-3">
                        Você possui alguma lesão, dor crônica ou limitação física?
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          onClick={() => setHasInjury(false)}
                          className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                            hasInjury === false
                              ? 'bg-accent text-background border-accent shadow-neon'
                              : 'bg-white/5 text-text-secondary border-white/10 hover:border-accent/40 hover:text-accent'
                          }`}
                        >
                          Não, estou bem
                        </button>
                        <button
                          onClick={() => setHasInjury(true)}
                          className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                            hasInjury === true
                              ? 'bg-accent-orange text-white border-accent-orange shadow-[0_0_30px_rgba(255,85,0,0.4)]'
                              : 'bg-white/5 text-text-secondary border-white/10 hover:border-accent-orange/50 hover:text-accent-orange'
                          }`}
                        >
                          Sim, tenho
                        </button>
                      </div>

                      <AnimatePresence>
                        {hasInjury && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <label className="block text-xs font-medium text-text-secondary mb-2">
                              Descreva brevemente (ex: dor no joelho direito, hérnia de disco, etc.)
                            </label>
                            <textarea
                              rows={3}
                              value={injuryDetails}
                              onChange={(e) => setInjuryDetails(e.target.value)}
                              placeholder="Conte com detalhes para eu poder te orientar da melhor forma..."
                              className="input-field resize-none"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5, type: 'spring', damping: 22, stiffness: 240 }}
                    className="px-5 sm:px-8 py-8 sm:py-12"
                  >
                    <div className="text-center max-w-md mx-auto space-y-6">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 blur-2xl bg-accent/40 rounded-full scale-150" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center mx-auto shadow-neon">
                          <motion.div
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.15, type: 'spring', damping: 15, stiffness: 250 }}
                          >
                            <PartyPopper className="w-12 h-12 text-background" strokeWidth={2.2} />
                          </motion.div>
                        </div>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <motion.span
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-accent"
                            initial={{
                              scale: 0,
                              x: 0,
                              y: 0,
                              opacity: 0,
                            }}
                            animate={{
                              scale: [0, 1, 1, 0],
                              x: [0, Math.cos((i * Math.PI) / 3) * (40 + (i % 2) * 20)],
                              y: [0, Math.sin((i * Math.PI) / 3) * (40 + (i % 2) * 20) - 20, Math.sin((i * Math.PI) / 3) * (40 + (i % 2) * 20) - 20],
                              opacity: [0, 1, 1, 0],
                            }}
                            transition={{ delay: 0.2 + i * 0.04, duration: 0.9, ease: 'easeOut' }}
                            style={{
                              background: ['#CCFF00', '#FF5500', '#60A5FA', '#F472B6', '#CCFF00', '#FF5500'][i],
                            }}
                          />
                        ))}
                      </div>

                      <div className="space-y-3">
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-text-primary tracking-tight leading-tight"
                        >
                          Ficha recebida com sucesso!
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45 }}
                          className="text-text-secondary text-base sm:text-lg leading-relaxed"
                        >
                          Obrigado <span className="font-bold text-text-primary">{fullName.split(' ')[0] || 'pelos dados'}</span>!
                          Em breve entrarei em contato para agendar sua Avaliação Gratuita.
                        </motion.p>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className={`rounded-2xl p-4 border flex items-start gap-3 text-left ${
                          submitError
                            ? 'bg-accent-orange/10 border-accent-orange/30'
                            : 'bg-accent/5 border-accent/20'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${submitError ? 'text-accent-orange' : 'text-accent'}`} strokeWidth={2.5} />
                        <p className={`text-sm leading-relaxed ${submitError ? 'text-text-secondary' : 'text-text-secondary'}`}>
                          {submitError || (
                            <>
                              Seus dados foram salvos na minha planilha.{' '}
                              <span className="font-semibold text-text-primary">
                                Já preparei um cupom exclusivo para você no WhatsApp 👇
                              </span>
                            </>
                          )}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="grid gap-3 pt-2"
                      >
                        <button
                          onClick={openWhatsAppDirect}
                          className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-[#25D366] text-white hover:bg-[#1ebe5b] transition-all shadow-[0_8px_30px_rgba(37,211,102,0.4)] group"
                        >
                          <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
                          Falar no WhatsApp agora mesmo
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={onClose}
                          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-transparent text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/25 transition-all text-sm"
                        >
                          Fechar janela
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : step === 4 ? (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="px-5 sm:px-8 py-6 sm:py-8 space-y-6"
                  >
                    <div className="text-center sm:text-left">
                      <div className="w-20 h-20 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto sm:mx-0 mb-5 relative">
                        <div className="absolute inset-0 rounded-full bg-accent/15 animate-ping opacity-30" />
                        <CheckCircle2 className="w-10 h-10 text-accent relative" strokeWidth={2} />
                      </div>
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-text-primary leading-tight">
                        Tudo pronto!
                      </h3>
                      <p className="text-text-secondary mt-2 max-w-md">
                        Revise seus dados abaixo e clique no botão final. Sua ficha será salva automaticamente.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                      <div className="px-5 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wider text-text-muted font-bold">Resumo da Ficha</p>
                        <span className="badge-chip !text-[10px] !py-0.5 !px-2">
                          <Zap className="w-3 h-3" fill="currentColor" strokeWidth={0} />
                          Pronto para envio
                        </span>
                      </div>
                      <dl className="divide-y divide-white/5 text-sm">
                        <div className="grid grid-cols-3 gap-3 px-5 py-3">
                          <dt className="text-text-muted col-span-1">Nome</dt>
                          <dd className="text-text-primary col-span-2 font-medium truncate">{fullName || '—'}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-3 px-5 py-3">
                          <dt className="text-text-muted col-span-1">Idade</dt>
                          <dd className="text-text-primary col-span-2 font-medium">{age ? `${age} anos` : '—'}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-3 px-5 py-3">
                          <dt className="text-text-muted col-span-1">WhatsApp</dt>
                          <dd className="text-text-primary col-span-2 font-medium">{whatsapp || '—'}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-3 px-5 py-3">
                          <dt className="text-text-muted col-span-1">Objetivo</dt>
                          <dd className="text-text-primary col-span-2 font-medium">{goal || '—'}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-3 px-5 py-3">
                          <dt className="text-text-muted col-span-1">Frequência</dt>
                          <dd className="text-text-primary col-span-2 font-medium">{frequency || '—'}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-3 px-5 py-3">
                          <dt className="text-text-muted col-span-1">Lesão / Limitação</dt>
                          <dd className="text-text-primary col-span-2 font-medium">
                            {hasInjury === null
                              ? '—'
                              : hasInjury
                                ? `Sim${injuryDetails.trim() ? `: ${injuryDetails}` : ''}`
                                : 'Não'}
                          </dd>
                        </div>
                        {selectedPlan && (
                          <div className="grid grid-cols-3 gap-3 px-5 py-3">
                            <dt className="text-text-muted col-span-1">Plano</dt>
                            <dd className="text-accent col-span-2 font-bold">{selectedPlan}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="rounded-2xl bg-accent/5 border border-accent/20 p-4 flex items-start gap-3">
                      <Send className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={2} />
                      <div className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                        Ao clicar em <span className="font-semibold text-text-primary">"Enviar Ficha"</span>, seus dados
                        serão salvos na minha planilha. Depois é só falar diretamente comigo no WhatsApp para acelerar o contato!
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {!isSubmitted && (
                  <motion.div
                    key="footer-buttons"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-white/5 px-5 sm:px-8 py-4 sm:py-5 flex items-center gap-3 mt-2"
                  >
                    {step > 1 ? (
                      <button
                        onClick={() => setStep((s) => Math.max(1, s - 1))}
                        disabled={isSubmitting}
                        className="btn-secondary !py-3 !px-5 text-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                        Voltar
                      </button>
                    ) : (
                      <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="btn-secondary !py-3 !px-5 text-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" strokeWidth={2.5} />
                        Cancelar
                      </button>
                    )}

                    {step < 4 ? (
                      <button
                        onClick={() => validateStep(step) && setStep((s) => s + 1)}
                        disabled={!validateStep(step) || isSubmitting}
                        className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                          validateStep(step)
                            ? 'bg-accent text-background hover:bg-accent-hover shadow-neon'
                            : 'bg-white/5 text-text-muted cursor-not-allowed'
                        } disabled:opacity-60`}
                      >
                        {validateStep(step) ? 'Continuar' : 'Preencha para continuar'}
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all disabled:opacity-80 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(37,211,102,0.4)] group"
                        style={{
                          background: isSubmitting ? 'rgba(204, 255, 0, 0.9)' : '#25D366',
                          color: isSubmitting ? '#0B0F17' : '#fff',
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                            Enviando sua ficha...
                          </>
                        ) : (
                          <>
                            Enviar Ficha
                            <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
