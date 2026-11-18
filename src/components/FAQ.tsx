import { WHATSAPP_NUMBER } from '@/lib/contact';
import { MessageCircle, Plus, Minus, ArrowRight, CalendarDays } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import SectionLabel from '@/components/brand/SectionLabel';



interface FAQProps {
  onCTAClick: () => void;
}

const cleanQuestion = (question: string) =>
  question
    .replace(/^Treino na Maturidade 50\+\s+—\s+/, '')
    .replace(/^Acompanhamento para quem usa Mounjaro\/Ozempic\s+—\s+/, '')
    .replace(/^Mitos da Musculação\s+—\s+/, '');

const getQuestionBadge = (question: string) => {
  if (/50\+|idos[ae]|maturidade/i.test(question)) {
    return { label: '50+', show: true };
  }
  if (/mounjaro|ozempic|semaglutida|medica(ç|c)(õ|o)es?/i.test(question)) {
    return { label: 'Mounjaro / Ozempic', show: true };
  }
  return { label: '', show: false };
};

const faqs = [
  {
    tag: 'Público Maduro',
    tagColor: 'bg-accent/15 text-accent border-accent/30',
    q: 'Treino na Maturidade 50+ — Como funciona o protocolo para recuperar autonomia, força e motivação?',
    a: 'Autonomia, força e motivação depois dos 50. Como reconstruir massa muscular, recuperar mobilidade e vencer o sedentarismo com um protocolo simples, seguro e adaptado para articulações mais sensíveis. Começamos devagar, com exercícios de baixo impacto, fortalecimento de core e membros inferiores (evitando quedas), e evoluímos de forma segura — sempre respeitando seus limites.',
  },
  {
    tag: 'Emagrecimento',
    tagColor: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
    q: 'Acompanhamento para quem usa Mounjaro/Ozempic — O que realmente funciona no emagrecimento sustentável?',
    a: 'O que a ciência diz e o que ninguém te conta. Medicações podem ser ferramentas temporárias no controle da fome e perda de peso inicial, mas sem treino de força e hábitos sustentáveis, o efeito sanfona é garantido. Eu prescrevo um treino específico para preservar músculo enquanto você emagrece, além de orientar sobre proteína e hábitos para o resultado ficar pra vida toda.',
  },
  {
    tag: 'Sem Frescura',
    tagColor: 'bg-blue-400/15 text-blue-400 border-blue-400/30',
    q: 'Mitos da Musculação — O básico que realmente funciona vs. modismos da internet?',
    a: 'O básico que funciona vs. modismos da internet, com biomecânica e prática. Jejum intermitente não derrete gordura sozinho, agachamento profundo não destrói joelhos, e 3 séries não são obrigatórias. Meu compromisso é com o "básico que funciona" — não com promessas mirabolantes.',
  },
  {
    tag: 'Público Maduro',
    tagColor: 'bg-accent/15 text-accent border-accent/30',
    q: 'Você atende pessoas maduras e idosas? Como é o treino para quem tem 50+ anos?',
    a: 'Com certeza! Mais de 50% dos meus alunos têm 50 anos ou mais. O método é todo adaptado para saúde funcional, mobilidade, autonomia e qualidade de vida. Começamos devagar, com exercícios de baixo impacto, fortalecimento de core e membros inferiores (evitando quedas), e evoluímos de forma segura. Muitos alunos com 60, 70 e até 80 anos recuperam disposição para brincar com netos, subir escadas sem cansaço e reduzir dores articulares.',
  },
  {
    tag: 'Emagrecimento',
    tagColor: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
    q: 'Estou tomando Mounjaro, Ozempic ou similares. O treino funciona mesmo assim?',
    a: 'Funciona, e na verdade os dois se complementam. Esses medicamentos ajudam no controle da fome e perda de peso inicial, mas SEM força muscular você corre risco de perder massa magra (enfraquecendo) e recuperar tudo depois. Eu prescrevo um treino específico para preservar e construir músculo enquanto você emagrece, além de orientar sobre proteína e hábitos sustentáveis para o resultado ficar pra vida toda — não só enquanto estiver usando remédio.',
  },
  {
    tag: 'Consultoria',
    tagColor: 'bg-blue-500/15 text-blue-400 border-blue-400/30',
    q: 'Como funciona a consultoria online? É realmente efetiva mesmo de longe?',
    a: 'Sim, muito! Na consultoria on-line você recebe seu treino personalizado por WhatsApp ou planilha, com vídeos demonstrativos de cada exercício. O suporte é de segunda a sexta para tirar dúvidas, receber feedback das execuções por vídeo, e ajustamos o treino todo mês. Os check-ins quinzenais garantem que não perca o ritmo. Tenho alunos on-line de Manaus, São Paulo, Rio, e até fora do país, com excelentes resultados.',
  },
  {
    tag: 'Iniciantes',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30',
    q: 'Sou totalmente iniciante, nunca treinei na vida. Serve para mim?',
    a: 'Com certeza! O método foi desenhado especialmente para receber iniciantes. Todos os exercícios têm variações de dificuldade, o suporte diário ajuda a manter a consistência, e começamos devagar respeitando sua curva de aprendizado. A maioria dos meus alunos começa do zero e vê mudanças perceptíveis já nas primeiras 8 semanas: mais disposição, menos dores e força para tarefas do dia a dia.',
  },
  {
    tag: 'Lesões',
    tagColor: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-400/30',
    q: 'Tenho lesão, dor crônica ou limitação física. Posso treinar?',
    a: 'Na maioria dos casos, sim. Na etapa de anamnese coletamos todas as informações sobre suas limitações e condições. Se necessário, trabalhamos em conjunto com seu fisioterapeuta ou médico para construir um programa seguro e alinhado às suas reais possibilidades, sempre priorizando saúde antes de performance. Exercícios bem feitos reabilitam, melhoram a dor e devolvem autonomia.',
  },
  {
    tag: 'Resultados',
    tagColor: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
    q: 'Quanto tempo demora para ver os primeiros resultados?',
    a: 'Na média, os primeiros sinais (melhora da disposição, mais energia, aumento da força, sono melhor) aparecem em 3 a 4 semanas. As mudanças visuais perceptíveis (perda de medidas, ganho de massa, roupas mais largas) costumam aparecer entre 8 e 12 semanas de consistência. Vale lembrar que cada corpo responde de um jeito diferente. Trabalhamos com metas progressivas e mensuráveis — sem promessas milagrosas.',
  },
];

