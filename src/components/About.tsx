import {
  GraduationCap, Award, Dumbbell, FileCheck, Activity, Heart, UsersRound,
  Handshake, ShieldCheck, ClipboardCheck, Users,
} from 'lucide-react';
import SectionLabel, { Slashes } from '@/components/brand/SectionLabel';

const academicEducation = [
  { icon: GraduationCap, title: 'Bacharelado + Licenciatura', text: 'Educação Física pela UniNorte (formação dupla)' },
  { icon: Activity, title: 'Pós-graduação', text: 'Fisiologia do Exercício (prescrição baseada em evidência)' },
  { icon: Heart, title: 'Pós-graduação', text: 'Gerontologia e Psicomotricidade Motora (público maduro)' },
];

const certifications = [
  { icon: FileCheck, title: 'Análise de Movimentos na Musculação' },
  { icon: Award, title: 'Avaliação Física' },
  { icon: Dumbbell, title: 'Hipertrofia Muscular na Prática' },
  { icon: UsersRound, title: 'Competências Sócio-emocionais na Educação Esportiva' },
];

const highlights = [
  { icon: Handshake, label: 'Acompanhamento 1:1 próximo' },
  { icon: Users, label: 'Atendemos público maduro / idosos' },
  { icon: ShieldCheck, label: 'Sem exageros, sem promessas' },
  { icon: ClipboardCheck, label: 'Avaliação física detalhada' },
];

export default function About() {
  return (
    <section id="sobre" className="relative py-20 md:py-28 bg-brand-bg border-t border-white/10 overflow-hidden scroll-mt-20">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-grid opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-20 items-start">
          {/* Foto */}
          <div className="relative order-2 lg:order-1 lg:sticky lg:top-28">
            <div aria-hidden="true" className="absolute -left-3 -bottom-3 w-1/2 h-1/2 border-l-[3px] border-b-[3px] border-brand-blue" />
            <div className="relative chamfer overflow-hidden bg-brand-surface">
              <img
                src="/assets/sobre.webp"
                alt="Thiago Mancilha Reis - Personal Trainer CREF 008289-G/AM"
                className="photo-treated w-full h-[520px] sm:h-[600px] object-cover"
                loading="lazy"
              />
              <div aria-hidden="true" className="absolute inset-0 photo-tint" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/10 to-transparent" />

              <figure className="absolute left-0 right-0 bottom-0 p-6 sm:p-8">
                <blockquote className="title-display !not-italic !font-bold !normal-case text-2xl sm:text-[1.7rem] !leading-tight text-brand-ink">
                  &ldquo;Seu objetivo é o ponto de partida. A sua evolução é o nosso processo.&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-sm text-brand-muted">— Thiago Mancilha Reis</figcaption>
              </figure>
            </div>
          </div>

          {/* Texto */}
          <div className="order-1 lg:order-2 space-y-6">
            <SectionLabel>Sobre o profissional</SectionLabel>

            <h2 className="title-display text-5xl sm:text-6xl lg:text-[4rem]">
              <span className="text-brand-ink">Olá, eu sou</span>
              <br />
              <span className="text-brand-blue-text">Thiago Mancilha Reis</span>
            </h2>

            <p className="text-brand-ink font-semibold text-lg">
              Educação Física · Bacharel e Licenciado (UniNorte) · CREF 008289-G/AM
            </p>

            <p className="inline-flex items-center gap-3 title-display text-2xl text-brand-ink">
              <Slashes className="text-xl" />
              O básico que funciona.
            </p>

            <p className="text-brand-muted text-lg leading-relaxed">
              Com mais de 3 anos de experiência, transformar um corpo vai muito além de prescrever exercícios.
              Meu propósito é ajudar cada aluno a <span className="font-semibold text-brand-ink">acreditar no próprio potencial</span> e
              superar limitações com um acompanhamento próximo, humano e baseado em ciência.
            </p>
            <p className="text-brand-muted text-lg leading-relaxed">
              Foco em <span className="font-semibold text-brand-ink">saúde funcional, estética consciente, mobilidade e emagrecimento sem exageros</span> —
              atendendo especialmente quem é sedentário, está acima do peso ou busca autonomia e motivação na maturidade.
            </p>

            <div className="pt-4">
              <h3 className="title-display text-2xl text-brand-ink mb-4">Formação Acadêmica</h3>
              <ul className="border-t border-white/10">
                {academicEducation.map((h) => (
                  <li key={h.text} className="flex gap-4 py-4 border-b border-white/10">
                    <h.icon className="w-6 h-6 text-brand-blue-text shrink-0 mt-0.5" strokeWidth={1.8} aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-brand-ink text-base">{h.title}</p>
                      <p className="text-base text-brand-muted mt-0.5 leading-relaxed">{h.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <h3 className="title-display text-2xl text-brand-ink mb-4">Certificações</h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {certifications.map((c) => (
                  <li key={c.title} className="chamfer-sm flex items-start gap-3 px-4 py-3.5 bg-brand-surface border-l-2 border-brand-blue">
                    <c.icon className="w-5 h-5 text-brand-blue-text shrink-0 mt-0.5" strokeWidth={1.9} aria-hidden="true" />
                    <span className="text-base text-brand-ink/90 leading-snug">{c.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Diferenciais em grade, como no mockup */}
        <ul className="mt-16 md:mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {highlights.map((h) => (
            <li key={h.label} className="flex items-center gap-4 p-5 border border-white/12 bg-brand-surface/60">
              <span className="grid place-items-center w-12 h-12 shrink-0 bg-brand-blue/15 border border-brand-blue/40">
                <h.icon className="w-6 h-6 text-brand-blue-text" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="title-display !text-[1.2rem] !leading-tight !not-italic !font-bold text-brand-ink">{h.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
