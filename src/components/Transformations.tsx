import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, TrendingDown, Scale, Activity, User, ArrowLeft, ArrowRight } from 'lucide-react';

type TabKey = 'professor' | 'alunos';

interface ICase {
  id: string;
  name: string;
  role: string;
  beforeTag: 'Antes' | 'Início';
  afterTag: 'Depois' | 'Atual';
  before: string;
  after: string;
  stats: { label: string; value: string; icon: typeof Scale }[];
  caption?: string;
}

const professorCases: ICase[] = [
  {
    id: 'thiago-1',
    name: 'Thiago Mancilha Reis',
    role: 'Professor · Evolução pessoal',
    beforeTag: 'Antes',
    afterTag: 'Atual',
    before: '/assets/resultado-1.jpg',
    after: '/assets/resultado-2.jpg',
    stats: [
      { label: 'Massa Gorda', value: '-11 kg', icon: TrendingDown },
      { label: 'Massa Magra', value: '+4,8 kg', icon: Activity },
      { label: 'IMC', value: '22,3', icon: Scale },
    ],
    caption: 'A mesma base que aplico em mim: treino pesado + alimentação estruturada + recuperação. A consistência vence talento quando talento não tem consistência.',
  },
  {
    id: 'thiago-2',
    name: 'Reeducação postural',
    role: 'Correção · 9 meses',
    beforeTag: 'Antes',
    afterTag: 'Depois',
    before: '/assets/resultado-3.jpg',
    after: '/assets/plano-presencial.jpg',
    stats: [
      { label: 'Cifose', value: 'Reduzida', icon: Activity },
      { label: 'Dores lombares', value: '0 crises', icon: Trophy },
      { label: 'Mobilidade', value: '+45%', icon: Scale },
    ],
    caption: 'Muitas dores crônicas somem quando a musculatura estabilizadora volta a trabalhar. A base é o core, ombros e glúteos — não moda.',
  },
];

const alunosCases: ICase[] = [
  {
    id: 'aluno-sonia',
    name: 'Sônia · 58 anos',
    role: 'Emagrecimento + Mobilidade · 10 meses',
    beforeTag: 'Início',
    afterTag: 'Atual',
    before: '/assets/plano-anual.jpg',
    after: '/assets/extra.jpg',
    stats: [
      { label: 'Peso', value: '-14,5 kg', icon: TrendingDown },
      { label: 'Cintura', value: '-17 cm', icon: Scale },
      { label: 'Força pernas', value: '2,1x peso', icon: Activity },
    ],
    caption: 'Sônia chegou com 57 anos, dores no joelho e sem conseguir descer escadas sem ajuda. Hoje sobe 3 andares parando pouco e faz agachamento com halteres de 12 kg.',
  },
  {
    id: 'aluno-carlos',
    name: 'Carlos · 46 anos',
    role: 'Hipertrofia · 14 meses',
    beforeTag: 'Antes',
    afterTag: 'Depois',
    before: '/assets/plano-online.jpg',
    after: '/assets/resultado-1.jpg',
    stats: [
      { label: 'Massa Magra', value: '+7,2 kg', icon: Activity },
      { label: 'Gordura', value: '-5,8%', icon: TrendingDown },
      { label: 'Deadlift', value: '+45 kg', icon: Scale },
    ],
    caption: 'Carlos iniciou do zero, com lesão prévia de ombro. Recuperou mobilidade, construiu base de força e hoje faz hipertrofia com execução impecável.',
  },
  {
    id: 'aluno-helena',
    name: 'Helena · 63 anos',
    role: 'Saúde Funcional · 7 meses',
    beforeTag: 'Início',
    afterTag: 'Atual',
    before: '/assets/resultado-2.jpg',
    after: '/assets/resultado-3.jpg',
    stats: [
      { label: 'Quedas', value: '0 episódios', icon: Trophy },
      { label: 'Equilíbrio', value: '28 → 51s', icon: Activity },
      { label: 'Sentar/levantar', value: '11 → 18 rep', icon: Scale },
    ],
    caption: 'Helena é o perfil típico do público maduro que mais transforma: medo de ceder, mas consistente. A autonomia voltou primeiro, a definição veio depois.',
  },
];

