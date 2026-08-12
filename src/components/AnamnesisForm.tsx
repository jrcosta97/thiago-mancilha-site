import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Heart, Dumbbell, ClipboardList, CheckCircle2, ArrowRight, ArrowLeft, PartyPopper, CalendarDays, MessageCircle,
  AlertTriangle, Activity, ThumbsUp, ChevronRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const WHATSAPP_NUMBER = '5548988720439';

interface AnamnesisFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const stepHeaders = [
  { icon: User, title: '1. Dados básicos', subtitle: 'Para eu te conhecer' },
  { icon: Activity, title: '2. Objetivo', subtitle: 'Para onde você quer chegar' },
  { icon: Heart, title: '3. Saúde & Lesões', subtitle: 'Para montar um treino seguro' },
  { icon: ClipboardList, title: '4. Rotina', subtitle: 'Para encaixar na sua vida' },
];

const goalOptions = [
  { value: 'emagrecer', label: 'Emagrecer com saúde', icon: Heart, tag: 'Emagrecimento' },
  { value: 'hipertrofia', label: 'Ganhar massa muscular', icon: Dumbbell, tag: 'Hipertrofia' },
  { value: 'mobilidade', label: 'Melhorar mobilidade / dor', icon: Activity, tag: 'Saúde Funcional' },
  { value: 'forca', label: 'Mais força e disposição', icon: ThumbsUp, tag: 'Qualidade de vida' },
  { value: 'outro', label: 'Outro (conto no campo)', icon: ClipboardList, tag: 'Outro' },
];

const frequencyOptions = [
  { value: '2x', label: '2x por semana', tag: '2x' },
  { value: '3x', label: '3x por semana (mais comum)', tag: '3x' },
  { value: '4x', label: '4x por semana', tag: '4x' },
  { value: '5xmais', label: '5x ou mais por semana', tag: '5x+' },
];

