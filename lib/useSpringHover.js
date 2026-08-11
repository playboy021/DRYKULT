import { useEffect, useRef } from 'react';
import { createSpring, SPRINGS } from './spring';

// Hover koji se smiruje oprugom umesto CSS tranzicijom.
// Razlika se vidi kad korisnik brzo pređe preko dugmeta pa se vrati:
// tranzicija se prekine i krene iz početka, opruga nastavi iz zatečene brzine.
//
// Na dodiru se GASI: telefon nema hover, a "sticky hover" stanje posle tapa
// je jedan od najčešćih razloga zašto dugme ostane vizuelno pritisnuto.
export function useSpringHover(amount = 1) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const s = createSpring(0, SPRINGS.hover);
    let raf = 0;
    let running = false;

    const tick = () => {
      const alive = s.step();
      const v = s.value;
      el.style.setProperty('--hover', v.toFixed(4));
      if (alive) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };
    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const enter = () => {
      s.set(amount);
      kick();
    };
    const leave = () => {
      s.set(0);
      kick();
    };

    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('focus', enter);
    el.addEventListener('blur', leave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('focus', enter);
      el.removeEventListener('blur', leave);
    };
  }, [amount]);

  return ref;
}
