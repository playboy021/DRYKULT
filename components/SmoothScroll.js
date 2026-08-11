import { useEffect } from 'react';
import Lenis from 'lenis';

// Lenis sa RUČNOM rAF petljom (ne autoRaf) — kasnije GSAP ScrollTrigger mora
// da se ukuca u isti tik, a to ide samo ako mi držimo petlju.
export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Browser voli da vrati skrol na staru poziciju posle reload-a —
    // to razbije loader i hero, pa mu to oduzimamo.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: false, // na dodiru native skrol je bolji i jeftiniji
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // scrollLock.js i ostali dohvataju instancu odavde.
    window.__lenis = lenis;
    lenis.scrollTo(0, { immediate: true });

    let id;
    const raf = (time) => {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);

    // ZAKON 4.6 — tab u pozadini: sve staje, ne trošimo bateriju.
    const onVis = () => (document.hidden ? lenis.stop() : lenis.start());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('visibilitychange', onVis);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return children;
}