export default function AnamnesisForm({ isOpen, onClose }: AnamnesisFormProps) {
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [goal, setGoal] = useState<string>('');
  const [goalDetails, setGoalDetails] = useState('');
  const [frequency, setFrequency] = useState<string>('');
  const [hasInjury, setHasInjury] = useState<'s' | 'n' | ''>('');
  const [injuryDetails, setInjuryDetails] = useState('');
  const [rotina, setRotina] = useState('');
  const [preferencia, setPreferencia] = useState<'presencial' | 'online' | 'qualquer' | ''>('');

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSending(false);
      setSuccess(false);
      setNome(''); setIdade(''); setWhatsapp('');
      setGoal(''); setGoalDetails(''); setFrequency('');
      setHasInjury(''); setInjuryDetails(''); setRotina(''); setPreferencia('');
    }
  }, [isOpen]);

  const progress = success ? 100 : ((step + 1) / stepHeaders.length) * 100;

  const invalidStep = (): boolean => {
    if (success || sending) return true;
    if (step === 0) return !nome.trim() || !idade || !whatsapp.replace(/\D/g, '').length || parseInt(idade, 10) < 12;
    if (step === 1) return !goal;
    if (step === 2) return !hasInjury || (hasInjury === 's' && injuryDetails.trim().length < 5);
    if (step === 3) return !frequency || !preferencia;
    return false;
  };

  const next = () => {
    if (invalidStep()) return;
    if (step < stepHeaders.length - 1) setStep(step + 1);
    else submit();
  };

  const submit = async () => {
    if (sending) return;
    setSending(true);
    const payload = {
      nome, idade, whatsapp, objetivo: goal,
      detalhes_objetivo: goalDetails,
      frequencia: frequency,
      tem_lesao: hasInjury, lesao_detalhes: injuryDetails,
      rotina, preferencia,
      source: 'anamnese-site', data: new Date().toISOString(),
    };
    try {
      const WEBHOOK = 'https://script.google.com/macros/s/AKfycbzWebhookPlaceholder/exec';
      await fetch(WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      }).catch(() => void 0);
    } catch {
      // no-op: continue regardless for UX; user will also reach WhatsApp.
    }
    setSuccess(true);
    setSending(false);
  };

  const cleanWhats = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const successWhats = encodeURIComponent(
    `Olá Thiago! Acabei de preencher a Ficha de Avaliação no site. Seguem meus dados:

• Nome: ${nome}
• Idade: ${idade} anos
• WhatsApp: ${whatsapp}
• Objetivo principal: ${goalOptions.find((o) => o.value === goal)?.label || goal}${goalDetails ? ` · Detalhes: ${goalDetails}` : ''}
• Frequência: ${frequencyOptions.find((o) => o.value === frequency)?.label || frequency}
• Lesões / limitações: ${hasInjury === 's' ? `Sim — ${injuryDetails}` : 'Não'}
• Preferência de atendimento: ${preferencia === 'presencial' ? 'Presencial' : preferencia === 'online' ? 'Online' : 'Tanto faz'}${rotina ? `\n• Rotina extra: ${rotina}` : ''}

Quando você puder me chamar para conversarmos melhor? Obrigado!`
  );
  const successWhatsLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${successWhats}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogTitle className="sr-only">Ficha de Avaliação — Thiago Mancilha Reis (CREF 008289-G/AM)</DialogTitle>
      <DialogDescription className="sr-only">
        Formulário multi-step de anamnese para agendar sua avaliação gratuita com o personal trainer Thiago Mancilha Reis.
      </DialogDescription>
      <DialogContent
        showCloseButton={false}
        className="!max-w-2xl !w-full !mx-0 !rounded-2xl md:!rounded-3xl !bg-popover !max-h-[85dvh] md:!max-h-[88dvh] !h-auto !p-0 flex flex-col !gap-0 !border !border-white/10 !shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/5 bg-gradient-to-r from-accent/10 via-card to-card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/20 border border-accent/30 text-accent flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="font-display font-black text-text-primary text-sm sm:text-base leading-tight">
                Ficha de Avaliação Gratuita
              </p>
              <p className="text-[11px] sm:text-xs text-text-muted truncate">
                CREF 008289-G/AM · Leva menos de 2 minutos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar"
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/4 text-text-secondary hover:bg-white/10 hover:text-text-primary inline-flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-4.5 h-4.5" strokeWidth={2.3} />
          </button>
        </div>

        <div className="px-5 sm:px-7 pt-4 pb-2 space-y-3 sm:space-y-4 bg-card/60">
          <div className="h-1.5 w-full rounded-full bg-white/6 overflow-hidden">
            <motion.div
              key={progress}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-accent via-lime-400 to-emerald-400 shadow-[0_0_18px_rgba(204,255,0,0.4)]"
            />
          </div>
          <div className="hidden sm:flex items-center justify-between gap-2">
            {stepHeaders.map((h, i) => {
              const Icon = h.icon;
              const active = i === step && !success;
              const done = i < step || success;
              return (
                <div key={h.title} className="flex-1">
                  <div className="flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      done ? 'bg-accent text-background' : active ? 'bg-accent/15 text-accent border border-accent/40' : 'bg-white/5 text-text-muted border border-white/8'
                    }`}>
                      {done ? <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={3} /> : <Icon className="w-4 h-4" strokeWidth={2.2} />}
                    </div>
                    <div className="min-w-0 hidden md:block">
                      <p className={`text-[11px] font-black uppercase tracking-wider leading-tight ${active ? 'text-accent' : done ? 'text-text-primary' : 'text-text-muted'}`}>{h.title.split('. ')[1] || h.title}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 truncate">{h.subtitle}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="anamnesis-scroll" className="flex-1 min-h-0 overflow-y-auto no-scrollbar scroll-fade scroll-fade-b-8 px-5 sm:px-7 py-5 sm:py-6 space-y-5">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center py-4 sm:py-6 space-y-5"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                  className="relative"
                >
                  <div className="absolute inset-0 -m-4 bg-accent/25 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-accent via-lime-400 to-emerald-400 flex items-center justify-center shadow-[0_0_50px_rgba(204,255,0,0.4)]">
                    <PartyPopper className="w-9 h-9 sm:w-11 sm:h-11 text-background" strokeWidth={2.2} />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-accent-orange text-background border-2 border-background flex items-center justify-center text-[11px] font-black shadow-lg"
                  >
                    OK!
                  </motion.span>
                </motion.div>

                <div className="space-y-2 max-w-md">
                  <h3 className="font-display font-black text-text-primary text-2xl sm:text-3xl tracking-tight leading-tight">
                    Ficha enviada com <span className="text-gradient">sucesso</span>!
                  </h3>
                  <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
                    Recebi seus dados, <strong className="text-text-primary">{nome.trim().split(' ')[0] || 'obrigado'}!</strong> Vou analisar pessoalmente e te chamar no WhatsApp em até <strong className="text-accent">24h úteis</strong> para conversarmos e combinarmos sua avaliação.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-md">
                  {[
                    { k: 'Análise rápida', v: '< 24h' },
                    { k: 'Atendimento', v: '1:1 humano' },
                    { k: 'Plano sob medida', v: 'Individual' },
                  ].map((x) => (
                    <div key={x.k} className="rounded-2xl border border-white/8 bg-card p-3 sm:p-4 flex flex-col items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" strokeWidth={2.5} />
                      <p className="font-display font-black text-text-primary text-xs sm:text-sm leading-tight">{x.v}</p>
                      <p className="text-[10px] sm:text-[11px] text-text-muted leading-snug">{x.k}</p>
                    </div>
                  ))}
                </div>

                <div className="w-full max-w-md space-y-3 pt-2">
                  <a
                    href={successWhatsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 sm:h-14 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] transition-all text-background font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_10px_35px_rgba(37,211,102,0.45)] group"
                  >
                    <MessageCircle className="w-4.5 h-4.5" strokeWidth={2.3} fill="currentColor" />
                    Falar com o Thiago agora no WhatsApp
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                  </a>
                  <button
                    onClick={onClose}
                    className="w-full h-11 sm:h-12 rounded-2xl border border-white/10 bg-white/4 hover:bg-white/8 text-slate-200 hover:text-accent hover:border-accent/40 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    Fechar esta janela
                  </button>
                </div>

                <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-4 sm:p-5">
                  {[
                    { emoji: '🎯', title: 'Seu objetivo é claro', text: 'Agora vem a estratégia e a constância. Vamos juntos!' },
                    { emoji: '🩺', title: 'Avaliação gratuita', text: 'Sem compromisso. Te explico tudo e você decide o melhor para você.' },
                  ].map((t, i) => (
                    <motion.div
                      key={t.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.1 }}
                      className={`flex items-start gap-3 ${i > 0 ? 'mt-3' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center shrink-0 border border-white/8 text-lg">
                        {t.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-black text-text-primary text-sm sm:text-base leading-tight">{t.title}</p>
                        <p className="text-xs sm:text-sm text-text-secondary mt-0.5 leading-relaxed">{t.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-5"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent/15 border border-accent/35 text-accent flex items-center justify-center shrink-0">
                    {(() => { const Icon = stepHeaders[step].icon; return <Icon className="w-5.5 h-5.5" strokeWidth={2.2} />; })()}
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-text-muted uppercase tracking-widest font-black">
                      Passo {step + 1} de {stepHeaders.length}
                    </p>
                    <h3 className="font-display font-black text-text-primary text-xl sm:text-2xl leading-tight mt-0.5">
                      {stepHeaders[step].title.split('. ')[1] || stepHeaders[step].title}
                    </h3>
                    <p className="text-sm sm:text-base text-text-secondary mt-1.5 leading-relaxed">
                      {stepHeaders[step].subtitle}. Informações simples, sem burocracia.
                    </p>
                  </div>
                </div>

                {step === 0 && (
                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Nome completo
                      </label>
                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Maria da Silva"
                        type="text"
                        className="w-full h-12 sm:h-14 rounded-2xl bg-background/60 border border-white/10 text-foreground px-4 sm:px-5 font-bold text-base outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-text-muted/70"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Idade
                        </label>
                        <input
                          value={idade}
                          onChange={(e) => setIdade(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          placeholder="Ex: 52"
                          type="text"
                          inputMode="numeric"
                          className="w-full h-12 sm:h-14 rounded-2xl bg-background/60 border border-white/10 text-foreground px-4 sm:px-5 font-display font-black text-xl outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-text-muted/70"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Seu WhatsApp
                        </label>
                        <input
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(cleanWhats(e.target.value))}
                          placeholder="(00) 00000-0000"
                          type="tel"
                          inputMode="tel"
                          className="w-full h-12 sm:h-14 rounded-2xl bg-background/60 border border-white/10 text-foreground px-4 sm:px-5 font-display font-black text-xl outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-text-muted/70"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {goalOptions.map((g) => {
                        const Icon = g.icon;
                        const active = goal === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => setGoal(g.value)}
                            className={`text-left rounded-2xl border p-4 sm:p-5 transition-all flex items-start gap-3 sm:gap-4 ${
                              active
                                ? 'bg-accent/12 border-accent/55 shadow-[0_0_30px_rgba(204,255,0,0.14)]'
                                : 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/15'
                            }`}
                          >
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex items-center justify-center border ${
                              active ? 'bg-accent/20 text-accent border-accent/35' : 'bg-white/5 text-text-secondary border-white/8'
                            }`}>
                              <Icon className="w-5 h-5" strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-display font-black text-sm sm:text-base leading-tight ${active ? 'text-text-primary' : 'text-text-secondary'}`}>{g.label}</p>
                              <p className={`text-[11px] mt-0.5 uppercase tracking-widest font-bold ${active ? 'text-accent' : 'text-text-muted'}`}>{g.tag}</p>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 transition-transform ${active ? 'text-accent translate-x-0.5' : 'text-text-muted'}`} strokeWidth={2.2} />
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Conte mais (opcional, ajuda a personalizar)
                      </label>
                      <textarea
                        value={goalDetails}
                        onChange={(e) => setGoalDetails(e.target.value)}
                        rows={3}
                        placeholder="Ex: Quero perder 10 kg, tenho dores no joelho e preciso ganhar disposição para brincar com os netos."
                        className="w-full rounded-2xl bg-background/60 border border-white/10 text-foreground p-4 font-medium text-sm leading-relaxed outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-text-muted/70 resize-none"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 sm:space-y-5">
                    <div className="rounded-3xl border border-white/8 bg-card p-4 sm:p-5 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={2.2} />
                      <div className="min-w-0">
                        <p className="font-display font-black text-text-primary text-sm sm:text-base leading-tight">
                          Segurança primeiro
                        </p>
                        <p className="text-xs sm:text-sm text-text-secondary mt-0.5 leading-relaxed">
                          Essa informação é fundamental para eu adaptar cada exercício, evitar dor e, se necessário,
                          conversar com seu fisioterapeuta/médico. Pode ser sincero.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { k: 's', label: 'Sim, tenho / já tive', hint: 'Dor, lesão, cirurgia' },
                        { k: 'n', label: 'Não, nada atualmente', hint: '100% saudável' },
                      ].map((o) => {
                        const active = hasInjury === o.k;
                        return (
                          <button
                            key={o.k}
                            type="button"
                            onClick={() => setHasInjury(o.k as 's' | 'n')}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              active
                                ? o.k === 's'
                                  ? 'bg-accent-orange/12 border-accent-orange/50'
                                  : 'bg-accent/12 border-accent/55 shadow-[0_0_30px_rgba(204,255,0,0.14)]'
                                : 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/15'
                            }`}
                          >
                            <p className={`font-display font-black text-sm sm:text-base leading-tight ${active ? 'text-text-primary' : 'text-text-secondary'}`}>{o.label}</p>
                            <p className={`text-[11px] mt-0.5 uppercase tracking-widest font-bold ${active ? (o.k === 's' ? 'text-accent-orange' : 'text-accent') : 'text-text-muted'}`}>{o.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                    {hasInjury === 's' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
                          Quais lesões / dores / limitações? Onde e desde quando?
                        </label>
                        <textarea
                          value={injuryDetails}
                          onChange={(e) => setInjuryDetails(e.target.value)}
                          rows={4}
                          placeholder="Ex: Dor no joelho direito desde 2023 ao agachar; hérnia de disco L4-L5; cirurgia no ombro em 2021..."
                          className="w-full rounded-2xl bg-background/60 border border-white/10 text-foreground p-4 font-medium text-sm leading-relaxed outline-none transition-all focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/30 placeholder:text-text-muted/70 resize-none"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Quantas vezes por semana você consegue se dedicar ao treino?
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {frequencyOptions.map((f) => {
                          const active = frequency === f.value;
                          return (
                            <button
                              key={f.value}
                              type="button"
                              onClick={() => setFrequency(f.value)}
                              className={`rounded-2xl border p-4 text-left flex items-center justify-between gap-3 transition-all ${
                                active ? 'bg-accent/12 border-accent/55 shadow-[0_0_30px_rgba(204,255,0,0.14)]' : 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/15'
                              }`}
                            >
                              <p className={`font-display font-black text-sm sm:text-base leading-tight ${active ? 'text-text-primary' : 'text-text-secondary'}`}>{f.label}</p>
                              <span className={`shrink-0 px-2.5 h-7 rounded-lg inline-flex items-center text-[11px] font-black uppercase tracking-wider ${
                                active ? 'bg-accent text-background' : 'bg-white/5 text-text-muted border border-white/8'
                              }`}>{f.tag}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Preferência de atendimento
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { k: 'presencial', label: 'Presencial', icon: CalendarDays, hint: 'Studio / Casa' },
                          { k: 'online', label: 'Online', icon: MessageCircle, hint: 'WhatsApp / Planilha' },
                          { k: 'qualquer', label: 'Tanto faz', icon: ThumbsUp, hint: 'O que couber' },
                        ].map((p) => {
                          const Icon = p.icon;
                          const active = preferencia === p.k;
                          return (
                            <button
                              key={p.k}
                              type="button"
                              onClick={() => setPreferencia(p.k as 'presencial' | 'online' | 'qualquer')}
                              className={`rounded-2xl border p-3 sm:p-4 flex flex-col items-start gap-2 transition-all ${
                                active ? 'bg-accent/12 border-accent/55' : 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/15'
                              }`}
                            >
                              <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-accent' : 'text-text-muted'}`} strokeWidth={2.2} />
                              <p className={`font-display font-black text-sm leading-tight ${active ? 'text-text-primary' : 'text-text-secondary'}`}>{p.label}</p>
                              <p className={`text-[10px] sm:text-[11px] leading-snug ${active ? 'text-accent' : 'text-text-muted'}`}>{p.hint}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        Observações sobre sua rotina (horários, trabalho, filhos, sono...)
                        <span className="text-text-muted normal-case font-medium tracking-normal">· opcional</span>
                      </label>
                      <textarea
                        value={rotina}
                        onChange={(e) => setRotina(e.target.value)}
                        rows={3}
                        placeholder="Ex: Trabalho de home office 8h por dia, acordo às 06:30, tenho 2 filhos pequenos. Prefiro treino antes do almoço ou à noite."
                        className="w-full rounded-2xl bg-background/60 border border-white/10 text-foreground p-4 font-medium text-sm leading-relaxed outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-text-muted/70 resize-none"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!success && (
          <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-white/5 bg-gradient-to-r from-card via-card to-accent/5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={step === 0 ? onClose : () => setStep(step - 1)}
              className={`h-11 sm:h-12 px-4 sm:px-5 rounded-2xl border border-white/10 font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all ${
                step === 0
                  ? 'bg-white/4 text-text-secondary hover:bg-white/8 hover:text-text-primary'
                  : 'bg-white/4 text-text-secondary hover:bg-white/8 hover:text-text-primary hover:border-white/20'
              }`}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2.3} />
              {step === 0 ? 'Cancelar' : 'Voltar'}
            </button>

            <div className="flex-1 hidden sm:flex items-center justify-center px-2">
              <p className="text-xs text-text-muted text-center max-w-md">
                Seus dados são confidenciais e usados apenas para a avaliação personalizada. Sem spam, sem compartilhamento.
              </p>
            </div>

            <button
              type="button"
              onClick={next}
              disabled={invalidStep() || sending}
              className={`h-11 sm:h-12 px-4 sm:px-6 rounded-2xl font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-neon disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
                step === stepHeaders.length - 1
                  ? 'bg-accent text-background hover:bg-accent-hover'
                  : 'bg-gradient-to-r from-accent via-lime-400 to-emerald-400 text-background hover:brightness-105'
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
              ) : step === stepHeaders.length - 1 ? (
                <>
                  <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
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
      </DialogContent>
    </Dialog>
  );
}
