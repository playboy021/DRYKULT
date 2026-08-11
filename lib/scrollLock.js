// Jedan bulean gate za ceo sajt. Koriste ga loader, meni i modal.
// Zašto i Lenis i CSS: Lenis zaustavlja svoju petlju, ali native skrol
// (space, PageDown, touch) i dalje prolazi — zato i tvrda tri stila na <html>.

let locks = 0;

function html() {
  return typeof document !== 'undefined' ? document.documentElement : null;
}

export function stopScroll() {
  locks += 1;
  if (locks > 1) return; // već zaključano, ne diraj stilove ponovo
  const lenis = typeof window !== 'undefined' && window.__lenis;
  if (lenis) lenis.stop();
  const h = html();
  if (h) {
    h.style.position = 'relative';
    h.style.overflow = 'hidden';
    h.style.height = '100%';
  }
}

export function startScroll() {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return; // neko drugi još drži bravu
  const lenis = typeof window !== 'undefined' && window.__lenis;
  if (lenis) lenis.start();
  const h = html();
  if (h) {
    h.style.position = '';
    h.style.overflow = '';
    h.style.height = '';
  }
}

export function isScrollLocked() {
  return locks > 0;
}
