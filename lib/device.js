// Prepoznaje koliko uređaj može da izgura, pa sajt SAM bira kvalitet.
// Sve je čitanje browser signala (bez merenja), pa nema kašnjenja pri startu —
// tier moramo znati PRE prvog iscrtavanja da ne bismo skinuli pogrešan asset.

export const HIGH = 'high'; // pun liquid reveal + 3D peškir
export const MID = 'mid'; // liquid reveal na manjoj rezoluciji, bez WebGL-a
export const LOW = 'low'; // BEZ kursora i WebGL-a — video se sam izvrti

const mm = (q) => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches;
const conn = () => (typeof navigator !== 'undefined' && (navigator.connection || navigator.mozConnection)) || {};

// Korisnik je u sistemu tražio manje animacija — poštuj to uvek.
export function prefersReducedMotion() {
  return mm('(prefers-reduced-motion: reduce)');
}

// Štednja podataka ili spora mreža — nema teških fajlova.
export function isDataSaver() {
  const c = conn();
  if (c.saveData) return true;
  return !!(c.effectiveType && /2g$|^3g$/.test(c.effectiveType));
}

// Prst umesto miša = telefon/tablet. Bez kursora nema liquid reveal-a.
export function isTouch() {
  return mm('(pointer: coarse)') || (typeof window !== 'undefined' && window.innerWidth < 900);
}

// RASPORED nije isto što i TIER, i ne sme da zavisi od njega.
//
// `tier` odgovara na „koliko uređaj i veza mogu da izguraju" — pa `low`
// obuhvata i desktop na sporoj vezi ili sa saveData. `raspored` odgovara na
// „ima li ovaj uređaj miša i mesta za dve kolone".
//
// Dok su bili spojeni, desktop na 3G vezi je dobijao mobilni raspored:
// peškiri naslagani jedan ispod drugog i bez praćenja kursora. Izgledalo je
// kao da je sajt pokvaren, a bio je samo pogrešno pitan.
export function uskiRaspored() {
  if (typeof window === 'undefined') return false;
  return mm('(pointer: coarse)') || window.innerWidth < 900;
}

// Ima li čime da se pokazuje. Praćenje kursora zavisi OD OVOGA, ne od tiera.
export function imaPokazivac() {
  if (typeof window === 'undefined') return false;
  return mm('(pointer: fine)') && !mm('(prefers-reduced-motion: reduce)');
}

export function detectTier() {
  if (typeof window === 'undefined') return MID; // SSR — neutralno, klijent ispravi
  if (prefersReducedMotion() || isDataSaver()) return LOW;
  if (isTouch()) return LOW; // telefon: video ide sam, bez scrub-a (jeftinije za CPU)

  const cores = navigator.hardwareConcurrency || 4;
  const ram = navigator.deviceMemory || 0; // Chrome daje; ostali 0 = nepoznato
  if (cores >= 8 && (ram === 0 || ram >= 8)) return HIGH;
  if (cores >= 4) return MID;
  return LOW;
}

// Koji par slika hero koristi za dati tier.
// Osnovni (uvek vidljiv) sloj je MOKAR, a kursor farba SUV — ne obrnuto.
//
// PAŽNJA: `public/hero/` je PRAZAN. Slike prethodnog brenda su obrisane i ovo
// čeka DRYKULT snimanje na autu. Do tada `LiquidReveal` i `HeroVideo` nisu
// povezani ni sa jednom stranicom — ova funkcija je priprema, ne živ kod.
export function heroAssets(tier) {
  if (tier === HIGH) {
    return {
      mode: 'reveal',
      wet: '/hero/wet-hi.jpg',
      dry: '/hero/dry-hi.jpg',
      towel: '/hero/towel-hi.webp',
      webgl: true,
    };
  }
  if (tier === MID) {
    return {
      mode: 'reveal',
      wet: '/hero/wet-md.jpg',
      dry: '/hero/dry-md.jpg',
      towel: '/hero/towel-md.webp',
      webgl: false, // MID dobija parallax PNG, ne Three.js
    };
  }
  return {
    mode: 'video',
    poster: '/hero/poster-low.jpg',
    video: '/hero/hero-low.mp4',
    webgl: false,
  };
}

// Prvi red naslova je tier-svestan: na telefonu nema kursora,
// pa "Prevuci." tražilo bi radnju koja ne postoji.
export function headlineLines(tier) {
  const first = tier === LOW ? 'Pogledaj.' : 'Prevuci.';
  return [first, 'I suvo je.', 'Bez ijednog traga.'];
}