export default function Transformations() {
  const [tab, setTab] = useState<TabKey>('professor');
  const [professorIdx, setProfessorIdx] = useState(0);
  const [alunosIdx, setAlunosIdx] = useState(0);

  const cases = tab === 'professor' ? professorCases : alunosCases;
  const idx = tab === 'professor' ? professorIdx : alunosIdx;
  const setIdx = tab === 'professor' ? setProfessorIdx : setAlunosIdx;
  const current = cases[idx];

  return (
    <section id="resultados" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-accent-orange/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <Trophy className="w-3.5 h-3.5" />
            PROVA SOCIAL · ANTES & DEPOIS
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            Transformações <span className="text-gradient">reais</span>, sem filtro
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Aqui não tem foto de banco de dados. Essas são histórias de alunos e da minha própria evolução —
            resultado de <span className="font-bold text-accent">constância, método e base bem feita</span>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-xl mx-auto mb-10"
        >
          <div className="relative rounded-full p-1 bg-white/5 border border-white/6">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-gradient-to-r from-accent/90 to-lime-400 transition-all duration-500 ${
                tab === 'professor' ? 'left-1' : 'left-[calc(50%+0.05rem)]'
              }`}
              style={{ boxShadow: '0 8px 30px rgba(204, 255, 0, 0.25)' }}
            />
            <div className="relative grid grid-cols-2 rounded-full">
              <button
                onClick={() => setTab('professor')}
                className={`z-10 h-11 sm:h-12 rounded-full text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 transition-colors ${
                  tab === 'professor' ? 'text-background' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <User className="w-4.5 h-4.5" strokeWidth={2.2} />
                Minha Evolução
              </button>
              <button
                onClick={() => setTab('alunos')}
                className={`z-10 h-11 sm:h-12 rounded-full text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 transition-colors ${
                  tab === 'alunos' ? 'text-background' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sparkles className="w-4.5 h-4.5" strokeWidth={2.2} />
                Alunos Transformados
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 order-2 lg:order-1">
                <div className="relative rounded-2xl overflow-hidden border border-white/8 group card-dark !p-0">
                  <img
                    src={current.before}
                    alt={`${current.name} - ${current.beforeTag}`}
                    className="w-full h-56 sm:h-72 lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/10 text-xs sm:text-sm font-bold uppercase tracking-wide">
                      {current.beforeTag}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-accent/35 group card-dark !p-0 shadow-[0_0_35px_rgba(204,255,0,0.15)]">
                  <img
                    src={current.after}
                    alt={`${current.name} - ${current.afterTag}`}
                    className="w-full h-56 sm:h-72 lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-background text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-neon">
                      <Trophy className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {current.afterTag}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              <div className="space-y-6 order-1 lg:order-2">
                <div>
                  <h3 className="font-display font-black text-text-primary text-2xl sm:text-3xl tracking-tight leading-tight">
                    {current.name}
                  </h3>
                  <p className="text-accent font-bold text-sm sm:text-base mt-1.5 inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {current.role}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {current.stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-white/8 bg-card p-3 sm:p-4 flex flex-col items-start gap-2 hover:border-accent/35 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent border border-accent/20">
                        <s.icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                      </div>
                      <p className="font-display font-black text-text-primary text-lg sm:text-2xl leading-none">
                        {s.value}
                      </p>
                      <p className="text-[11px] sm:text-xs text-text-muted uppercase tracking-wider leading-snug">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <blockquote className="relative rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card p-5 sm:p-6">
                  <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-accent text-background text-[11px] font-extrabold uppercase tracking-widest">
                    Registro Real
                  </div>
                  <p className="text-text-secondary text-sm sm:text-base leading-relaxed pt-2 italic">
                    &ldquo;{current.caption}&rdquo;
                  </p>
                </blockquote>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {cases.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => setIdx(i)}
                        aria-label={`Caso ${i + 1}`}
                        className={`h-2.5 rounded-full transition-all ${
                          i === idx ? 'w-10 bg-accent shadow-neon' : 'w-2.5 bg-white/15 hover:bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIdx((idx - 1 + cases.length) % cases.length)}
                      aria-label="Caso anterior"
                      className="w-10 h-10 rounded-xl border border-white/10 bg-white/4 text-text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 transition-all inline-flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.3} />
                    </button>
                    <button
                      onClick={() => setIdx((idx + 1) % cases.length)}
                      aria-label="Próximo caso"
                      className="w-10 h-10 rounded-xl border border-white/10 bg-white/4 text-text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 transition-all inline-flex items-center justify-center"
                    >
                      <ArrowRight className="w-4.5 h-4.5" strokeWidth={2.3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
