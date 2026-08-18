import { motion } from 'framer-motion';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '5548988720439';

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
    <section id="faq" className="py-12 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-8 space-y-2"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            Tire suas dúvidas antes de começar
          </h2>
          <p className="text-sm md:text-base text-slate-400">
            Respostas diretas para as dúvidas mais comuns antes de iniciar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm max-w-2xl mx-auto w-full mb-10">
            <Accordion
              defaultValue={['faqs-item-0']}
              className="w-full"
            >
              {faqs.map((faq, i) => {
                const miniBadge = getQuestionBadge(faq.q);
                return (
                  <AccordionItem
                    key={`faq-${i}`}
                    value={`faqs-item-${i}`}
                    className={`border-b border-slate-800/60 ${
                      i === faqs.length - 1 ? 'last:border-0' : ''
                    }`}
                  >
                    <AccordionTrigger
                      className="group/accordion-trigger relative hover:!no-underline hover:!bg-transparent !rounded-none !px-0 !py-0 [&_[data-slot=accordion-trigger-icon]]:!hidden **:data-[slot=accordion-trigger-icon]:!hidden"
                    >
                      <div className="flex items-center justify-between gap-4 text-left font-semibold text-slate-100 hover:text-lime-400 py-4 transition-all w-full aria-expanded:text-lime-400">
                        <div className="flex items-center flex-1 min-w-0 gap-0">
                          <span className="leading-snug min-w-0 text-base">
                            {cleanQuestion(faq.q)}
                          </span>
                          {miniBadge.show && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] text-lime-400 border-lime-500/30 bg-lime-500/10 shrink-0 ml-2 h-5 px-2 tracking-wide font-bold uppercase'
                              )}
                            >
                              {miniBadge.label}
                            </Badge>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-lime-400/10 border border-lime-500/20 text-lime-400 group-aria-expanded/accordion-trigger:bg-lime-400 group-aria-expanded/accordion-trigger:text-black group-aria-expanded/accordion-trigger:border-lime-400 transition-all">
                          <ChevronDown className="w-4 h-4 shrink-0 group-aria-expanded/accordion-trigger:hidden transition-transform" />
                          <ChevronUp className="w-4 h-4 shrink-0 hidden group-aria-expanded/accordion-trigger:inline-flex transition-transform" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="!pt-0 !pb-5 pl-0 pr-1">
                      <div className="bg-slate-950/40 p-4 rounded-xl mt-1 text-slate-300 text-sm leading-relaxed border border-slate-800/40">
                        {faq.a}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-3xl !card-dark !bg-gradient-to-br !from-accent/10 via-background-card to-background-card !border !border-accent/20 p-8 sm:p-10 text-center shadow-neon"
        >
          <MessageCircle className="w-12 h-12 text-accent mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-text-primary mb-3">
            Ainda tem dúvidas?
          </h3>
          <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto mb-6">
            Estamos a uma mensagem de distância para te ajudar a tomar a melhor decisão. Resposta rápida em minutos durante horário comercial.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold bg-[#25D366] text-white hover:bg-[#1ebe5b] transition-all shadow-[0_8px_30px_rgba(37,211,102,0.45)] group"
            >
              Falar no WhatsApp
              <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
            </a>
            <button
              onClick={onCTAClick}
              className="btn-secondary !py-3.5 text-sm font-bold"
            >
              Preencher Ficha de Avaliação
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
