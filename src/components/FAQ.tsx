import { motion } from 'framer-motion';
import { HelpCircle, MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const WHATSAPP_NUMBER = '5548988720439';

interface FAQProps {
  onCTAClick: () => void;
}

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
    <section id="faq" className="py-24 md:py-32 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <HelpCircle className="w-3.5 h-3.5" />
            PERGUNTAS FREQUENTES
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            Tire suas <span className="text-gradient">dúvidas</span> antes de começar
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Respondemos as perguntas mais comuns recebidas diariamente — incluindo atendimento a público maduro e uso de medicações como o Mounjaro. Se não encontrar sua resposta, é só falar com a gente no WhatsApp.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="!rounded-3xl bg-card !p-2 sm:!p-3 border-white/6 shadow-card">
            <div className="w-full">
              <Accordion
                defaultValue={[`faqs-item-0`]}
                className="w-full gap-0"
              >
                {faqs.map((faq, i) => (
                  <div
                    key={`wrap-${i}`}
                    className={`${i !== faqs.length - 1 ? 'border-b border-white/8' : ''} first:rounded-t-2xl last:rounded-b-2xl`}
                  >
                    <AccordionItem
                      value={`faqs-item-${i}`}
                    >
                      <div className="px-2 sm:px-5 py-1 sm:py-2">
                        <AccordionTrigger className="!py-4 sm:!py-5 flex items-start gap-3 sm:gap-5 !rounded-xl hover:!no-underline hover:!bg-white/[0.03] !transition-all !text-left">
                          <div className="flex items-center justify-between flex-1 min-w-0 gap-4">
                            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                                <span className="font-display font-bold text-sm">{String(i + 1).padStart(2, '0')}</span>
                              </div>
                              <div className="flex flex-col items-start gap-2 min-w-0">
                                {faq.tag && (
                                  <Badge className={`h-5 px-2.5 text-[10px] font-bold uppercase tracking-wide border ${faq.tagColor}`}>
                                    {faq.tag}
                                  </Badge>
                                )}
                                <h3 className="font-display font-bold !text-base sm:!text-lg leading-snug text-foreground pr-2 data-open:text-accent">
                                  {faq.q}
                                </h3>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="!pb-6 sm:!pb-7 pl-0 sm:pl-2">
                          <div className="pl-12 sm:pl-[4.5rem] pr-2 sm:pr-4">
                            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                              {faq.a}
                            </p>
                          </div>
                        </AccordionContent>
                      </div>
                    </AccordionItem>
                  </div>
                ))}
              </Accordion>
            </div>
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
