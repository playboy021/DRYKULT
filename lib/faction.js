// Dve strane kulta. Nisu varijante proizvoda nego identitet — posetilac bira
// jednu i ceo sajt se zaključava u nju: paleta, sjaj, boja spreja u prelazu,
// ton zvuka.
//
// MAMBA — IZMERENA 9. 9. 2026. sa fabričkog MOCKUPA pravog peškira
//         (assets-src/drykult/peskir-zeleni-mockup.jpeg, prosek 252 k zasićenih
//         piksela): #59F312, hue 101°, zasićenost 90%. Peškir na sajtu
//         (peskir-zeleni.png) je NACRTAN po tom mockupu skriptom
//         scripts/gen-peskir-zeleni.mjs i nosi istu vrednost — do prave fotke.
//         Ranijih 91° je bio kompromis sa studijske fotke prethodnog uzorka
//         (izmereno 68°, gurnuto ka zelenom da ne čita kao limun). Sad proizvod
//         postoji i sajt ide za njim. ZELENO TELO + CRNA ŠTAMPA, vodoravan (1,356:1).
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
    core: '#59F312',
    bright: '#ADF98A',
    deep: '#2C7E06',
    rgb: '89,243,18',
    // Podloga posle izbora: hue frakcije, zasićenost 60%, svetlina neutralne
    // crne. Postavlja je globals.css preko data-side; ovde stoji da vrednost
    // živi uz frakciju, a ne samo u CSS-u.
    bg: '#070E03',
    // Kontrast tamnog teksta (#07080A) na core — izmereno 13.60:1
    kontrast: 13.6,
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
