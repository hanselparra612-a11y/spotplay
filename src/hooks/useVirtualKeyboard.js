import { useState, useEffect } from 'react';

/**
 * Hook para detectar en tiempo real la apertura y altura del teclado virtual en dispositivos móviles.
 * Utiliza la API window.visualViewport para calcular los píxeles exactos que ocupa el teclado.
 */
export function useVirtualKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const vh = window.visualViewport.height;
        const wh = window.innerHeight;
        const diff = wh - vh;
        // Solo considerar teclado si la reducción es superior a 75px
        if (diff > 75) {
          setKeyboardHeight(diff);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      handleViewportChange();
    }

    return () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  return keyboardHeight;
}
