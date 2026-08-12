import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, Sparkles, Flame, Dumbbell, Activity, Zap, Info, Scale, Ruler, ArrowRight, MessageCircle,
} from 'lucide-react';

const WHATSAPP_NUMBER = '5548988720439';

type Gender = 'masc' | 'fem';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
type Goal = 'emagrecer' | 'hipertrofia' | 'manter';

const activityOptions: { key: ActivityLevel; label: string; factor: number; desc: string; icon: typeof Activity }[] = [
  { key: 'sedentary', label: 'Sedentário', factor: 1.2, desc: 'Pouco ou nenhum exercício', icon: Activity },
  { key: 'light', label: 'Leve', factor: 1.375, desc: '1-3 treinos / caminhadas na semana', icon: Flame },
  { key: 'moderate', label: 'Moderado', factor: 1.55, desc: '3-5 treinos moderados na semana', icon: Activity },
  { key: 'high', label: 'Intenso', factor: 1.725, desc: '6-7 treinos de força ou corrida', icon: Dumbbell },
  { key: 'athlete', label: 'Atleta', factor: 1.9, desc: 'Atleta de alto rendimento / 2x/dia', icon: Zap },
];

const goalOptions: { key: Goal; label: string; suffix: string; color: string; hint: string }[] = [
  { key: 'emagrecer', label: 'Emagrecer', suffix: 'deficit calórico', color: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30', hint: '-300 a -500 kcal do TDEE' },
  { key: 'manter', label: 'Manter peso', suffix: 'eutanálico', color: 'bg-accent/15 text-accent border-accent/30', hint: '0 kcal do TDEE · ponto de equilíbrio' },
  { key: 'hipertrofia', label: 'Hipertrofia', suffix: 'superávit', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30', hint: '+250 a +400 kcal do TDEE' },
];

function bmrMifflin(gender: Gender, weight: number, height: number, age: number) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'masc' ? base + 5 : base - 161);
}

