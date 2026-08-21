// Dve strane kulta. Nisu varijante proizvoda nego identitet — posetilac bira
// jednu i ceo sajt se zaključava u nju: paleta, sjaj, boja spreja u prelazu,
// ton zvuka.
//
// Boje su izmerene sa studijskih fotki peškira (uzorkovanje po regionima:
// opšiv, natpis, pliš), pa im je hue podešen za ekran:
//   HROM  353 stepeni — izmereno 352, ostaje kako jeste
//   MAMBA  91 stepeni — izmereno 64-68, ali na toj vrednosti čita kao
//                       limun-žuta umesto kao zelena. 91 je kompromis:
//                       dovoljno zeleno da se prepozna, dovoljno blizu
//                       materijalu da veza sa proizvodom u ruci ne pukne.

export const HROM = 'hrom';
export const MAMBA = 'mamba';

const KLJUC = 'drykult:side';

export const STRANE = {
  [HROM]: {
    id: HROM,
    ime: 'HROM',
    boja: 'koralna',
    core: '#FF6E80',
    bright: '#FFB3BE',
    deep: '#8E2B3A',
    rgb: '255,110,128',
    // Podloga posle izbora. Izvedena, ne izabrana: hue frakcije, zasićenost 45%,
    // svetlina ista kao kod neutralne crne. Postavlja je globals.css preko
    // data-side; ovde stoji da vrednost živi uz frakciju, a ne samo u CSS-u.
    bg: '#0C0506',
    // Kontrast tamnog teksta (#07080A) na core — provereno, prolazi prag
    kontrast: 7.44,
    // Ton swoosh-a u prelazu: viši i staklast
    zvuk: { od: 3200, do: 520 },
    peskir: 'pink',
  },
  [MAMBA]: {
    id: MAMBA,
    ime: 'MAMBA',
    boja: 'neon zelena',
    core: '#8CEF2E',
    bright: '#C3F98D',
    deep: '#3E7A12',
    rgb: '140,239,46',
    bg: '#080C05',
    kontrast: 13.83,
    // Niži i oštriji — sečivo, ne staklo
    zvuk: { od: 2100, do: 300 },
    peskir: 'mamba',
  },
};

export function ucitajStranu() {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(KLJUC);
    return v === HROM || v === MAMBA ? v : null;
  } catch {
    return null; // private mode — samo nema pamćenja, sajt radi
  }
}

export function upisiStranu(id) {
  try {
    localStorage.setItem(KLJUC, id);
  } catch {
    /* nije kritično */
  }
}

export function obrisiStranu() {
  try {
    localStorage.removeItem(KLJUC);
  } catch {
    /* nije kritično */
  }
}

// Tokeni se postavljaju na <html>, ne na neki div — da ih nasledi SVE,
// uključujući fixed slojeve (loader, prelaz) koji žive van glavnog stabla.
export function primeniStranu(id) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (!id) {
    el.removeAttribute('data-side');
    return;
  }
  el.setAttribute('data-side', id);
}

export function suprotna(id) {
  return id === HROM ? MAMBA : HROM;
}

// Slika peškira po tieru. WebP, ne PNG — vidi scripts/gen-drykult.mjs.
// `sm` na telefonu nije škrtost nego račun: 420px je više nego dovoljno za
// prikaz od pola ekrana, a par peškira tako staje u 37 KB umesto u 75.
export function peskirSlika(id, tier, velicina) {
  const s = STRANE[id];
  if (!s) return null;
  const v = velicina || (tier === 'low' ? 'sm' : tier === 'mid' ? 'md' : 'hi');
  return `/drykult/${s.peskir}-${v}.webp`;
}