export default function FAQ({ onCTAClick }: FAQProps) {
  const whatsappMsg = encodeURIComponent(
    'Olá Thiago! Vim da seção de perguntas do seu site e ainda tenho algumas dúvidas antes de começar. Pode me ajudar?'
  );
  const whatsappLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${whatsappMsg}`;

  return (
    <>
      <section id="faq" className="relative py-20 md:py-28 bg-brand-bg border-t border-white/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
          <div className="space-y-5 lg:sticky lg:top-28 self-start">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="title-display text-5xl sm:text-6xl text-brand-ink">
              Tire suas dúvidas antes de começar
            </h2>
            <p className="text-lg text-brand-muted">
              Respostas diretas para as dúvidas mais comuns antes de iniciar.
            </p>
          </div>

          <Accordion defaultValue={['faqs-item-0']} className="w-full border-t border-white/12">
            {faqs.map((faq, i) => {
              const miniBadge = getQuestionBadge(faq.q);
              return (
                <AccordionItem key={`faq-${i}`} value={`faqs-item-${i}`} className="border-b border-white/12">
                  <AccordionTrigger
                    className="group/accordion-trigger relative hover:!no-underline hover:!bg-transparent !rounded-none !px-0 !py-0 [&_[data-slot=accordion-trigger-icon]]:!hidden **:data-[slot=accordion-trigger-icon]:!hidden"
                  >
                    <div className="flex items-start justify-between gap-5 text-left py-5 w-full text-brand-ink group-aria-expanded/accordion-trigger:text-white">
                      <span className="flex-1 min-w-0">
                        {miniBadge.show && (
                          <span className="block mb-1.5 text-[0.72rem] font-bold tracking-[0.18em] uppercase text-brand-blue-text">
                            {miniBadge.label}
                          </span>
                        )}
                        <span className="block text-lg font-semibold leading-snug">{cleanQuestion(faq.q)}</span>
                      </span>
                      <span className="shrink-0 grid place-items-center w-9 h-9 mt-0.5 border border-white/25 text-brand-ink group-aria-expanded/accordion-trigger:bg-brand-blue group-aria-expanded/accordion-trigger:border-brand-blue transition-colors">
                        <Plus className="w-4 h-4 group-aria-expanded/accordion-trigger:hidden" strokeWidth={2.5} aria-hidden="true" />
                        <Minus className="w-4 h-4 hidden group-aria-expanded/accordion-trigger:inline" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="!pt-0 !pb-6 pr-12">
                    <p className="text-brand-muted text-base sm:text-[1.05rem] leading-relaxed border-l-2 border-brand-blue pl-4">
                      {faq.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      {/* Faixa azul inclinada de contato */}
      <section aria-labelledby="cta-duvidas" className="relative py-6 md:py-10 bg-brand-bg overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 right-0 mx-2 sm:mx-4 bg-brand-blue -skew-x-[10deg]" />
          <div className="relative grid md:grid-cols-[auto_1fr_auto] items-center gap-6 md:gap-10 px-6 sm:px-12 py-10 md:py-12">
            <h3 id="cta-duvidas" className="title-display text-5xl sm:text-6xl text-white">
              Ainda tem dúvidas?
            </h3>
            <p className="text-white/90 text-lg leading-relaxed md:border-l md:border-white/40 md:pl-8 max-w-md">
              Estamos a uma mensagem de distância para te ajudar a tomar a melhor decisão. Resposta rápida em minutos durante horário comercial.
            </p>
            <div className="flex flex-col gap-3">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-brand btn-brand-light group">
                <MessageCircle className="w-5 h-5" strokeWidth={2.4} aria-hidden="true" />
                Falar no WhatsApp
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.4} aria-hidden="true" />
              </a>
              <button onClick={onCTAClick} type="button" className="inline-flex items-center justify-center gap-2 min-h-[2.9rem] px-5 text-base font-semibold text-white border border-white/60 hover:bg-white/10 transition-colors">
                <CalendarDays className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
                Preencher Ficha de Avaliação
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
