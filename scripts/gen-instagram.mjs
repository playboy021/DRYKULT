// INSTAGRAM — vizuelni paket, crtan offline.
//
// Instagram je UVOD U SAJT, ne zaseban brend. Zato se ovde ne izmišlja nova
// estetika: fontovi su ISTI fajlovi koje sajt servira (Passion One, Archivo,
// Inter — čitaju se iz `.next/static/media`, ništa se ne skida), boje su isti
// tokeni iz `styles/globals.css`, a jezik je isti GTA registar — tvrda pomerena
// senka, neon za proizvod, zlato za „wanted".
//
// Pravilo poštenja važi i ovde: nema izmišljenih brojki, recenzija, odbrojavanja
// ni tuđih fotki. Sve što se objavljuje mora da postoji — a dok nema uzoraka,
// postoji: logo, fabrički mockup, specifikacija, garancija i SAM SAJT.
//
// Pokretanje:  node scripts/gen-instagram.mjs
// Izlaz:       instagram/

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const KOREN = path.resolve(import.meta.dirname, '..');
const IZLAZ = path.join(KOREN, 'instagram');

// --- boje (isti tokeni kao sajt) --------------------------------------------
const B = {
  bg: '#070E03', // MAMBA podloga
  crna: '#07080A', // neutralna crna (pre izbora strane)
  ink: '#F4F6F8',
  muted: '#8A9099',
  core: '#59F312',
  bright: '#ADF98A',
  deep: '#2C7E06',
  rgb: '89,243,18',
  gold: '#F5C21B',
  goldDeep: '#6E5304',
  senka: '#262B33', // tvrda senka za bela slova
  pink: '#FF6E80',
  pinkDeep: '#8E2B3A',
};

// --- fontovi ------------------------------------------------------------------
// Uzimaju se iz NAŠEG builda: next/font je već skinuo tačno te fajlove i oni
// stoje u .next/static/media. Tako Instagram i sajt ne mogu da se raziđu.
//
// ZAMKA: next/font deli svaku familiju po `unicode-range` — jedan fajl nosi
// osnovnu latinicu, drugi latin-ext (š đ č ć ž). Browser bira po znaku, canvas
// NE UME: po familiji drži jedan rez. Prvi prolaz je zato ispao u kvadratićima —
// registrovao se latin-ext fajl, pa su sva obična slova bila .notdef, a taman se
// „GREŠKA" ispisala jer Š jeste u tom podskupu.
// Rešenje: oba fajla se registruju odvojeno, a ispis bira rez ZA SVAKI ZNAK —
// isto što browser radi sam. Mapa se čita iz @font-face pravila u buildu, da ne
// zavisi od heširanih imena fajlova koja se menjaju sa svakim buildom.
//
// DRUGA ZAMKA, izmerena: Passion One u latin-ext podskupu ima SAMO Š i Ž.
// Č, Ć, Đ (i mala č ć đ) mu prosto nedostaju — nije stvar podskupa nego samog
// fonta. Zato svaka uloga ima i `fb`, težak sistemski rez sa punom srpskom
// latinicom, na koji se pada ZA TAJ ZNAK. Isto radi i browser na sajtu.
const F = {
  gta: { lat: 'Impact', ext: 'Impact', fb: 'Impact' },
  hud: { lat: 'Arial', ext: 'Arial', fb: 'Arial' },
  telo: { lat: 'Arial', ext: 'Arial', fb: 'Arial' },
};
// Jedno ime, bez zareza: font string se sklapa kao `size px "ime"`, pa bi lista
// familija unutra polomila navodnike i sve bi ispalo .notdef.
const REZERVA = 'Segoe UI Symbol'; // ★ → ◆ — znakovi kojih nema ni u jednom podskupu

async function fontovi() {
  const chunks = path.join(KOREN, '.next', 'static', 'chunks');
  const media = path.join(KOREN, '.next', 'static', 'media');
  const nadjeno = {};
  try {
    for (const f of await readdir(chunks)) {
      if (!f.endsWith('.css')) continue;
      const css = await readFile(path.join(chunks, f), 'utf8');
      for (const [, blok] of css.matchAll(/@font-face\{([^}]*)\}/g)) {
        const fam = blok.match(/font-family:\s*'?([^;']+)'?/)?.[1]?.trim();
        const src = blok.match(/media\/([^)'"]+\.woff2)/)?.[1];
        const ur = blok.match(/unicode-range:\s*([^;]+)/)?.[1] ?? '';
        if (!fam || !src) continue;
        const podskup = /U\+100-2BA/.test(ur) ? 'ext' : /U\+\?\?/.test(ur) ? 'lat' : null;
        if (podskup) (nadjeno[fam] ??= {})[podskup] = src;
      }
    }
  } catch {
    /* nema builda — ostaju sistemske rezerve */
  }

  const veza = { gta: 'Passion One', hud: 'Archivo', telo: 'Inter' };
  for (const [uloga, ime] of Object.entries(veza)) {
    const par = nadjeno[ime];
    if (!par?.lat || !par?.ext) continue;
    for (const p of ['lat', 'ext']) {
      const alias = `dk_${uloga}_${p}`;
      if (GlobalFonts.registerFromPath(path.join(media, par[p]), alias)) F[uloga][p] = alias;
    }
  }
  if (F.gta.lat === 'Impact') {
    console.warn('! Passion One nije nađen — crta se Impact-om.');
    console.warn('  Pokreni `npm run build` pa ponovo, da slova budu ista kao na sajtu.');
  } else {
    console.log('fontovi: Passion One / Archivo / Inter — iz builda, po znaku');
  }
}

