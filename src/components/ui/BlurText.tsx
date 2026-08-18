'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BlurTextAnimateBy = 'words' | 'characters';

export interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: { opacity: number; filter: string };
  animationTo?: { opacity: number; filter: string };
  easing?: string | number[];
  threshold?: number;
  rootMargin?: string;
  animateBy?: BlurTextAnimateBy;
  stagger?: number;
  duration?: number;
  onAnimationComplete?: () => void;
}

export function BlurText({
  text,
  delay = 0,
  className,
  animationFrom = { opacity: 0, filter: 'blur(10px)' },
  animationTo = { opacity: 1, filter: 'blur(0px)' },
  easing = 'easeOut',
  threshold = 0.1,
  rootMargin = '0px',
  animateBy = 'words',
  stagger = 0.04,
  duration = 0.5,
  onAnimationComplete,
}: BlurTextProps) {
  const words = text.split(' ');

  const letters = animateBy === 'characters' ? words.map((word) => word.split('')) : [];

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      onAnimationComplete={onAnimationComplete}
      viewport={{ once: true, amount: threshold, margin: rootMargin }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: animateBy === 'characters' ? 0.02 : stagger,
            delayChildren: delay,
          },
        },
      }}
      className={cn('inline-flex flex-wrap', className)}
      aria-label={text}
    >
      {animateBy === 'words'
        ? words.map((word, wordIndex) => (
            <motion.span
              variants={{
                hidden: animationFrom,
                visible: {
                  ...animationTo,
                  transition: { duration, ease: easing },
                },
              }}
              key={`word-${wordIndex}`}
              className="inline-block mr-[0.25em] whitespace-nowrap"
            >
              {word}
            </motion.span>
          ))
        : words.map((word, wordIndex) => (
            <span
              key={`word-${wordIndex}`}
              className="inline-flex mr-[0.25em] whitespace-nowrap"
            >
              {letters[wordIndex]?.map((letter, letterIndex) => (
                <motion.span
                  key={`char-${wordIndex}-${letterIndex}`}
                  variants={{
                    hidden: animationFrom,
                    visible: {
                      ...animationTo,
                      transition: { duration, ease: easing },
                    },
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </span>
          ))}
    </motion.span>
  );
}

export default BlurText;
