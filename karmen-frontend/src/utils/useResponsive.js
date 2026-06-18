import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile,
    // Padding izquierdo según dispositivo: desktop=sidebar, mobile=sin padding
    mainPadding: isMobile
      ? { paddingLeft: 0, paddingBottom: 68 }
      : { paddingLeft: 240 },
    // Columnas de grid responsivas
    grid: (desktop, mobile = 1) => ({
      gridTemplateColumns: `repeat(${isMobile ? mobile : desktop}, 1fr)`,
    }),
  };
}
