// CSS pokriva sve DO 1920px (vidi globals.css). Iznad toga vw-formula bi
// nastavila da raste linearno i tekst bi postao ogroman, pa naviše skaliramo
// prigušeno — koeficijentom 0.6666.

const FONT_BASE = 16;
const BASE_WIDTH = 1920;
const COEF = 0.6666;

export function applyRemScale() {
  if (typeof window === 'undefined') return;
  const w = window.innerWidth;
  const size = FONT_BASE - (FONT_BASE * (((BASE_WIDTH - w) / BASE_WIDTH) * 100) * COEF) / 100;
  // Ispod 1920 formula daje < 16 — tamo CSS media query već radi svoj posao.
  if (size > FONT_BASE) {
    document.documentElement.style.fontSize = `${size}px`;
  } else {
    document.documentElement.style.fontSize = '';
  }
}

export function watchRemScale() {
  if (typeof window === 'undefined') return () => {};
  applyRemScale();
  window.addEventListener('resize', applyRemScale, { passive: true });
  return () => window.removeEventListener('resize', applyRemScale);
}
