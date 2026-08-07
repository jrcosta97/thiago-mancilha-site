import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';

interface FAQProps {
  onCTAClick: () => void;
}

const faqs = [
  {
    q: 'Qual a frequência ideal de treinos para ter resultados?',
    a: 'A frequência ideal varia conforme seu objetivo e disponibilidade. Para a maioria das pessoas, 3 a 5 sessões semanais de 40-60 minutos são suficientes para gerar resultados consistentes. Durante a avaliação inicial, traçamos o planejamento ideal para o seu perfil, evitando sobrecarga e priorizando a recuperação.',
  },
  {
    q: 'Como funciona a consultoria online? É realmente efetiva?',
    a: 'Sim! A consultoria online funciona para alunos de todos os níveis. Você recebe seu treino personalizado pelo aplicativo, com vídeos demonstrativos, e pode executar onde for mais conveniente (academia, casa, parque). O suporte por WhatsApp e os check-ins quinzenais garantem o acompanhamento de perto, com ajustes sempre que necessário. Muitos dos meus melhores resultados vieram de alunos online.',
  },
  {
    q: 'Sou totalmente iniciante, nunca treinei. Serve para mim?',
    a: 'Com certeza! O método foi desenhado especialmente para receber iniciantes. Todos os exercícios têm variações de dificuldade e o suporte diário ajuda a manter a consistência. Começamos devagar, respeitamos sua curva de aprendizado e evoluímos gradualmente. A maioria dos meus alunos iniciantes vê mudanças perceptíveis já nas primeiras 8 semanas.',
  },
  {
    q: 'Tenho lesão ou limitação física, posso treinar?',
    a: 'Na maioria dos casos, sim. Na etapa de anamnese coletamos todas as informações sobre suas limitações e condições. Se necessário, trabalhamos em conjunto com seu fisioterapeuta ou médico para construir um programa seguro e alinhado às suas reais possibilidades, sempre priorizando saúde antes de performance.',
  },
  {
    q: 'Quanto tempo demora para ver os primeiros resultados?',
    a: 'Na média, os primeiros sinais (melhora da disposição, mais energia, aumento da força) aparecem em 3 a 4 semanas. As mudanças visuais perceptíveis (perda de medidas, ganho de massa) costumam aparecer entre 8 e 12 semanas de consistência. Vale lembrar que cada corpo responde de um jeito diferente. Trabalhamos com metas progressivas e mensuráveis.',
  },
];

export default function FAQ({ onCTAClick }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
            Respondemos as perguntas mais comuns recebidas diariamente. Se não encontrar sua resposta, é só falar com a gente no WhatsApp.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className={`w-full text-left card-dark !p-0 overflow-hidden transition-all ${
                  openIndex === i ? 'border-accent/40' : ''
                }`}
              >
                <div className="flex items-start gap-4 p-5 sm:p-6">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    openIndex === i ? 'bg-accent text-background' : 'bg-white/5 text-accent'
                  }`}>
                    <span className="font-display font-bold text-sm">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-display font-bold text-base sm:text-lg leading-snug ${
                      openIndex === i ? 'text-accent' : 'text-text-primary'
                    }`}>
                      {faq.q}
                    </h3>
                    <AnimatePresence initial={false}>
                      {openIndex === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="text-sm sm:text-base text-text-secondary leading-relaxed overflow-hidden"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-text-secondary transition-transform duration-300 mt-1 ${
                      openIndex === i ? 'rotate-180 text-accent' : ''
                    }`}
                  />
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-3xl card-dark !bg-gradient-to-br !from-accent/10 via-background-card to-background-card !border !border-accent/20 p-8 sm:p-10 text-center"
        >
          <MessageCircle className="w-12 h-12 text-accent mx-auto mb-4" strokeWidth={1.5} />
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-text-primary mb-3">
            Ainda tem dúvidas?
          </h3>
          <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto mb-6">
            Estamos a uma mensagem de distância para te ajudar a tomar a melhor decisão.
          </p>
          <button onClick={onCTAClick} className="btn-primary">
            Falar no WhatsApp
            <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
