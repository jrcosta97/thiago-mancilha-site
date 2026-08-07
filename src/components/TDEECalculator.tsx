import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Flame, Target, Activity, ArrowRight, Droplet, Sparkles,
  AlertTriangle, MessageCircle, Scale, Dumbbell, Scissors,
} from 'lucide-react';

interface TDEECalculatorProps {
  onCTAClick: (plan?: string) => void;
}

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
type Goal = 'lose' | 'gain' | 'define';

const WHATSAPP_NUMBER = '5548988720439';

const activityMultipliers: Record<ActivityLevel, { value: number; label: string; hint: string }> = {
  sedentary: { value: 1.2, label: 'Sedentário', hint: 'Pouca ou nenhuma atividade física' },
  light: { value: 1.375, label: 'Leve', hint: '1-3 dias/semana de atividade' },
  moderate: { value: 1.55, label: 'Moderado', hint: '3-5 dias/semana de atividade' },
  high: { value: 1.725, label: 'Ativo', hint: '6-7 dias/semana de atividade' },
  athlete: { value: 1.9, label: 'Atleta', hint: 'Treino diário + trabalho físico' },
};

const goalLabels: Record<Goal, {
  label: string;
  short: string;
  color: string;
  icon: typeof Droplet;
  unitKey: 'deficit' | 'surplus' | 'deficit';
  intro: (tdee: number, kcal: number) => string;
}> = {
  lose: {
    label: 'Emagrecimento',
    short: 'Emagrecer',
    color: 'text-blue-400',
    icon: Droplet,
    unitKey: 'deficit',
    intro: (tdee, kcal) =>
      `Seu corpo gasta ${tdee.toLocaleString('pt-BR')} kcal por dia em movimento e repouso. Para perder gordura de forma definitiva, sem perder massa muscular e sem efeito sanfona, sua meta diária deve ser de ${kcal.toLocaleString('pt-BR')} kcal combinadas com um treino de força adequado.`,
  },
  gain: {
    label: 'Ganho de Massa Muscular',
    short: 'Hipertrofia',
    color: 'text-accent-orange',
    icon: Dumbbell,
    unitKey: 'surplus',
    intro: (tdee, kcal) =>
      `Seu corpo gasta ${tdee.toLocaleString('pt-BR')} kcal por dia em movimento e repouso. Para construir massa magra de qualidade e acelerar seu metabolismo a longo prazo, você precisará consumir cerca de ${kcal.toLocaleString('pt-BR')} kcal com a distribuição correta de proteínas, carboidratos e gorduras boas.`,
  },
  define: {
    label: 'Definição Muscular',
    short: 'Definir',
    color: 'text-accent',
    icon: Scissors,
    unitKey: 'deficit',
    intro: (tdee, kcal) =>
      `Seu corpo gasta ${tdee.toLocaleString('pt-BR')} kcal por dia em movimento e repouso. Para revelar a massa muscular que você já construiu, sem perder tamanho e força, sua meta diária deve ficar perto de ${kcal.toLocaleString('pt-BR')} kcal com um planejamento inteligente de treino + dieta.`,
  },
};