// Ima li rez traženi znak. Meri se širina: kad glifa nema, canvas vraća širinu
// .notdef-a, a ona je za dati rez uvek ista — pa se poredi sa širinom znaka iz
// privatne zone, koga sigurno nema ni u jednom fontu.
const _notdef = new Map();
const _glif = new Map();
function imaGlif(g, alias, ch) {
  const kljuc = alias + '|' + ch;
  if (_glif.has(kljuc)) return _glif.get(kljuc);
  if (!_notdef.has(alias)) {
    g.font = `100px "${alias}"`;
    _notdef.set(alias, g.measureText(String.fromCharCode(0xe000)).width); // privatna zona — nema je nijedan font
  }
  g.font = `100px "${alias}"`;
  const ok = Math.abs(g.measureText(ch).width - _notdef.get(alias)) > 0.01;
  _glif.set(kljuc, ok);
  return ok;
}

// Koji rez nosi dati znak: prvo osnovna latinica, pa latin-ext, pa težak
// sistemski rez (Č Ć Đ), pa simbolski. Isti redosled koji browser sam pravi.
function rezZa(g, fam, ch) {
  for (const a of [fam.lat, fam.ext, fam.fb]) if (imaGlif(g, a, ch)) return a;
  return REZERVA; // ★ → ◆ ↓
}

// Jedini ispis u fajlu: crta znak po znak, bira rez za svaki, radi razmak među
// slovima (canvas nema upotrebljiv letterSpacing) i tvrdu GTA senku.
function crtaj(g, tekst, x, y, o) {
  const { fam, size, boja = B.ink, align = 'left', spacing = 0, senka = null } = o;
  const zn = [...tekst];
  g.save();
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const sirine = zn.map((ch) => {
    g.font = `${size}px "${rezZa(g, fam, ch)}"`;
    return g.measureText(ch).width;
  });
  const uk = sirine.reduce((a, b) => a + b, 0) + spacing * Math.max(0, zn.length - 1);
  const x0 = align === 'center' ? x - uk / 2 : align === 'right' ? x - uk : x;
  const prolaz = (dx, dy, c) => {
    g.fillStyle = c;
    let cx = x0 + dx;
    for (let i = 0; i < zn.length; i++) {
      g.font = `${size}px "${rezZa(g, fam, zn[i])}"`;
      g.fillText(zn[i], cx, y + dy);
      cx += sirine[i] + spacing;
    }
  };
  if (senka) prolaz(size * 0.05, size * 0.055, senka);
  prolaz(0, 0, boja);
  g.restore();
  return uk;
}

const meri = (g, tekst, fam, size, spacing = 0) => {
  g.save();
  let w = 0;
  for (const ch of [...tekst]) {
    g.font = `${size}px "${rezZa(g, fam, ch)}"`;
    w += g.measureText(ch).width + spacing;
  }
  g.restore();
  return w - spacing;
};

// --- alat ---------------------------------------------------------------------
const platno = (w, h, bg = B.bg) => {
  const c = createCanvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  return { c, g };
};

// Dijagonalna traka sa GTA loading ekrana. Jedna, uvek pod istim uglom.
function traka(g, w, h, boja = `rgba(${B.rgb},0.075)`) {
  g.save();
  g.translate(w / 2, h / 2);
  g.rotate((-22 * Math.PI) / 180);
  g.fillStyle = boja;
  g.fillRect(-w * 0.1, -h, w * 0.42, h * 2);
  g.restore();
}

