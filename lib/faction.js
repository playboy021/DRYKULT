// Dve strane kulta. Nisu varijante proizvoda nego identitet — posetilac bira
// jednu i ceo sajt se zaključava u nju: paleta, sjaj, boja spreja u prelazu,
// ton zvuka.
//
// MAMBA — PREMERENA 9. 9. 2026. sa fabričkog rendera pravog peškira
//         (assets-src/drykult/peskir-zeleni.png, 2000×1500, providna pozadina):
//         #45E33B, hue 116°, zasićenost 75%. Ranijih 91° je bio kompromis
//         izveden sa studijske fotke prethodnog uzorka (izmereno 68°, gurnuto
//         ka zelenom da ne čita kao limun). Sad proizvod postoji i sajt ide za
//         njim. Peškir je sada ZELENO TELO + CRNA ŠTAMPA, vodoravan (1,356:1).
// PINK  — 353°, sa studijske fotke; ZAKLJUČAN dok se ženska verzija ne napravi.
//         Ostaje u tokenima jer arhiva na /a i prelazi i dalje znaju za nju.

export const PINK = 'pink';
export const MAMBA = 'mamba';

const KLJUC = 'drykult:side';

export const STRANE = {
  [MAMBA]: {
    id: MAMBA,
    ime: 'MAMBA',
    boja: 'neon zelena',
    core: '#45E33B',
    bright: '#99F094',
    deep: '#167411',
    rgb: '69,227,59',
    // Podloga posle izbora: hue frakcije, zasićenost 60%, svetlina neutralne
    // crne. Postavlja je globals.css preko data-side; ovde stoji da vrednost
    // živi uz frakciju, a ne samo u CSS-u.
    bg: '#040E03',
    // Kontrast tamnog teksta (#07080A) na core — izmereno 11.74:1
    kontrast: 11.74,
    // Niži i oštriji — sečivo, ne staklo
    zvuk: { od: 2100, do: 300 },
    peskir: 'mamba',
    zakljucano: false,
  },
  [PINK]: {
    id: PINK,
    ime: 'PINK',
    boja: 'koralna',
    core: '#FF6E80',
    bright: '#FFB3BE',
    deep: '#8E2B3A',
    rgb: '255,110,128',
    bg: '#0E0305',
    kontrast: 7.44,
    // Ton swoosh-a u prelazu: viši i staklast
    zvuk: { od: 3200, do: 520 },
    peskir: 'pink',
    // ZAKLJUČANO. Ženska verzija se pravi; dok je nema, ne sme ni da se izabere
    // ni da se naruči — ali se VIDI, da se zna da dolazi. Bez lažnog datuma.
    zakljucano: true,
    uskoro: 'ženska verzija',
  },
};

// Strane koje se stvarno mogu izabrati. Sve što bira ili nabraja strane ide
// preko ovoga, ne preko Object.keys(STRANE).
export const DOSTUPNE = Object.values(STRANE).filter((s) => !s.zakljucano).map((s) => s.id);

export function ucitajStranu() {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(KLJUC);
    return DOSTUPNE.includes(v) ? v : null;
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
  return id === PINK ? MAMBA : PINK;
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