export default function TDEECalculator({ onCTAClick }: TDEECalculatorProps) {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('male');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('lose');

  const results = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (!w || !h || !a) return null;

    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }
    const tdee = bmr * activityMultipliers[activity].value;
    const deficit = tdee - 500;
    const surplus = tdee + 400;

    let plan: string;
    if (tdee < 1800) plan = 'Consultoria Online';
    else if (tdee < 2400) plan = 'Personal Presencial';
    else plan = 'Plano Anual Transformação';

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      deficit: Math.round(deficit),
      surplus: Math.round(surplus),
      plan,
    };
  }, [weight, height, age, gender, activity]);

  const activityKeys = Object.keys(activityMultipliers) as ActivityLevel[];

  return (
    <section className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-5"
          >
            <span className="badge-chip w-fit">
              <Calculator className="w-3.5 h-3.5" />
              FERRAMENTA INTERATIVA
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
              Calculadora de <span className="text-gradient">Gasto Calórico</span>
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed">
              Descubra em segundos seu TDEE (Gasto Calórico Diário Total) e receba uma recomendação personalizada do plano ideal para alcançar seu objetivo.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                'Cálculo preciso baseado em fórmula científica (Mifflin-St Jeor)',
                'Recomendação de plano conforme seu perfil',
                'Resultados para emagrecimento, manutenção ou hipertrofia',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-text-secondary leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="card-dark !bg-gradient-to-br !from-background-card to-background p-6 sm:p-8 lg:p-10">
              <div className="grid sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">Peso (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 75.5"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">Altura (cm)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Ex: 175"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">Idade</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ex: 30"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">Sexo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['male', 'female'] as Gender[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                          gender === g
                            ? 'bg-accent text-background border-accent shadow-neon'
                            : 'bg-white/5 text-text-secondary border-white/10 hover:border-accent/40 hover:text-accent'
                        }`}
                      >
                        {g === 'male' ? 'Masculino' : 'Feminino'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  <Activity className="w-4 h-4 inline mr-2 -mt-1 text-accent" strokeWidth={2.5} />
                  Nível de Atividade Física
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {activityKeys.map((key) => (
                    <button
                      key={key}
                      title={activityMultipliers[key].hint}
                      onClick={() => setActivity(key)}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all border ${
                        activity === key
                          ? 'bg-accent/15 text-accent border-accent/50'
                          : 'bg-white/5 text-text-secondary border-white/10 hover:border-accent/30 hover:text-text-primary'
                      }`}
                    >
                      {activityMultipliers[key].label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-2 pl-1">
                  Dica: {activityMultipliers[activity].hint}
                </p>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  <Scale className="w-4 h-4 inline mr-2 -mt-1 text-accent" strokeWidth={2.5} />
                  Qual é a sua meta principal agora?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(goalLabels) as Goal[]).map((k) => {
                    const g = goalLabels[k];
                    const active = goal === k;
                    const Icon = g.icon;
                    return (
                      <button
                        key={k}
                        onClick={() => setGoal(k)}
                        className={`relative text-left p-4 rounded-2xl border transition-all overflow-hidden ${
                          active
                            ? 'border-accent/60 bg-accent/10 shadow-neon'
                            : 'border-white/10 bg-white/5 hover:border-accent/40 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                          active ? 'bg-accent text-background' : 'bg-white/5 text-text-secondary'
                        }`}>
                          <Icon className="w-5 h-5" strokeWidth={2.2} />
                        </div>
                        <p className={`font-display font-bold text-base leading-tight ${
                          active ? 'text-accent' : 'text-text-primary'
                        }`}>
                          {g.label}
                        </p>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                          {k === 'lose' && 'Queimar gordura de forma saudável e sustentável.'}
                          {k === 'gain' && 'Construir massa muscular com ganho de qualidade.'}
                          {k === 'define' && 'Revelar os músculos mantendo o máximo de massa.'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {results ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 15, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 15, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 pt-6 border-t border-white/5 space-y-5 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                        <Flame className="w-5 h-5 text-text-muted mb-2" strokeWidth={2} />
                        <p className="text-[11px] uppercase tracking-wider text-text-muted font-medium">BMR</p>
                        <p className="font-display font-black text-2xl text-text-primary mt-1">
                          {results.bmr.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[11px] text-text-secondary">kcal em repouso</p>
                      </div>
                      <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-accent/20 rounded-full blur-2xl" />
                        <Activity className="w-5 h-5 text-accent mb-2 relative" strokeWidth={2} />
                        <p className="text-[11px] uppercase tracking-wider text-accent font-bold">TDEE</p>
                        <p className="font-display font-black text-3xl text-accent mt-1 relative">
                          {results.tdee.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[11px] text-text-secondary relative">kcal/dia total</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                        <Droplet className="w-5 h-5 text-blue-400 mb-2" strokeWidth={2} />
                        <p className="text-[11px] uppercase tracking-wider text-text-muted font-medium">Emagrecer</p>
                        <p className="font-display font-black text-2xl text-blue-400 mt-1">
                          {results.deficit.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[11px] text-text-secondary">kcal (déficit -500)</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                        <Target className="w-5 h-5 text-accent-orange mb-2" strokeWidth={2} />
                        <p className="text-[11px] uppercase tracking-wider text-text-muted font-medium">Hipertrofia</p>
                        <p className="font-display font-black text-2xl text-accent-orange mt-1">
                          {results.surplus.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[11px] text-text-secondary">kcal (superávit +400)</p>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-background p-6 sm:p-8 space-y-5"
                    >
                      <div className="w-full flex items-center gap-2.5 sm:gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 border border-accent/20">
                          <Sparkles className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} />
                        </div>
                        <h3 className="w-full whitespace-normal font-display font-black text-lg sm:text-2xl text-text-primary leading-tight">
                          O que esses números significam para você?
                        </h3>
                      </div>

                      <div className="w-full rounded-xl border border-white/5 bg-background-card/60 p-5 sm:p-7">
                        <div className="w-full flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shrink-0 flex items-center justify-center bg-white/5 border border-white/10 ${goalLabels[goal].color}`}>
                            {(() => {
                              const Icon = goalLabels[goal].icon;
                              return <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.2} />;
                            })()}
                          </div>
                          <div className="w-full flex-1 min-w-0 space-y-4">
                            <p className="w-full whitespace-normal text-[11px] sm:text-xs uppercase tracking-widest font-bold text-text-secondary">
                              Meta: <span className={goalLabels[goal].color}>{goalLabels[goal].label}</span>
                              <span className="mx-2 text-text-muted/60">•</span>
                              <span className="text-text-primary">
                                {results[goalLabels[goal].unitKey].toLocaleString('pt-BR')} kcal/dia
                              </span>
                            </p>
                            <p className="w-full whitespace-normal text-sm sm:text-[17px] text-text-primary leading-relaxed">
                              {goalLabels[goal].intro(
                                results.tdee,
                                results[goalLabels[goal].unitKey],
                              )}
                            </p>
                            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                              <div className="w-full flex items-start gap-2 text-xs sm:text-sm text-text-secondary break-words whitespace-normal rounded-lg bg-white/5 border border-white/5 px-3.5 py-2.5">
                                <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-[6px]" />
                                <span className="w-full whitespace-normal">
                                  <span className="font-semibold text-text-primary">Distribuição:</span> {results[goalLabels[goal].unitKey].toLocaleString('pt-BR')} kcal em 3–5 refeições diárias
                                </span>
                              </div>
                              <div className="w-full flex items-start gap-2 text-xs sm:text-sm text-text-secondary break-words whitespace-normal rounded-lg bg-white/5 border border-white/5 px-3.5 py-2.5">
                                <span className="w-2 h-2 rounded-full bg-accent-orange shrink-0 mt-[6px]" />
                                <span className="w-full whitespace-normal">
                                  <span className="font-semibold text-text-primary">Proteínas:</span> {Math.round(parseFloat(weight) * 2) || '--'}g/dia (mínimo para preservar massa magra)
                                </span>
                              </div>
                              <div className="w-full flex items-start gap-2 text-xs sm:text-sm text-text-secondary break-words whitespace-normal rounded-lg bg-white/5 border border-white/5 px-3.5 py-2.5">
                                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-[6px]" />
                                <span className="w-full whitespace-normal">
                                  <span className="font-semibold text-text-primary">Hidratação:</span> {Math.round(parseFloat(weight) * 35) || '--'}ml de água por dia
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 }}
                      className="w-full rounded-2xl border border-accent-orange/30 bg-gradient-to-r from-accent-orange/10 via-accent-orange/5 to-transparent p-5 sm:p-6 flex items-start gap-3 sm:gap-4"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent-orange/15 text-accent-orange flex items-center justify-center shrink-0 border border-accent-orange/20 mt-0.5">
                        <AlertTriangle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.3} />
                      </div>
                      <div className="w-full min-w-0">
                        <p className="w-full whitespace-normal font-display font-bold text-text-primary text-sm sm:text-lg leading-snug">
                          ⚠️ Atenção: Apenas cortar ou aumentar calorias sem um treino estruturado NÃO FUNCIONA a longo prazo.
                        </p>
                        <p className="w-full whitespace-normal text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
                          A dieta só ajusta o número da balança. Quem molda a forma do seu corpo — mantendo massa magra, acelerando o metabolismo e evitando o efeito sanfona — é o <span className="font-semibold text-text-primary">treino de força prescrito de forma individualizada</span>.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.26 }}
                      className="w-full relative rounded-3xl border-2 border-accent/50 bg-gradient-to-br from-accent/15 via-background-card to-background-card overflow-hidden shadow-neon"
                    >
                      <div className="absolute top-0 right-0 w-52 h-52 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative w-full p-6 sm:p-8 flex flex-col items-start justify-between gap-6">
                        <div className="w-full flex flex-col sm:flex-row items-start gap-5 flex-1 min-w-0">
                          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-accent text-background flex items-center justify-center shrink-0 shadow-neon">
                            <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2.5} />
                          </div>
                          <div className="w-full min-w-0">
                            <p className="text-[11px] sm:text-xs uppercase tracking-widest font-black text-accent mb-2">
                              Próximo passo
                            </p>
                            <h4 className="w-full whitespace-normal font-display font-black text-2xl sm:text-3xl lg:text-4xl text-text-primary tracking-tight leading-tight">
                              Receber Diagnóstico no WhatsApp
                            </h4>
                            <p className="w-full whitespace-normal text-sm sm:text-lg text-text-secondary mt-3 leading-relaxed">
                              Te explico pessoalmente como aplicar esses <span className="font-semibold text-text-primary">{results[goalLabels[goal].unitKey].toLocaleString('pt-BR')} kcal</span> no dia a dia, com ajustes para o plano <span className="font-bold text-accent">{results.plan}</span>.
                            </p>
                          </div>
                        </div>
                        <div className="w-full flex flex-col sm:flex-row gap-4 w-full justify-center items-stretch sm:items-center">
                          <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                              [
                                'Olá Thiago! Fiz a avaliação na calculadora do seu site e quero receber o diagnóstico completo do meu perfil.',
                                '',
                                '📋 Dados do cálculo:',
                                `  • Peso: ${weight}kg | Altura: ${height}cm | Idade: ${age} anos | Sexo: ${gender === 'male' ? 'Masculino' : 'Feminino'}`,
                                `  • Atividade: ${activityMultipliers[activity].label}`,
                                `  • Gasto Diário (TDEE): ${results.tdee.toLocaleString('pt-BR')} kcal`,
                                `  • Meta: ${goalLabels[goal].label} (${results[goalLabels[goal].unitKey].toLocaleString('pt-BR')} kcal/dia)`,
                                `  • Plano sugerido: ${results.plan}`,
                                '',
                                'Quero saber como funciona a consultoria para o meu perfil!',
                              ].join('\n')
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-4 sm:py-[18px] rounded-2xl font-extrabold text-base sm:text-lg bg-[#25D366] text-white hover:bg-[#1ebe5b] transition-all shadow-[0_10px_35px_rgba(37,211,102,0.55)] group"
                          >
                            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                            Falar com o Thiago agora
                            <ArrowRight className="w-5 h-5 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.8} />
                          </a>
                          <button
                            onClick={() => onCTAClick(results.plan)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-4 sm:py-[18px] rounded-2xl font-bold text-base sm:text-lg bg-transparent text-accent border-2 border-accent/60 hover:bg-accent hover:text-background transition-all group"
                          >
                            Quero este Plano
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.8} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 pt-6 border-t border-white/5"
                  >
                    <div className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/5 p-5">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <Calculator className="w-6 h-6" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">Preencha seus dados</p>
                        <p className="text-sm text-text-secondary">O cálculo aparecerá automaticamente aqui.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