// Zrno: statičan šum, isti posao kao SVG feTurbulence na sajtu.
function zrno(g, w, h, jacina = 0.045) {
  const n = Math.round(w * h * 0.06);
  g.save();
  for (let i = 0; i < n; i++) {
    const v = Math.random();
    g.fillStyle = `rgba(${v > 0.5 ? '255,255,255' : '0,0,0'},${jacina})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  g.restore();
}

// GTA naslov: verzal, tvrda senka pomerena dole-desno u tamnijem tonu ISTE boje.
const gta = (g, tekst, x, y, size, o = {}) =>
  crtaj(g, tekst.toUpperCase(), x, y, {
    fam: F.gta,
    size,
    boja: o.boja ?? B.ink,
    senka: o.senka ?? B.senka,
    align: o.align ?? 'left',
    spacing: size * 0.004,
  });

// HUD natpis: uzan verzal sa razmakom (isti registar kao traka i kicker na sajtu).
const hud = (g, tekst, x, y, size, o = {}) =>
  crtaj(g, tekst.toUpperCase(), x, y, {
    fam: F.hud,
    size,
    boja: o.boja ?? B.muted,
    align: o.align ?? 'left',
    spacing: o.spacing ?? size * 0.22,
  });

// Telo teksta sa prelomom.
function telo(g, tekst, x, y, size, maxW, o = {}) {
  const { boja = B.muted, lh = 1.5, align = 'left' } = o;
  let linija = '';
  let cy = y;
  const red = (t) => crtaj(g, t, x, cy, { fam: F.telo, size, boja, align });
  for (const rec of tekst.split(' ')) {
    const probni = linija ? linija + ' ' + rec : rec;
    if (meri(g, probni, F.telo, size) > maxW && linija) {
      red(linija);
      cy += size * lh;
      linija = rec;
    } else linija = probni;
  }
  if (linija) red(linija);
  return cy + size * lh - y;
}

// Zvezdica traženosti — CRTA se, ne kuca. Ni jedan podskup naših fontova nema
// U+2605, a sistemski simbolski fontovi se razlikuju od mašine do mašine; ista
// logika kao kod spec linije u logotipu, koja je takođe crtana.
function zvezda(g, cx, cy, r, boja) {
  g.save();
  g.fillStyle = boja;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const ugao = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.382; // zlatni presek — klasična petokraka
    const x = cx + Math.cos(ugao) * rr;
    const y = cy + Math.sin(ugao) * rr;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
  g.restore();
}

// Niz od pet zvezdica, centriran — nivo traženosti iz GTA.
function zvezde(g, cx, cy, r, boja, n = 5) {
  const korak = r * 2.5;
  const pocetak = cx - (korak * (n - 1)) / 2;
  for (let i = 0; i < n; i++) zvezda(g, pocetak + i * korak, cy, r, boja);
}

function zaobljen(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Broj posta u uglu — GTA lokacijski natpis.
function broj(g, n, S) {
  gta(g, String(n).padStart(2, '0'), S * 0.075, S * 0.135, S * 0.055, { boja: B.core, senka: B.deep });
  g.save();
  g.strokeStyle = `rgba(${B.rgb},0.55)`;
  g.lineWidth = Math.max(1, S * 0.002);
  g.beginPath();
  g.moveTo(S * 0.135, S * 0.118);
  g.lineTo(S * 0.215, S * 0.118);
  g.stroke();
  g.restore();
}

function potpis(g, S, tekst = 'DRYKULT®') {
  hud(g, tekst, S / 2, S * 0.945, S * 0.021, { boja: 'rgba(244,246,248,0.4)', align: 'center', spacing: S * 0.008 });
}

// Beo crtež na crnoj podlozi → crtež sa pravom alfom.
//
// Logo PNG-ovi iz `logo/png` NEMAJU alfu (izmereno: 0 % providnih piksela) —
// beli su na punoj crnoj. Aditivno mešanje skoro rešava stvar, ali podloga
// logotipa nije čista crna (7,8,10), pa preko gradijenta ostane vidljiv
// pravougaonik. Zato se alfa izvodi iz LUMINANSE, isto kao u gen-drykult.mjs:
// belo → potpuno, crno → ništa, a boja se postavlja na željenu.
function kljucBele(im, boja = [244, 246, 248]) {
  const c = createCanvas(im.width, im.height);
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  const sl = g.getImageData(0, 0, im.width, im.height);
  const d = sl.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) / 255;
    d[i] = boja[0];
    d[i + 1] = boja[1];
    d[i + 2] = boja[2];
    // Podloga logotipa NIJE čista crna nego #07080A (luminansa ~0.031). Bez
    // odsecanja crne tačke ostane veo alfe ~8/255 i pravougaonik se i dalje
    // nazire preko gradijenta. CRNA je prag, ostatak se razvuče na pun opseg.
    const CRNA = 0.06;
    d[i + 3] = Math.round(Math.max(0, Math.min(1, (lum - CRNA) / (1 - CRNA))) * 255);
  }
  g.putImageData(sl, 0, 0);
  return c;
}

// Slika uklopljena u okvir, sa očuvanim odnosom strana.
function uklopi(g, im, cx, cy, maxW, maxH) {
  const k = Math.min(maxW / im.width, maxH / im.height);
  const w = im.width * k;
  const h = im.height * k;
  g.drawImage(im, cx - w / 2, cy - h / 2, w, h);
  return { w, h };
}

// ============================================================================
//  POSTOVI — pravac A: DOSIJE (GTA loading ekran)
// ============================================================================
const S = 1080;

function podloga(g, { band = true, bg = B.bg } = {}) {
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);
  const grad = g.createRadialGradient(S / 2, S * 0.5, 0, S / 2, S * 0.5, S * 0.75);
  grad.addColorStop(0, `rgba(${B.rgb},0.10)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  if (band) traka(g, S, S);
}

const POSTOVI = {
  // 01 — manifest, prva polovina
  manifest1(g, br) {
    podloga(g);
    if (br) broj(g, br, S);
    gta(g, 'Suvo je', S * 0.075, S * 0.47, S * 0.17);
    gta(g, 'pravilo.', S * 0.075, S * 0.63, S * 0.17, { boja: B.core, senka: B.deep });
    hud(g, 'premium microfiber · 1000 gsm', S * 0.075, S * 0.72, S * 0.024);
    potpis(g, S);
  },

  // 02 — gramaža
  gsm(g, br) {
    podloga(g);
    if (br) broj(g, br, S);
    gta(g, '1000', S / 2, S * 0.52, S * 0.3, { boja: B.core, senka: B.deep, align: 'center' });
    gta(g, 'GSM', S / 2, S * 0.63, S * 0.09, { align: 'center' });
    telo(g, 'Gramaža koja se meri na uzorku, ne prepisuje sa tuđe etikete.', S / 2, S * 0.73, S * 0.028, S * 0.7, {
      align: 'center',
    });
    potpis(g, S);
  },

  // 03 — manifest, druga polovina (zlato = ono što ne sme da se desi)
  manifest2(g, br) {
    podloga(g);
    if (br) broj(g, br, S);
    gta(g, 'Trag je', S * 0.075, S * 0.47, S * 0.17);
    gta(g, 'greška.', S * 0.075, S * 0.63, S * 0.17, { boja: B.gold, senka: B.goldDeep });
    hud(g, 'twisted-loop · dve strane', S * 0.075, S * 0.72, S * 0.024);
    potpis(g, S);
  },

  // 04 — sastav
  sastav(g, br) {
    podloga(g);
    if (br) broj(g, br, S);
    gta(g, '80/20', S / 2, S * 0.5, S * 0.22, { boja: B.core, senka: B.deep, align: 'center' });
    hud(g, 'poliester / poliamid', S / 2, S * 0.6, S * 0.032, { boja: B.ink, align: 'center' });
    telo(g, 'Poliamid je ono što vodu vuče u sebe. Ispod 20 % peškir samo razmazuje.', S / 2, S * 0.69, S * 0.028, S * 0.72, {
      align: 'center',
    });
    potpis(g, S);
  },

  // 05 — proizvod (centar zida)
  async proizvod(g, br) {
    podloga(g, { band: false });
    if (br) broj(g, br, S);
    const im = await loadImage(path.join(KOREN, 'public', 'drykult', 'mamba-hi.webp'));
    g.save();
    g.shadowColor = `rgba(${B.rgb},0.45)`;
    g.shadowBlur = S * 0.09;
    uklopi(g, im, S / 2, S * 0.5, S * 0.84, S * 0.6);
    g.restore();
    hud(g, '90 × 70 cm · 1000 gsm · 80/20', S / 2, S * 0.88, S * 0.026, { boja: B.core, align: 'center' });
    potpis(g, S);
  },

  // 06 — garancija
  garancija(g, br) {
    podloga(g);
    if (br) broj(g, br, S);
    gta(g, '2', S / 2, S * 0.5, S * 0.34, { boja: B.core, senka: B.deep, align: 'center' });
    gta(g, 'godine garancije', S / 2, S * 0.6, S * 0.072, { align: 'center' });
    telo(g, 'Desi li se peškiru bilo šta nepredviđeno u prve dve godine — dobijaš nov. Od nas, bez natezanja.', S / 2, S * 0.69, S * 0.028, S * 0.74, { align: 'center' });
    potpis(g, S);
  },

  // 07 — Most Wanted (jedini zlatni post)
  wanted(g, br) {
    podloga(g, { bg: B.crna });
    traka(g, S, S, `rgba(245,194,27,0.06)`);
    if (br) broj(g, br, S);
    zvezde(g, S / 2, S * 0.37, S * 0.042, B.gold);
    gta(g, 'Most', S / 2, S * 0.55, S * 0.13, { align: 'center' });
    gta(g, 'Wanted.', S / 2, S * 0.68, S * 0.13, { boja: B.gold, senka: B.goldDeep, align: 'center' });
    hud(g, 'patosnice · amblemi · gedžeti — u izradi', S / 2, S * 0.78, S * 0.023, { align: 'center' });
    potpis(g, S);
  },

  // 08 — sajt (zato Instagram i postoji)
  async sajt(g, br) {
    podloga(g, { band: false, bg: B.crna });
    if (br) broj(g, br, S);
    const im = await loadImage(path.join(KOREN, 'assets-src', 'drykult', 'sajt-hero.png'));
    const ram = { x: S * 0.06, y: S * 0.26, w: S * 0.88 };
    const h = (ram.w * im.height) / im.width;
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.8)';
    g.shadowBlur = S * 0.05;
    g.shadowOffsetY = S * 0.02;
    zaobljen(g, ram.x, ram.y, ram.w, h, S * 0.014);
    g.fillStyle = '#000';
    g.fill();
    g.restore();
    g.save();
    zaobljen(g, ram.x, ram.y, ram.w, h, S * 0.014);
    g.clip();
    g.drawImage(im, ram.x, ram.y, ram.w, h);
    g.restore();
    g.save();
    zaobljen(g, ram.x, ram.y, ram.w, h, S * 0.014);
    g.strokeStyle = `rgba(${B.rgb},0.35)`;
    g.lineWidth = S * 0.0025;
    g.stroke();
    g.restore();
    gta(g, 'Ceo sajt je', S / 2, S * 0.17, S * 0.085, { align: 'center' });
    gta(g, 'jedan potez.', S / 2, S * 0.245, S * 0.085, { boja: B.core, senka: B.deep, align: 'center' });
    hud(g, 'link u biografiji', S / 2, S * 0.9, S * 0.024, { boja: B.core, align: 'center' });
    potpis(g, S);
  },

  // 09 — izaberi stranu (PINK je zaključan, i to se vidi)
  strane(g, br) {
    podloga(g);
    if (br) broj(g, br, S);
    gta(g, 'Izaberi', S / 2, S * 0.3, S * 0.11, { align: 'center' });
    gta(g, 'stranu.', S / 2, S * 0.395, S * 0.11, { boja: B.core, senka: B.deep, align: 'center' });

    const kw = S * 0.36;
    const kh = S * 0.26;
    const y = S * 0.48;
    // MAMBA — dostupna
    g.save();
    zaobljen(g, S * 0.08, y, kw, kh, S * 0.02);
    g.fillStyle = `rgba(${B.rgb},0.10)`;
    g.fill();
    g.strokeStyle = B.core;
    g.lineWidth = S * 0.004;
    g.stroke();
    g.restore();
    gta(g, 'Mamba', S * 0.08 + kw / 2, y + kh * 0.55, S * 0.062, { boja: B.core, senka: B.deep, align: 'center' });
    hud(g, 'neon zelena', S * 0.08 + kw / 2, y + kh * 0.78, S * 0.021, { align: 'center' });

    // PINK — zaključana
    g.save();
    zaobljen(g, S * 0.56, y, kw, kh, S * 0.02);
    g.fillStyle = 'rgba(244,246,248,0.04)';
    g.fill();
    g.strokeStyle = 'rgba(244,246,248,0.14)';
    g.lineWidth = S * 0.003;
    g.stroke();
    g.restore();
    gta(g, 'Pink', S * 0.56 + kw / 2, y + kh * 0.55, S * 0.062, { boja: B.muted, senka: '#1a1d22', align: 'center' });
    hud(g, 'ženska verzija · uskoro', S * 0.56 + kw / 2, y + kh * 0.78, S * 0.019, { align: 'center' });
    // katanac
    g.save();
    g.fillStyle = B.pink;
    const lx = S * 0.56 + kw - S * 0.055;
    const ly = y + S * 0.035;
    g.fillRect(lx, ly + S * 0.012, S * 0.026, S * 0.02);
    g.strokeStyle = B.pink;
    g.lineWidth = S * 0.005;
    g.beginPath();
    g.arc(lx + S * 0.013, ly + S * 0.012, S * 0.008, Math.PI, 0);
    g.stroke();
    g.restore();

    telo(g, 'Kreće MAMBA. PINK se otključava kad bude spremna — bez datuma dok je nema.', S / 2, S * 0.85, S * 0.027, S * 0.78, { align: 'center' });
    potpis(g, S);
  },
};