export default function TDEECalculator() {
  const [gender, setGender] = useState<Gender>('masc');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('emagrecer');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const activityFactor = activityOptions.find((a) => a.key === activity)!.factor;
  const goalCfg = goalOptions.find((g) => g.key === goal)!;

  const weightN = Math.max(0, parseFloat(weight.replace(',', '.')) || 0);
  const heightN = Math.max(0, parseFloat(height.replace(',', '.')) || 0);
  const ageN = Math.max(0, parseInt(age, 10) || 0);
  const valid = weightN > 20 && heightN > 100 && ageN > 12 && ageN < 110;

  const { bmr, tdee, targetCal, proteinMin, proteinMax, imc, imcLabel, imcColor } = useMemo(() => {
    const b = valid ? bmrMifflin(gender, weightN, heightN, ageN) : 0;
    const t = Math.round(b * activityFactor);
    const delta = goal === 'emagrecer' ? -400 : goal === 'hipertrofia' ? 325 : 0;
    const target = Math.max(800, t + delta);
    const pMin = Math.round(weightN * 1.6);
    const pMax = Math.round(weightN * 2.2);
    const heightM = heightN / 100;
    const imc = heightM > 0 ? weightN / (heightM * heightM) : 0;
    let label = '—';
    let color = 'text-muted-foreground';
    if (valid) {
      if (imc < 18.5) { label = 'Abaixo do peso'; color = 'text-blue-400'; }
      else if (imc < 25) { label = 'Peso saudável'; color = 'text-emerald-400'; }
      else if (imc < 30) { label = 'Sobrepeso'; color = 'text-yellow-300'; }
      else if (imc < 35) { label = 'Obesidade grau 1'; color = 'text-accent-orange'; }
      else if (imc < 40) { label = 'Obesidade grau 2'; color = 'text-orange-400'; }
      else { label = 'Obesidade grau 3'; color = 'text-rose-400'; }
    }
    return { bmr: b, tdee: t, targetCal: target, proteinMin: pMin, proteinMax: pMax, imc: valid ? Number(imc.toFixed(1)) : 0, imcLabel: label, imcColor: color };
  }, [valid, gender, weightN, heightN, ageN, activityFactor, goal]);

  const whatsappMsg = `Olá Thiago! Fiz a Calculadora TDEE do seu site e queria tirar dúvidas sobre o meu resultado:
• Peso: ${weightN} kg · Altura: ${heightN} cm · Idade: ${ageN} anos · Sexo: ${gender === 'masc' ? 'Masculino' : 'Feminino'}
• Nível: ${activityOptions.find((a) => a.key === activity)!.label}
• Meta: ${goalCfg.label}
• TDEE calculado: ${tdee} kcal · Meta: ${targetCal} kcal · Proteína ${proteinMin}-${proteinMax}g/dia

Pode me ajudar a ajustar? Obrigado!`;

  const whatsappLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <section id="tdee" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 right-1/2 translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px]" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <Calculator className="w-3.5 h-3.5" />
            FERRAMENTA · CALCULADORA TDEE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            Descubra quantas <span className="text-gradient">calorias</span> você realmente gasta
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Usamos a fórmula Mifflin-St Jeor (mais precisa) com ajuste por nível de atividade. Ajuste para sua meta
            e veja imediatamente o número de proteína e calorias ideal para você.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 card-dark !bg-card/70 !p-5 sm:!p-7 space-y-6 border-white/6"
          >
            <div>
              <label className="text-xs sm:text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Sexo biológico
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['masc', 'fem'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    type="button"
                    className={`h-12 sm:h-14 rounded-2xl border text-sm sm:text-base font-bold transition-all inline-flex items-center justify-center gap-2 ${
                      gender === g
                        ? 'bg-accent/15 text-accent border-accent/40 shadow-[0_0_25px_rgba(204,255,0,0.14)]'
                        : 'bg-white/4 border-white/8 text-text-secondary hover:bg-white/8 hover:text-text-primary'
                    }`}
                  >
                    {g === 'masc' ? 'Masculino' : 'Feminino'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5" /> Peso (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="70,5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, w: true }))}
                  className={`w-full h-12 sm:h-14 rounded-2xl bg-background/60 border text-foreground px-4 font-display font-bold text-lg outline-none transition-all placeholder:text-text-muted/70 ${
                    touched.w && weight && (!weightN || weightN < 20 || weightN > 250)
                      ? 'border-destructive/60 focus:border-destructive focus:ring-2 focus:ring-destructive/25'
                      : 'border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5" /> Altura (cm)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="172"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, h: true }))}
                  className={`w-full h-12 sm:h-14 rounded-2xl bg-background/60 border text-foreground px-4 font-display font-bold text-lg outline-none transition-all placeholder:text-text-muted/70 ${
                    touched.h && height && (!heightN || heightN < 100 || heightN > 250)
                      ? 'border-destructive/60 focus:border-destructive focus:ring-2 focus:ring-destructive/25'
                      : 'border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30'
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Idade
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="38"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, a: true }))}
                  className={`w-full h-12 sm:h-14 rounded-2xl bg-background/60 border text-foreground px-4 font-display font-bold text-lg outline-none transition-all placeholder:text-text-muted/70 ${
                    touched.a && age && (!ageN || ageN < 13 || ageN > 109)
                      ? 'border-destructive/60 focus:border-destructive focus:ring-2 focus:ring-destructive/25'
                      : 'border-white/10 focus:border-accent focus:ring-2 focus:ring-accent/30'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Nível de atividade física
              </label>
              <div className="space-y-2.5">
                {activityOptions.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setActivity(a.key)}
                    className={`w-full text-left rounded-2xl border px-4 sm:px-5 py-3 flex items-center gap-4 transition-all ${
                      activity === a.key
                        ? 'bg-accent/10 border-accent/45 shadow-[0_0_25px_rgba(204,255,0,0.14)]'
                        : 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      activity === a.key ? 'bg-accent/20 text-accent' : 'bg-white/5 text-text-secondary'
                    }`}>
                      <a.icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-display font-bold text-sm sm:text-base leading-tight ${
                        activity === a.key ? 'text-text-primary' : 'text-text-secondary'
                      }`}>
                        {a.label}
                      </p>
                      <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-snug">{a.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest ${
                        activity === a.key ? 'text-accent' : 'text-text-muted'
                      }`}>×{a.factor}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Qual sua meta?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {goalOptions.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGoal(g.key)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      goal === g.key
                        ? `${g.color} border-current shadow-[0_0_25px_rgba(204,255,0,0.12)]`
                        : 'bg-white/4 border-white/8 hover:bg-white/8'
                    }`}
                  >
                    <p className={`font-display font-black text-lg sm:text-xl leading-none ${
                      goal === g.key ? '' : 'text-text-primary'
                    }`}>{g.label}</p>
                    <p className="text-[11px] uppercase tracking-wider font-bold mt-1 opacity-80">{g.suffix}</p>
                    <p className="text-[11px] sm:text-xs text-current/80 mt-2 leading-snug">{g.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 flex flex-col gap-5"
          >
            <div className="card-dark !bg-gradient-to-br !from-card via-card to-background !p-5 sm:!p-7 relative overflow-hidden border-accent/20 shadow-neon">
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-accent/15 rounded-full blur-[70px] pointer-events-none" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 text-[11px] font-extrabold uppercase tracking-widest">
                    <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
                    TDEE Estimado
                  </span>
                  <span className="text-[11px] text-text-muted uppercase tracking-wider">
                    Mifflin-St Jeor
                  </span>
                </div>
                <div>
                  {valid ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <p className="font-display font-black text-text-primary text-5xl sm:text-6xl leading-none tracking-tight">
                          {tdee.toLocaleString('pt-BR')}
                        </p>
                        <span className="font-bold text-text-muted text-sm sm:text-base">kcal / dia</span>
                      </div>
                      <p className="text-text-secondary text-sm sm:text-base mt-3 leading-relaxed">
                        Gasto energético <span className="font-bold text-text-primary">total diário</span> ({goalCfg.label.toLowerCase()} ajustado
                        para <span className="font-bold text-accent">{targetCal.toLocaleString('pt-BR')} kcal</span> / dia).
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display font-black text-muted-foreground text-3xl sm:text-4xl tracking-tight">
                        Preencha seus dados
                      </p>
                      <p className="text-text-secondary text-sm mt-2">
                        Calculamos automaticamente em tempo real. Ajuste suas preferências para ver o resultado.
                      </p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl bg-white/4 border border-white/8 p-3.5">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted">BMR</p>
                    <p className="font-display font-black text-2xl text-text-primary mt-1">
                      {valid ? bmr.toLocaleString('pt-BR') : '—'}
                      <span className="text-[11px] font-bold text-text-muted ml-1">kcal</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/4 border border-white/8 p-3.5">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Proteína / dia</p>
                    <p className="font-display font-black text-2xl text-text-primary mt-1">
                      {valid ? `${proteinMin}-${proteinMax}` : '—'}
                      <span className="text-[11px] font-bold text-text-muted ml-1">g</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/8 bg-background/60 p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                    <Scale className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Seu IMC</p>
                      {valid && <p className={`text-[11px] font-extrabold uppercase tracking-wider ${imcColor}`}>{imcLabel}</p>}
                    </div>
                    <p className="font-display font-black text-2xl sm:text-3xl text-text-primary leading-none mt-1">
                      {valid ? imc : '—'}
                    </p>
                  </div>
                </div>

                {valid ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 sm:h-14 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] transition-all flex items-center justify-center gap-2 font-extrabold text-sm sm:text-base text-white shadow-[0_10px_35px_rgba(37,211,102,0.45)] group"
                  >
                    <MessageCircle className="w-4.5 h-4.5" strokeWidth={2.3} />
                    Quero ajustar esse plano com o Thiago
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                  </a>
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={2.2} />
                    <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                      Importante: esta é uma ferramenta de orientação. Cada corpo responde diferente.
                      Para um plano real, seguro e personalizado, o ideal é a avaliação completa com profissional.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="card-dark !p-4 sm:!p-5 !bg-card/70 border-white/6 flex items-start gap-3">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={2.2} />
              <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                <strong className="text-text-primary">Dica rápida:</strong> proteína alta + treino de força evita a
                perda de massa magra durante o emagrecimento — especialmente importante se você usa Mounjaro, Ozempic
                ou similares.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
