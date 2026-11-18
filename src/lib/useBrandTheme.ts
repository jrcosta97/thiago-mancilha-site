import { useEffect } from 'react';

/**
 * Liga o tema visual "TM///" enquanto a página estiver montada.
 * Aplicado no <html> para alcançar também janelas abertas em portal (ex.: ficha de avaliação).
 */
export function useBrandTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('brand');
    return () => root.classList.remove('brand');
  }, []);
}