// ============================================================================
//  PRAVAC B — CRNI ZID (tiho, Razer-premium: jedan element po pločici)
// ============================================================================
const TIHO = {
  a(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    gta(g, 'suvo je pravilo', S / 2, S * 0.52, S * 0.062, { align: 'center' });
  },
  b(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    gta(g, '1000', S / 2, S * 0.54, S * 0.16, { boja: B.core, senka: B.deep, align: 'center' });
  },
  c(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    hud(g, 'twisted-loop', S / 2, S * 0.51, S * 0.03, { boja: B.muted, align: 'center' });
  },
  async d(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    const im = await loadImage(path.join(KOREN, 'public', 'drykult', 'mamba-hi.webp'));
    uklopi(g, im, S / 2, S / 2, S * 0.66, S * 0.5);
  },
  e(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    gta(g, '80/20', S / 2, S * 0.54, S * 0.12, { align: 'center' });
  },
  f(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    gta(g, '2 godine', S / 2, S * 0.52, S * 0.075, { boja: B.core, senka: B.deep, align: 'center' });
  },
  g(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    zvezde(g, S / 2, S * 0.5, S * 0.026, B.gold);
  },
  h(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    gta(g, 'trag je greška', S / 2, S * 0.52, S * 0.062, { align: 'center' });
  },
  i(g) {
    g.fillStyle = B.crna;
    g.fillRect(0, 0, S, S);
    hud(g, '90 × 70 cm', S / 2, S * 0.51, S * 0.028, { boja: B.muted, align: 'center' });
  },
};

