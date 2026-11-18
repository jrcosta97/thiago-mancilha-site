import { useEffect } from 'react';

/**
 * Liga o tema visual "TM///" enquanto a página estiver montada.
 * Aplicado no <html> para alcançar também janelas abertas em portal (ex.: ficha de avaliação).
 * variant 'admin' acrescenta os ajustes do painel (rótulos e botões condensados em caixa alta).
 */
export function useBrandTheme(variant: 'site' | 'admin' = 'site') {
  useEffect(() => {
    const root = document.documentElement;
    const classes = variant === 'admin' ? ['brand', 'brand-admin'] : ['brand'];
    root.classList.add(...classes);
    return () => root.classList.remove(...classes);
  }, [variant]);
}