// ============================================================================
//  PRAVAC C — TRAKA (gornji red je JEDNA slika presečena na tri)
// ============================================================================
// Dva pravila koja ovu traku drže u životu, oba naučena na prvoj verziji:
//
// 1. RAZMACI SEKU SLOVA. Instagram između pločica ostavlja procep, a mreža seče
//    tačno na trećinama. Prva verzija je razvukla logotip preko cele širine i
//    procep je pao usred „1000" i usred „MICROFIBER". Zato nijedan tekst više ne
//    prelazi granicu: svaki natpis stoji ceo unutar svoje pločice, a utisak
//    jedne slike nose POZADINA (gradijent, dijagonala, zrno) i tanka neon linija
//    koja teče kroz sve tri na istoj visini.
//
// 2. SVAKA PLOČICA JE I SAMOSTALNA OBJAVA. U tuđem feedu se ne vidi zid nego
//    jedna slika — trećina logotipa tamo ne znači ništa. Zato je leva pločica
//    znak, srednja logotip, desna manifest: svaka stoji sama, a zajedno prave
//    baner.
let _trakaKes = null;
async function trakaRed(indeks) {
  if (!_trakaKes) {
    const W = S * 3;
    const { c, g } = platno(W, S, B.bg);
    const grad = g.createLinearGradient(0, 0, W, S);
    grad.addColorStop(0, `rgba(${B.rgb},0.16)`);
    grad.addColorStop(0.5, `rgba(${B.rgb},0.05)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, S);
    traka(g, W, S, `rgba(${B.rgb},0.06)`);

    // Neon linija kroz sve tri pločice — jedini element koji NAMERNO prelazi
    // granicu. Linija se preseca čisto, slova ne.
    g.save();
    g.strokeStyle = `rgba(${B.rgb},0.55)`;
    g.lineWidth = S * 0.005;
    g.beginPath();
    g.moveTo(0, S * 0.8);
    g.lineTo(W, S * 0.8);
    g.stroke();
    g.restore();

    const sredina = (i) => S * i + S / 2; // centar i-te pločice

    // LEVA — znak
    const znak = await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-mamba.png'));
    uklopi(g, znak, sredina(0), S * 0.42, S * 0.34, S * 0.44);
    hud(g, 'kap presečena pod 45°', sredina(0), S * 0.9, S * 0.026, { align: 'center' });

    // SREDNJA — logotip sa spec linijom, ceo unutar svoje pločice
    const logo = await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-horizontal-spec-white.png'));
    uklopi(g, kljucBele(logo), sredina(1), S * 0.42, S * 0.84, S * 0.42);
    hud(g, '90 × 70 cm · 80/20 · garancija 2 godine', sredina(1), S * 0.9, S * 0.026, { align: 'center' });

    // DESNA — manifest
    gta(g, 'Suvo je pravilo.', sredina(2), S * 0.4, S * 0.082, { align: 'center' });
    gta(g, 'Trag je greška.', sredina(2), S * 0.52, S * 0.082, { boja: B.core, senka: B.deep, align: 'center' });
    hud(g, 'drykult®', sredina(2), S * 0.9, S * 0.026, { align: 'center' });

    zrno(g, W, S);
    _trakaKes = c;
  }
  const isecak = createCanvas(S, S);
  isecak.getContext('2d').drawImage(_trakaKes, -indeks * S, 0);
  return isecak;
}

// ============================================================================
//  PROFILNA — četiri opcije
// ============================================================================
async function profilne() {
  const P = 1080;
  const mark = {
    mamba: await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-mamba.png')),
    crn: await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-black.png')),
    beo: await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-white.png')),
  };

  const opcije = {
    // A — znak u neonu na crnom: brend tačno kakav je na sajtu
    a(g) {
      g.fillStyle = B.bg;
      g.fillRect(0, 0, P, P);
      uklopi(g, mark.mamba, P / 2, P / 2, P * 0.42, P * 0.52);
    },
    // B — crn znak na neon krugu: najglasnija tačka u tuđem feedu
    b(g) {
      g.fillStyle = B.core;
      g.fillRect(0, 0, P, P);
      uklopi(g, mark.crn, P / 2, P / 2, P * 0.42, P * 0.52);
    },
    // C — znak + ime: čita se na profilu, gubi se u feedu
    c(g) {
      g.fillStyle = B.bg;
      g.fillRect(0, 0, P, P);
      uklopi(g, mark.beo, P / 2, P * 0.38, P * 0.3, P * 0.36);
      gta(g, 'Drykult', P / 2, P * 0.78, P * 0.13, { boja: B.core, senka: B.deep, align: 'center' });
    },
    // D — znak u HUD prstenu: GTA nišan. IZABRANO 28. 9.
    //
    // Podešeno za 32 px, ne za 1080: prva verzija je imala prsten debljine
    // 0.018 × P, što u feedu ispadne pola piksela i prsten prosto nestane —
    // ostane samo sitan znak na crnom. Sada je prsten 0.042 (≈1,4 px na 32),
    // znak je krupniji, a četiri proreza su šira da se na maloj veličini vidi
    // da je nišan, a ne pun krug.
    d(g) {
      g.fillStyle = B.bg;
      g.fillRect(0, 0, P, P);
      g.save();
      g.strokeStyle = B.core;
      g.lineWidth = P * 0.042;
      g.lineCap = 'butt';
      for (const [a0, a1] of [
        [-0.38, 0.38],
        [0.62, 1.38],
        [1.62, 2.38],
        [2.62, 3.38],
      ])
        g.beginPath(), g.arc(P / 2, P / 2, P * 0.385, a0 * Math.PI * 0.5, a1 * Math.PI * 0.5), g.stroke();
      g.restore();
      uklopi(g, mark.mamba, P / 2, P / 2, P * 0.42, P * 0.5);
    },
  };

  const out = {};
  for (const [k, fn] of Object.entries(opcije)) {
    const { c, g } = platno(P, P);
    await fn(g);
    out[k] = c;
  }
  return out;
}

// Provera koja jedina nešto znači: kako profilna izgleda u PRAVOJ veličini,
// u krugu, i na svetloj i na tamnoj podlozi — jer feed je i jedno i drugo.
async function listProfilnih(ops) {
  const W = 1700;
  const H = 1180;
  const { c, g } = platno(W, H, '#0b0d10');
  gta(g, 'Profilna — četiri opcije', 60, 90, 54);
  hud(g, 'prikazano onako kako Instagram zaista prikazuje: krug, 320 px profil, 110 px zaglavlje, 32 px u feedu', 60, 132, 20, {
    spacing: 2,
  });

  const imena = {
    a: ['A · znak u neonu', 'brend kakav je na sajtu'],
    b: ['B · crn znak na neonu', 'najglasnija tačka u feedu'],
    c: ['C · znak + ime', 'čita se na profilu'],
    d: ['D · znak u nišanu', 'GTA HUD'],
  };

  const kolW = W / 4;
  let i = 0;
  for (const [k, cv] of Object.entries(ops)) {
    const cx = kolW * i + kolW / 2;
    const krug = (slika, d, y, podloga) => {
      if (podloga) {
        g.save();
        g.fillStyle = podloga;
        g.beginPath();
        g.arc(cx, y, d / 2 + 14, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      g.save();
      g.beginPath();
      g.arc(cx, y, d / 2, 0, Math.PI * 2);
      g.clip();
      g.drawImage(slika, cx - d / 2, y - d / 2, d, d);
      g.restore();
    };
    krug(cv, 300, 340);
    gta(g, imena[k][0], cx, 560, 30, { align: 'center' });
    hud(g, imena[k][1], cx, 592, 16, { align: 'center', spacing: 1.5 });

    // stvarne veličine, na tamnom i na svetlom
    krug(cv, 110, 700, '#101317');
    hud(g, '110 px', cx, 790, 14, { align: 'center', spacing: 1 });
    krug(cv, 110, 900, '#ffffff');
    krug(cv, 32, 1010, '#ffffff');
    hud(g, 'svetla tema', cx, 1060, 14, { align: 'center', spacing: 1 });
    i++;
  }
  return c;
}

// ============================================================================
//  ZID — 3 × 3 pregled
// ============================================================================
function zid(plocice, { w = 520, naslov = '', opis = '' } = {}) {
  const gap = 6;
  const t = Math.floor((w - gap * 2) / 3);
  const gw = t * 3 + gap * 2;
  const gornje = naslov ? 118 : 0;
  const { c, g } = platno(gw, gw + gornje, '#0b0d10');
  if (naslov) {
    gta(g, naslov, 0, 44, 40);
    telo(g, opis, 0, 76, 17, gw, { lh: 1.35 });
  }
  plocice.forEach((p, i) => {
    const x = (i % 3) * (t + gap);
    const y = gornje + Math.floor(i / 3) * (t + gap);
    g.drawImage(p, x, y, t, t);
  });
  return c;
}

// ============================================================================
//  KORICE ZA ISTAKNUTE PRIČE
// ============================================================================
async function korice() {
  const K = 1080;
  const znak = await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-mamba.png'));
  // Znakovi se CRTAJU (strelica, romb, zvezda) ili su cifre — ništa što zavisi
  // od simbolskog fonta koji na drugoj mašini možda ne postoji.
  const stavke = [
    {
      ime: 'proizvod',
      crtac: (g) => uklopi(g, znak, K / 2, K * 0.42, K * 0.2, K * 0.26),
    },
    { ime: 'spec', tekst: '1000' },
    { ime: 'garancija', tekst: '2' },
    { ime: 'wanted', zlato: true, crtac: (g) => zvezde(g, K / 2, K * 0.42, K * 0.055, B.gold) },
    { ime: 'pitanja', tekst: '?' },
    {
      ime: 'sajt',
      crtac: (g) => {
        g.save();
        g.strokeStyle = B.core;
        g.lineWidth = K * 0.022;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.beginPath();
        g.moveTo(K * 0.38, K * 0.42);
        g.lineTo(K * 0.62, K * 0.42);
        g.moveTo(K * 0.52, K * 0.34);
        g.lineTo(K * 0.62, K * 0.42);
        g.lineTo(K * 0.52, K * 0.5);
        g.stroke();
        g.restore();
      },
    },
  ];
  return stavke.map(({ ime, tekst, zlato, crtac }) => {
    const { c, g } = platno(K, K, B.bg);
    traka(g, K, K);
    const boja = zlato ? B.gold : B.core;
    const senka = zlato ? B.goldDeep : B.deep;
    if (crtac) crtac(g);
    else gta(g, tekst, K / 2, K * 0.5, tekst.length > 2 ? K * 0.16 : K * 0.26, { boja, senka, align: 'center' });
    hud(g, ime, K / 2, K * 0.64, K * 0.045, { boja: B.ink, align: 'center' });
    return { ime, c };
  });
}

// ============================================================================
//  MOCKUP PROFILA — kako to izgleda kad se otvori
// ============================================================================
async function mockupProfila(avatar, plocice, biografija) {
  const W = 1080;
  const H = 1620;
  const { c, g } = platno(W, H, '#000000');

  // statusna linija + ručka
  hud(g, '09:41', 48, 62, 26, { boja: B.ink, spacing: 0 });
  gta(g, 'drykult', 48, 150, 46, { boja: B.ink, senka: '#000' });

  // avatar + brojevi
  g.save();
  g.beginPath();
  g.arc(160, 300, 96, 0, Math.PI * 2);
  g.clip();
  g.drawImage(avatar, 64, 204, 192, 192);
  g.restore();

  const broje = [
    ['9', 'objava'],
    ['—', 'pratilaca'],
    ['—', 'prati'],
  ];
  broje.forEach(([n, l], i) => {
    const x = 420 + i * 200;
    gta(g, n, x, 288, 40, { boja: B.ink, senka: '#000', align: 'center' });
    hud(g, l, x, 330, 19, { align: 'center', spacing: 1 });
  });

  // ime + biografija
  gta(g, 'DRYKULT — peškir za auto', 48, 450, 30, { boja: B.ink, senka: '#000' });
  let y = 500;
  for (const red of biografija) {
    crtaj(g, red, 48, y, { fam: F.telo, size: 26, boja: red.startsWith('·') ? B.muted : B.ink });
    y += 40;
  }
  crtaj(g, 'drykult.com', 48, y + 6, { fam: F.telo, size: 26, boja: B.core });

  // istaknute priče
  const kor = await korice();
  kor.slice(0, 5).forEach(({ ime, c: kc }, i) => {
    const cx = 120 + i * 190;
    const cy = y + 140;
    g.save();
    g.beginPath();
    g.arc(cx, cy, 72, 0, Math.PI * 2);
    g.clip();
    g.drawImage(kc, cx - 72, cy - 72, 144, 144);
    g.restore();
    g.save();
    g.strokeStyle = 'rgba(244,246,248,0.25)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, 74, 0, Math.PI * 2);
    g.stroke();
    g.restore();
    hud(g, ime, cx, cy + 108, 17, { align: 'center', spacing: 1 });
  });

  // zid
  const gy = y + 270;
  const gap = 4;
  const t = Math.floor((W - gap * 2) / 3);
  plocice.forEach((p, i) => {
    const x = (i % 3) * (t + gap);
    const py = gy + Math.floor(i / 3) * (t + gap);
    g.drawImage(p, x, py, t, t);
  });
  return c;
}

// ============================================================================
async function main() {
  await fontovi();
  await mkdir(IZLAZ, { recursive: true });
  for (const d of ['profilna', 'zid', 'istaknute', 'pregled']) await mkdir(path.join(IZLAZ, d), { recursive: true });

  const snimi = async (cv, rel, kvalitet = null) => {
    const p = path.join(IZLAZ, rel);
    const buf = kvalitet ? await cv.encode('jpeg', kvalitet) : await cv.encode('png');
    await writeFile(p, buf);
    console.log(' ', rel, (buf.length / 1024).toFixed(0) + ' KB');
  };

  // --- pravac A: DOSIJE ---
  // Broj u uglu NE pripada objavi nego njenom mestu u zidu — zato dolazi spolja.
  // Isti crtež se u pravcu A numeriše 01–09, a u izabranom pravcu C 01–06, jer
  // tamo prva tri mesta drži traka. Dok je broj bio upisan u sam crtež, zid je
  // pokazivao 02, 04, 06, 07 i izgledao kao greška.
  const nacrtaj = async (ime, br) => {
    const { c, g } = platno(S, S);
    await POSTOVI[ime](g, br);
    zrno(g, S, S);
    return c;
  };

  const redosled = ['manifest1', 'gsm', 'manifest2', 'sastav', 'proizvod', 'garancija', 'wanted', 'sajt', 'strane'];
  const dosije = [];
  for (let i = 0; i < redosled.length; i++) dosije.push(await nacrtaj(redosled[i], i + 1));

  // --- pravac B: CRNI ZID ---
  const tiho = [];
  for (const k of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']) {
    const { c, g } = platno(S, S, B.crna);
    await TIHO[k](g);
    tiho.push(c);
  }

  // --- pravac C: TRAKA — IZABRANO 28. 9., ovo je glavni zid ---
  //
  // Gornji red je traka, ispod idu kartice. Manifest ne ponavlja karticu jer je
  // već u traci; „izaberi stranu" pada na desetu objavu, u sledeću trojku.
  const traka3 = [await trakaRed(0), await trakaRed(1), await trakaRed(2)];
  const IMENA_TRAKE = ['znak', 'logo', 'manifest'];
  for (let i = 0; i < 3; i++) await snimi(traka3[i], `zid/traka-0${i + 1}-${IMENA_TRAKE[i]}.jpg`, 92);

  // Kartice glavnog zida — iznova nacrtane sa brojevima 01–06.
  const KARTICE = ['proizvod', 'gsm', 'sastav', 'garancija', 'wanted', 'sajt'];
  const kartice = [];
  for (let i = 0; i < KARTICE.length; i++) {
    const c = await nacrtaj(KARTICE[i], i + 1);
    kartice.push(c);
    await snimi(c, `zid/kartica-0${i + 1}-${KARTICE[i]}.jpg`, 92);
  }
  const trakaZid = [...traka3, ...kartice];

  // --- poređenje pravaca ---
  const A = zid(dosije, { naslov: 'A · DOSIJE', opis: 'Odbačeno 28. 9. Svaka objava je kartica iz igre. Kartice ostaju — od njih su donja dva reda glavnog zida.' });
  const Bz = zid(tiho, { naslov: 'B · CRNI ZID', opis: 'Odbačeno. Jedan element po pločici, skoro sve crno — tiše, ali sporije gradi prepoznavanje.' });
  const Cz = zid(trakaZid, { naslov: 'C · TRAKA ← IZABRANO', opis: 'Gornji red je baner kroz tri pločice: pozadina teče, slova ne prelaze razmake, a svaka pločica stoji i sama kao objava.' });

  const pw = A.width;
  const uporedi = platno(pw * 3 + 80, A.height + 40, '#0b0d10');
  [A, Bz, Cz].forEach((z, i) => uporedi.g.drawImage(z, 20 + i * (pw + 20), 20));
  await snimi(uporedi.c, 'pregled/pravci.jpg', 92);
  await snimi(zid(trakaZid, { w: 1100 }), 'pregled/zid-glavni.jpg', 92);

  // --- profilne ---
  const ops = await profilne();
  for (const [k, cv] of Object.entries(ops)) await snimi(cv, `profilna/profilna-${k}.png`);
  await snimi(await listProfilnih(ops), 'pregled/profilna.jpg', 92);

  // --- istaknute ---
  for (const { ime, c } of await korice()) await snimi(c, `istaknute/${ime}.png`);

  // --- mockup profila (izabrano 28. 9.: profilna D + zid C) ---
  const bio = [
    'SUVO JE PRAVILO. TRAG JE GREŠKA.',
    '· 1000 GSM · 80/20 · 90 × 70 cm',
    '· garancija 2 godine',
    '· RS · BA · ME — prva serija se pravi',
  ];
  await snimi(await mockupProfila(ops.d, trakaZid, bio), 'pregled/profil-mockup.jpg', 92);

  console.log('\ngotovo →', IZLAZ);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
