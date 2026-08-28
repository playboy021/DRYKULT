// Zamena starog natpisa na studijskim fotkama peškira NAŠIM logotipom.
//
// Stari natpis je u nekom tuđem uskom fontu i nema veze sa logotipom koji smo
// nacrtali. Ovo ga skida i na isto mesto stavlja pravi — u istoj ravni, pod
// istim uglom, sa senkama tkanine koje prolaze kroz štampu.
//
// Ništa se ne pogađa: i mesto i ugao i veličina se MERE sa same slike.
//
// node scripts/gen-peskir-logo.mjs
//   → assets-src/drykult/peskir-1-logo.png, peskir-2-logo.png
//   posle toga ide node scripts/gen-drykult.mjs

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src', 'drykult');

// OBE boje se izvode iz JEDNE slike.
//
// Druga studijska fotka (`peskir 2.png`) se nije dala očistiti: stara štampa
// tamo prelazi preko preklopa, pa uklanjanje ili pojede preklop ili ostavi duh.
// Probano je i po slovima i brisanjem celog pojasa — nijedno nije prošlo.
//
// Zato ide isto što `gen-plate.mjs` radi za hero podlogu: jedna čista slika,
// pa se opšiv i plišano naličje prebojavaju u drugu frakciju. To je uz to i
// tačnije — to JESTE isti peškir, samo drugog opšiva.
const ULAZ = 'peskir 1.png';

// ODLUČENO 27. 8: na peškir ide PUN sklop — znak + logotip + spec linija — u
// core neonu, kao na sklopu koji je otišao fabrici. Varijanta samo sa
// logotipom u bright tonu je probana uporedo i odbačena.
// Boja štampe se NE zadaje — uzorkuje se sa pliša (vidi dole u petlji).
const POSAO = [
  { izlaz: 'peskir-1-logo.png', hue: null, svg: 'drykult-horizontal-spec-black.svg', udeo: 0.58 },
  { izlaz: 'peskir-2-logo.png', hue: 353, svg: 'drykult-horizontal-spec-black.svg', udeo: 0.58 },
];

// --- logotip iz našeg SVG-a ------------------------------------------------
// Ne dupliramo geometriju: čita se isti fajl koji ide u fabriku.
async function ucitajLogotip(ime) {
  const svg = await readFile(path.join(ROOT, 'logo', 'svg', ime), 'utf8');
  const d = svg.match(/ d="([^"]+)"/)[1];
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const putanje = d.split('M').filter(Boolean).map((deo) =>
    deo.replace(/Z\s*$/, '').split('L').map((par) => par.trim().split(/\s+/).map(Number))
  );
  return { putanje, w: Number(vb[1]), h: Number(vb[2]) };
}

// --- maska starog natpisa ---------------------------------------------------
// Natpis = svetao piksel OKRUŽEN TAMNIM. Bela pozadina je isto svetla, ali joj
// je i okolina svetla; zeleni opšiv stoji uz belu pozadinu. Samo je štampa na
// crnom veluru svetla usred tamnog.
function nadjiNatpis(D, W, H, pojas) {
  const L = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return 255;
    const p = (y * W + x) * 4;
    return 0.2126 * D[p] + 0.7152 * D[p + 1] + 0.0722 * D[p + 2];
  };
  const R = 90;
  const okolina = [[R, 0], [-R, 0], [0, R], [0, -R], [R, R], [-R, -R], [R, -R], [-R, R]];
  const maska = new Uint8Array(W * H);
  const tacke = [];
  // Prag je niži kad je pojas poznat: tada se hvataju i MEKE IVICE stare štampe,
  // koje su inače ostajale i providele se ispod novog logotipa.
  const prag = pojas ? 105 : 150;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Drugi prolaz gleda samo uzan pojas oko ose natpisa. Bez toga maska
      // pokupi i zeleni opšiv, pa ga brisanje razvuče u sivu mrlju.
      if (pojas && !pojas(x, y)) continue;
      const pp = (y * W + x) * 4;
      // MORA da bude na peškiru. Bela studijska pozadina je svetla, a na 90 px
      // od ivice peškira nekoliko uzoraka padne na tamno telo — pa prođe test
      // „okružen tamnim" i maska iscuri iznad i ispod peškira.
      // Pozadina je svetla I NEUTRALNA: sva tri kanala visoka. Štampa (#FCFCBA)
      // ima plavi na 186, pliš još niže.
      if (Math.min(D[pp], D[pp + 1], D[pp + 2]) > 215) continue;
      // TVRDA ZAŠTITA plišanog naličja i opšiva. Oni su bright kao i štampa, pa
      // ih blaži prag pokupi i popuna ih razvuče u vodoravne pruge preko
      // preklopa. Razlikuju se po kanalima: stara štampa je bleda i tu je
      // crveni ≈ zeleni (#FCFCBA), a pliš je zelen — zeleni nadmašuje crveni.
      if (D[pp + 1] > D[pp] + 15) continue;
      // Na preklopu stara štampa leži na zelenom plišu, pa nema tamnih suseda i
      // test ispod je slep. Ali se razlikuje BOJOM: štampa je bleda, skoro bela
      // (plavi kanal visok), a pliš je zasićeno zelen (plavi kanal nizak).
      if (pojas) {
        const p = (y * W + x) * 4;
        // Bledo ALI SA TONOM — i pritom NIJE pliš. Štampa (#FCFCBA) i pliš
        // (#E8F58C) su varljivo slični; razlikuju se po odnosu r i g kanala:
        // kod štampe je g ≈ r (žuto-neutralno), kod pliša g vodi za ~13.
        // Bez uslova `g − r < 8` je ovaj izraz POJEO PLIŠ u pojasu natpisa i
        // popunio ga crnim velurom — to su bile crne fleke po preklopu.
        // `raspon < 85` dodatno štiti: pliš ima raspon ~105, štampa ~66.
        const mx = Math.max(D[p], D[p + 1], D[p + 2]);
        const mn = Math.min(D[p], D[p + 1], D[p + 2]);
        if (mn > 120 && mx > 175 && mx - mn > 25 && mx - mn < 85 && D[p + 1] - D[p] < 8) {
          maska[y * W + x] = 1;
          if ((x & 3) === 0 && (y & 3) === 0) tacke.push([x, y]);
          continue;
        }
      }
      if (L(x, y) < prag) continue;
      let tamnih = 0;
      for (const [dx, dy] of okolina) if (L(x + dx, y + dy) < 85) tamnih++;
      // Uz preklop je stara štampa okružena zelenim naličjem, pa strog uslov
      // tamo pada i ostavi duh. Unutar pojasa je dovoljno dva tamna suseda —
      // kočnica na dužinu niza ionako sprečava da se to razlije.
      if (tamnih >= (pojas ? 2 : 5)) {
        maska[y * W + x] = 1;
        if ((x & 3) === 0 && (y & 3) === 0) tacke.push([x, y]);
      }
    }
  }
  return { maska, tacke };
}

const prosiri = (m, W, H, r) => {
  const o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!m[y * W + x]) continue;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < W) o[yy * W + xx] = 1;
        }
      }
    }
  }
  return o;
};

// separabilna erozija/dilatacija kvadratnim jezgrom — za razlikovanje TANKOG
// zelenog (opšiv, ivične linije) od DEBELE mase (pliš preklopa)
function eroduj(m, W, H, r) {
  const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 1;
    for (let d = -r; d <= r; d++) { const xx = x + d; if (xx < 0 || xx >= W || !m[y * W + xx]) { v = 0; break; } }
    t[y * W + x] = v;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 1;
    for (let d = -r; d <= r; d++) { const yy = y + d; if (yy < 0 || yy >= H || !t[yy * W + x]) { v = 0; break; } }
    o[y * W + x] = v;
  }
  return o;
}
function diliraj(m, W, H, r) {
  const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0;
    for (let d = -r; d <= r; d++) { const xx = x + d; if (xx >= 0 && xx < W && m[y * W + xx]) { v = 1; break; } }
    t[y * W + x] = v;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0;
    for (let d = -r; d <= r; d++) { const yy = y + d; if (yy >= 0 && yy < H && t[yy * W + x]) { v = 1; break; } }
    o[y * W + x] = v;
  }
  return o;
}


// --- brisanje: dvoklasni piramidalni inpaint --------------------------------
// Popuna po redovima ne radi (pruge, mešanje materijala). Jednoklasni push-pull
// ne radi ni u jednom smeru: zabrani li se pliš kao izvor, stara štampa NA
// PLIŠU se puni velurom (crni obrisi slova na zelenom); dozvoli li se sve,
// pliš procuri u velur (bledi obrisi na crnom). Zato TRI push-pull prolaza:
//   A — popuna samo iz velura;  B — popuna samo iz pliša/opšiva;
//   M — polje materijala (0 = velur, 1 = zeleno) preko svih važećih piksela.
// Svaka rupa uzima A ili B prema tome šta M kaže da je oko nje.
function pushPull(W, H, kanali, vazi) {
  const n = W * H;
  const K = kanali.length;
  const os = kanali.map((k) => {
    const f = new Float32Array(n);
    for (let i = 0; i < n; i++) f[i] = vazi[i] ? k[i] : 0;
    return f;
  });
  const v0 = new Float32Array(n);
  for (let i = 0; i < n; i++) v0[i] = vazi[i] ? 1 : 0;

  const nivoi = [{ w: W, h: H, k: os, vazi: v0 }];
  let cw = W, ch = H;
  while (cw > 4 && ch > 4) {
    const nw = cw >> 1, nh = ch >> 1;
    const gore = nivoi[nivoi.length - 1];
    const nk = Array.from({ length: K }, () => new Float32Array(nw * nh));
    const nv = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        let sv = 0;
        const s = new Array(K).fill(0);
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const j = (y * 2 + dy) * cw + (x * 2 + dx);
            sv += gore.vazi[j];
            for (let q = 0; q < K; q++) s[q] += gore.k[q][j];
          }
        }
        const i2 = y * nw + x;
        if (sv > 0) { nv[i2] = 1; for (let q = 0; q < K; q++) nk[q][i2] = s[q] / sv; }
      }
    }
    nivoi.push({ w: nw, h: nh, k: nk, vazi: nv });
    cw = nw; ch = nh;
  }

  for (let l = nivoi.length - 2; l >= 0; l--) {
    const dole = nivoi[l + 1], ovaj = nivoi[l];
    for (let y = 0; y < ovaj.h; y++) {
      for (let x = 0; x < ovaj.w; x++) {
        const i2 = y * ovaj.w + x;
        if (ovaj.vazi[i2]) continue;
        // bilinearno, ne najbliži — najbliži pravi kvadratne mrlje
        const fx = (x - 0.5) / 2, fy = (y - 0.5) / 2;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        let sw = 0;
        const s = new Array(K).fill(0);
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const xx = Math.min(dole.w - 1, Math.max(0, x0 + dx));
            const yy = Math.min(dole.h - 1, Math.max(0, y0 + dy));
            const j = yy * dole.w + xx;
            if (!dole.vazi[j]) continue;
            const w = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty);
            sw += w;
            for (let q = 0; q < K; q++) s[q] += dole.k[q][j] * w;
          }
        }
        if (sw <= 0) continue;
        ovaj.vazi[i2] = 1;
        for (let q = 0; q < K; q++) ovaj.k[q][i2] = s[q] / sw;
      }
    }
  }
  return os;
}

function inpaint(D, maska, W, H) {
  const n = W * H;
  const R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n);
  const vaziSve = new Uint8Array(n);
  const vaziVel = new Uint8Array(n);
  const vaziZel = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    R[i] = D[p]; G[i] = D[p + 1]; B[i] = D[p + 2];
    const pozadina = Math.min(D[p], D[p + 1], D[p + 2]) > 215;
    const z = D[p + 1] - D[p] >= 8 && D[p + 1] > D[p + 2] + 30;
    const ok = !maska[i] && !pozadina;
    vaziSve[i] = ok ? 1 : 0;
    vaziVel[i] = ok && !z ? 1 : 0;
    vaziZel[i] = ok && z ? 1 : 0;
  }

  const [Ar, Ag, Ab] = pushPull(W, H, [R, G, B], vaziVel);
  const [Br, Bg, Bb] = pushPull(W, H, [R, G, B], vaziZel);

  // KOJI materijal je istina za svaku rupu? Interpolirano polje je padalo na
  // pregibu: tanka svetla ivica pliša uz sam šav "prisvoji" i velur levo od
  // sebe, pa su se stara slova na crnom punila bledim plišom. Zato:
  //  1. zeleno se ERODUJE (9 px) — tanke linije nestanu, ostane prava masa
  //     pliša i opšiva;
  //  2. materijal rupe = ono do čega je CHAMFER rastojanje kraće.
  const EROZIJA = 9;
  const zelJak = new Uint8Array(n);
  // separabilni min-filter: prvo po x, pa po y
  const tmp = new Uint8Array(n);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 1;
      for (let d = -EROZIJA; d <= EROZIJA; d++) {
        const xx = x + d;
        if (xx < 0 || xx >= W || !vaziZel[y * W + xx]) { m = 0; break; }
      }
      tmp[y * W + x] = m;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 1;
      for (let d = -EROZIJA; d <= EROZIJA; d++) {
        const yy = y + d;
        if (yy < 0 || yy >= H || !tmp[yy * W + x]) { m = 0; break; }
      }
      zelJak[y * W + x] = m;
    }
  }

  const chamfer = (seme) => {
    const INF = 1e9;
    const dist = new Float32Array(n);
    for (let i = 0; i < n; i++) dist[i] = seme[i] ? 0 : INF;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let v = dist[i];
        if (x > 0) v = Math.min(v, dist[i - 1] + 1);
        if (y > 0) {
          v = Math.min(v, dist[i - W] + 1);
          if (x > 0) v = Math.min(v, dist[i - W - 1] + 1.414);
          if (x < W - 1) v = Math.min(v, dist[i - W + 1] + 1.414);
        }
        dist[i] = v;
      }
    }
    for (let y = H - 1; y >= 0; y--) {
      for (let x = W - 1; x >= 0; x--) {
        const i = y * W + x;
        let v = dist[i];
        if (x < W - 1) v = Math.min(v, dist[i + 1] + 1);
        if (y < H - 1) {
          v = Math.min(v, dist[i + W] + 1);
          if (x < W - 1) v = Math.min(v, dist[i + W + 1] + 1.414);
          if (x > 0) v = Math.min(v, dist[i + W - 1] + 1.414);
        }
        dist[i] = v;
      }
    }
    return dist;
  };
  const dVel = chamfer(vaziVel);
  const dZel = chamfer(zelJak);

  for (let i = 0; i < n; i++) {
    if (!maska[i]) continue;
    const p = i * 4;
    if (dZel[i] < dVel[i]) { D[p] = Br[i]; D[p + 1] = Bg[i]; D[p + 2] = Bb[i]; }
    else { D[p] = Ar[i]; D[p + 1] = Ag[i]; D[p + 2] = Ab[i]; }
  }
}

function obrisiStaro(D, maska, W, H) {
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (!maska[y * W + x]) { x++; continue; }
      let kraj = x;
      while (kraj < W && maska[y * W + kraj]) kraj++;
      const duz = kraj - x + 1;
      // Sigurnosna kočnica: predugačak niz nije slovo nego promašaj maske.
      // Bez ovoga je jedan lažni pogodak na opšivu razvukao pola reda.
      if (duz > 420) { x = kraj; continue; }
      const l = Math.max(0, x - 1), r = Math.min(W - 1, kraj);
      const pl = (y * W + l) * 4, pr = (y * W + r) * 4;
      // NIKAD ne interpoliraj preko granice materijala. Stara štampa ume da
      // leži delom na crnom veluru a delom na zelenom plišu; spajanje te dve
      // ivice daje sivu kašu razvučenu preko celog niza — to je bio artefakt
      // koji je ostajao uz preklop.
      //
      // Ako su ivice sličnog materijala → interpolacija (velur ima nabore).
      // Ako se razlikuju → svaki piksel uzima BLIŽU ivicu, pa granica ostaje oštra.
      const razlika =
        Math.abs(D[pl] - D[pr]) + Math.abs(D[pl + 1] - D[pr + 1]) + Math.abs(D[pl + 2] - D[pr + 2]);
      const istiMaterijal = razlika < 90;
      for (let i = x; i < kraj; i++) {
        const p = (i + y * W) * 4;
        if (istiMaterijal) {
          const t = (i - x + 1) / duz;
          for (let k = 0; k < 3; k++) D[p + k] = D[pl + k] + (D[pr + k] - D[pl + k]) * t;
        } else {
          const izvor = i - x < kraj - i ? pl : pr;
          for (let k = 0; k < 3; k++) D[p + k] = D[izvor + k];
        }
      }
      x = kraj;
    }
  }
}

// --- smer i raspon ----------------------------------------------------------
// Smer se NE uzima iz PCA jer PCA daje osu bez smera — uzima se vektor između
// težišta gornje i donje desetine maske. Tako nema dileme kojom stranom čita.
function osa(tacke) {
  const po = [...tacke].sort((a, b) => a[1] - b[1]);
  const n = Math.max(1, Math.floor(po.length * 0.1));
  const sred = (a) => a.reduce((s, p) => [s[0] + p[0] / a.length, s[1] + p[1] / a.length], [0, 0]);
  const gore = sred(po.slice(0, n));
  const dole = sred(po.slice(-n));
  // logotip čita ODOZDO NAGORE, pa smer ide od donjeg ka gornjem težištu
  const dx = gore[0] - dole[0], dy = gore[1] - dole[1];
  const ug = Math.atan2(dy, dx);
  const ux = Math.cos(ug), uy = Math.sin(ug);
  let sx = 0, sy = 0;
  for (const [x, y] of tacke) { sx += x; sy += y; }
  const cx = sx / tacke.length, cy = sy / tacke.length;
  const duz = tacke.map(([x, y]) => (x - cx) * ux + (y - cy) * uy).sort((a, b) => a - b);
  const p = (q) => duz[Math.floor((duz.length - 1) * q)];
  // percentili, ne min/max — nekoliko odbeglih tačaka bi razvuklo raspon
  return { cx, cy, ug, ux, uy, od: p(0.01), do: p(0.99) };
}

// Rotacija tona jedne boje uz očuvanje svetline i zasićenosti — ista
// transformacija kojom se preboji pliš, pa štampa i naličje OSTANU ISTA BOJA
// i na roze peškiru.
function rotirajHue([R2, G2, B2], hue) {
  const r = R2 / 255, g = G2 / 255, b = B2 / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const t = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return t.map((v) => Math.round((v + m) * 255));
}

// Prebojavanje opšiva i plišanog naličja u drugu frakciju. Menja se SAMO ton,
// a svetlina i zasićenost ostaju — tako nabori, senke i sjaj tkanine prežive.
function prebojZeleno(D, W, H, hue) {
  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    const r = D[p] / 255, g = D[p + 1] / 255, b = D[p + 2] / 255;
    // Ovde je test LABAVIJI nego kod maske. Maska mora da bude stroga da ne
    // pojede štampu; prebojavanje mora da uhvati i BLEDO plišano naličje
    // (#E8F58C), kod kog crveni kanal skoro stiže zeleni — pa se poredi sa
    // plavim, koji je kod svega žuto-zelenog nizak.
    // Prag je spušten sa +40 na +12: ISPRANI vrhovi pliša (g≈252, b≈240) su
    // promicali i na roze peškiru ostajali kao zelenkaste fleke. Velur ne
    // strada — njegovi odsjaji su neutralni (g ≈ b), pa i dalje preskaču.
    if (D[p + 1] <= D[p + 2] + 12) continue;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = l - c / 2;
    const t = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
      : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
    for (let k = 0; k < 3; k++) D[p + k] = Math.round((t[k] + m) * 255);
  }
}

for (const { izlaz, hue, svg, udeo } of POSAO) {
  const ulaz = ULAZ;
  const img = await loadImage(path.join(SRC, ulaz));
  const W = img.width, H = img.height;
  const c = createCanvas(W, H);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const slika = g.getImageData(0, 0, W, H);
  const D = slika.data;

  // BOJA ŠTAMPE = BOJA NALIČJA, po odluci. Ne pogađa se hex — uzorkuje se
  // osvetljeni pliš sa same fotke, pa logotip i naličje ne mogu da se raziđu.
  // Za roze se isti uzorak provuče kroz istu hue-rotaciju kao i pliš.
  let sr = 0, sg2 = 0, sb2 = 0, ns = 0;
  for (let i = 0; i < D.length; i += 4) {
    const r = D[i], gg = D[i + 1], b = D[i + 2];
    const lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    if (gg - r >= 8 && gg > b + 30 && lum > 170) { sr += r; sg2 += gg; sb2 += b; ns++; }
  }
  let bojaStampe = [Math.round(sr / ns), Math.round(sg2 / ns), Math.round(sb2 / ns)];
  const plisUzorak = [...bojaStampe];
  if (hue !== null) bojaStampe = rotirajHue(bojaStampe, hue);
  const boja = `rgb(${bojaStampe.join(',')})`;
  console.log(`  boja štampe (uzorak pliša${hue !== null ? ' → hue ' + hue : ''}): ${boja}`);

  // Prvi prolaz nađe GDE je natpis, drugi ga očisti do mekih ivica unutar
  // pojasa. Jedan prolaz nije dovoljan: strog prag ostavlja duhove stare
  // štampe, a blag prag pokupi opšiv.
  const gruba = nadjiNatpis(D, W, H, null);
  const o0 = osa(gruba.tacke);
  const POJAS = 340;
  const uPojasu = (x, y) => {
    const a = x - o0.cx, b = y - o0.cy;
    return Math.abs(-a * o0.uy + b * o0.ux) < POJAS;
  };
  // Maska pokriva SAMO slova, ne ceo pojas. Probano je i brisanje celog pojasa
  // (523–715 px širine) — popuna nema odakle da rekonstruiše toliku površinu,
  // pa je razlila zelenilo opšiva preko celog peškira. Uska maska + glatka
  // popuna je jedina kombinacija koja radi.
  const { maska, tacke } = nadjiNatpis(D, W, H, uPojasu);
  const o = osa(tacke);
  const duzina = o.do - o.od;
  console.log(`${ulaz}: ${tacke.length} tačaka, ugao ${(o.ug * 180 / Math.PI).toFixed(1)}°, duž ose ${duzina.toFixed(0)} px`);

  const puna = prosiri(maska, W, H, 20);
  // Širenje ne zna ni za šta — ono naduva masku u SVIM smerovima, pa i preko
  // pliša, opšiva i bele pozadine. Zato se posle njega ponovo primenjuju iste
  // zaštite. Ovo je bio uzrok kvadratnog ćoška i sivih mrlja uz preklop.
  // Posle širenja: skida se pozadina i SVE zeleno (g vodi nad r uz jasnu
  // prednost nad b — hvata i opšiv i pliš, a staru štampu g ≈ r ne).
  // Probano je i puštanje debelog pliša u masku uz morfološko otvaranje —
  // dalo je blokove na granicama popune; ova verzija je merljivo najčistija.
  for (let i = 0; i < W * H; i++) {
    if (!puna[i]) continue;
    const p = i * 4;
    const pozadina = Math.min(D[p], D[p + 1], D[p + 2]) > 215;
    const zeleno = D[p + 1] - D[p] >= 8 && D[p + 1] > D[p + 2] + 30;
    if (pozadina || zeleno) puna[i] = 0;
  }

  if (process.argv.includes('maska')) {
    const dm = createCanvas(W, H);
    const dg = dm.getContext('2d');
    dg.drawImage(img, 0, 0);
    const mi = dg.getImageData(0, 0, W, H);
    for (let i = 0; i < W * H; i++) {
      if (!puna[i]) continue;
      mi.data[i * 4] = 255; mi.data[i * 4 + 1] = 0; mi.data[i * 4 + 2] = 255;
    }
    dg.putImageData(mi, 0, 0);
    await writeFile(path.join(SRC, `_maska-${izlaz}`), await dm.encode('png'));
    console.log(`  maska → _maska-${izlaz}`);
  }

  inpaint(D, puna, W, H);

  // GRUNGE NA PLIŠU → SENČENI PLIŠ. Ostaci stare štampe na senci pregiba se ne
  // daju rekonstruisati (nema čistog izvora), ali se daju PREPOZNATI: to su
  // tamne površine POTPUNO ZATVORENE zelenim. Velur je jedna ogromna povezana
  // površina (~2,5 M piksela); sve ne-zeleno što je od njega odsečeno i malo —
  // to su fleke. Pretapaju se u pliš sa zadržanim senčenjem, ne u ravnu boju.
  {
    const n = W * H;
    const pripada = new Uint8Array(n);
    for (let i2 = 0; i2 < n; i2++) {
      const p2 = i2 * 4;
      const poz = Math.min(D[p2], D[p2 + 1], D[p2 + 2]) > 215;
      const z = D[p2 + 1] - D[p2] >= 8 && D[p2 + 1] > D[p2 + 2] + 30;
      pripada[i2] = !poz && !z ? 1 : 0;
    }
    const oznaka = new Int32Array(n).fill(-1);
    const velicina = [];
    const stek = new Int32Array(n);
    let sledeca = 0;
    for (let i2 = 0; i2 < n; i2++) {
      if (!pripada[i2] || oznaka[i2] >= 0) continue;
      const id = sledeca++;
      let vrh = 0, br = 0;
      stek[vrh++] = i2;
      oznaka[i2] = id;
      while (vrh) {
        const j = stek[--vrh];
        br++;
        const x = j % W;
        if (x > 0 && pripada[j - 1] && oznaka[j - 1] < 0) { oznaka[j - 1] = id; stek[vrh++] = j - 1; }
        if (x < W - 1 && pripada[j + 1] && oznaka[j + 1] < 0) { oznaka[j + 1] = id; stek[vrh++] = j + 1; }
        if (j >= W && pripada[j - W] && oznaka[j - W] < 0) { oznaka[j - W] = id; stek[vrh++] = j - W; }
        if (j < n - W && pripada[j + W] && oznaka[j + W] < 0) { oznaka[j + W] = id; stek[vrh++] = j + W; }
      }
      velicina[id] = br;
    }
    const lumP = 0.2126 * plisUzorak[0] + 0.7152 * plisUzorak[1] + 0.0722 * plisUzorak[2];
    for (let i2 = 0; i2 < n; i2++) {
      const id = oznaka[i2];
      // 120k: najveća viđena fleka je ~30k, telo velura je ~2,5M — razmak ogroman
      if (id < 0 || velicina[id] > 120000) continue;
      const p2 = i2 * 4;
      const lum = 0.2126 * D[p2] + 0.7152 * D[p2 + 1] + 0.0722 * D[p2 + 2];
      // kompresija senke: duboko crno postane srednja senka, svetlo skoro ne mrda
      const nl = 118 + (lum - 118) * 0.35;
      const k = Math.max(0.2, nl / lumP);
      for (let q = 0; q < 3; q++) {
        const cilj = Math.min(255, plisUzorak[q] * k);
        D[p2 + q] = Math.round(D[p2 + q] * 0.25 + cilj * 0.75);
      }
    }
  }

  // ČIŠĆENJE BLEDIH KONTURA na veluru: antialiasing ivice starih slova su
  // zelenkaste od podloge pa ih zelena zaštita izuzme iz maske, i ostanu kao
  // tanke svetle linije. Pravilo: bled piksel u pojasu, NIJE zeleno, okružen
  // pretežno tamnim → zameni prosekom tamnih suseda. Dva prolaza za linije
  // od 2–3 piksela.
  for (let prolaz = 0; prolaz < 3; prolaz++) {
    const kopija = D.slice();
    for (let y = 6; y < H - 6; y++) {
      for (let x = 6; x < W - 6; x++) {
        if (!uPojasu(x, y)) continue;
        const p = (y * W + x) * 4;
        const lum = 0.2126 * kopija[p] + 0.7152 * kopija[p + 1] + 0.0722 * kopija[p + 2];
        if (lum < 105) continue;
        // Zeleno se NE preskače: konture su baš zelenkaste (AA ivice na
        // podlozi). Opšiv ne strada — uz njega je svetla pozadina, pa udeo
        // tamnih suseda ne stiže do praga.
        let tam = 0, uk = 0, sr2 = 0, sg2 = 0, sb2 = 0;
        for (const [dx, dy] of [[-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, 4], [-4, 4], [4, -4]]) {
          const q = ((y + dy) * W + (x + dx)) * 4;
          const l2 = 0.2126 * kopija[q] + 0.7152 * kopija[q + 1] + 0.0722 * kopija[q + 2];
          uk++;
          if (l2 < 70) { tam++; sr2 += kopija[q]; sg2 += kopija[q + 1]; sb2 += kopija[q + 2]; }
        }
        if (tam / uk >= 0.6) {
          D[p] = sr2 / tam; D[p + 1] = sg2 / tam; D[p + 2] = sb2 / tam;
        }
      }
    }
  }
  // PRIGUŠENI OSTACI NA PLIŠU. Izmereno na fleci: pikseli tipa [180,190,108]
  // i [145,152,103] — zelenkasti, svetline 130–190, dok je zdrav pliš na ~245.
  // Prolaze test "zeleno" pa ih ni maska ni popuna ne diraju. Ovde se, samo
  // unutar pojasa natpisa, dižu ka svetlini pliša i utapaju u njegovu boju —
  // senčenje ostaje (kompresija, ne ravnanje), fleka nestaje.
  {
    const lumP = 0.2126 * plisUzorak[0] + 0.7152 * plisUzorak[1] + 0.0722 * plisUzorak[2];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!uPojasu(x, y)) continue;
        const p2 = (y * W + x) * 4;
        const r = D[p2], gg = D[p2 + 1], b = D[p2 + 2];
        // labaviji test nego drugde: fleka ima i piksele sa g-r od samo 4
        if (gg - r < 4 || gg <= b + 25) continue;
        const lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
        if (lum >= 205 || lum < 40) continue;
        const nl = 205 + (lum - 205) * 0.25;
        const k = nl / lum;
        for (let q = 0; q < 3; q++) {
          const cilj = Math.min(255, plisUzorak[q] * (nl / lumP));
          D[p2 + q] = Math.round(Math.min(255, D[p2 + q] * k) * 0.45 + cilj * 0.55);
        }
      }
    }
  }

  // Prebojavanje ide POSLE brisanja stare štampe — inače bi se i njeni ostaci
  // prebojili pa bi duh bio u novoj boji.
  if (hue !== null) prebojZeleno(D, W, H, hue);
  g.putImageData(slika, 0, 0);

  // --- naš logotip ---------------------------------------------------------
  const { putanje, w: lw, h: lh } = await ucitajLogotip(svg);

  // Veličina i položaj se vezuju za CRNO TELO peškira, ne za dužinu stare
  // štampe. Stara je merena pragom svetline pa je varirala od slike do slike i
  // znala da izbaci logotip u preklopljeni ćošak.
  let tmin = 1e9, tmax = -1e9, sx2 = 0, sy2 = 0, n3 = 0;
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const p = (y * W + x) * 4;
      const lum = 0.2126 * D[p] + 0.7152 * D[p + 1] + 0.0722 * D[p + 2];
      if (lum > 70) continue;
      sx2 += x; sy2 += y; n3++;
    }
  }
  const bx = sx2 / n3, by = sy2 / n3;
  for (let y = 0; y < H; y += 4) {
    for (let x = 0; x < W; x += 4) {
      const p = (y * W + x) * 4;
      const lum = 0.2126 * D[p] + 0.7152 * D[p + 1] + 0.0722 * D[p + 2];
      if (lum > 70) continue;
      const t = (x - bx) * o.ux + (y - by) * o.uy;
      if (t < tmin) tmin = t; if (t > tmax) tmax = t;
    }
  }
  const telo = tmax - tmin;
  console.log(`  telo peškira duž ose: ${telo.toFixed(0)} px`);

  const k = (telo * udeo) / lw;
  const cx2 = bx + o.ux * ((tmin + tmax) / 2);
  const cy2 = by + o.uy * ((tmin + tmax) / 2);

  const sloj = createCanvas(W, H);
  const sg = sloj.getContext('2d');
  sg.save();
  sg.translate(cx2, cy2);
  sg.rotate(o.ug);
  sg.scale(k, k);
  sg.translate(-lw / 2, -lh / 2);
  sg.fillStyle = boja;
  sg.beginPath();
  for (const put of putanje) {
    put.forEach(([x, y], i) => (i ? sg.lineTo(x, y) : sg.moveTo(x, y)));
    sg.closePath();
  }
  sg.fill('evenodd');
  sg.restore();

  // Štampa mora da PRIMI nabore tkanine ispod sebe — inače izgleda kao
  // nalepnica. Zato se osvetljenost podloge moduliše u boju logotipa.
  const sl = sg.getImageData(0, 0, W, H);
  const S = sl.data;
  let zbir = 0, br = 0;
  for (let i = 3; i < S.length; i += 4) {
    if (S[i] > 8) { const p = i - 3; zbir += 0.2126 * D[p] + 0.7152 * D[p + 1] + 0.0722 * D[p + 2]; br++; }
  }
  const sredLum = br ? zbir / br : 40;
  for (let i = 3; i < S.length; i += 4) {
    if (S[i] < 4) continue;
    const p = i - 3;
    const lum = 0.2126 * D[p] + 0.7152 * D[p + 1] + 0.0722 * D[p + 2];
    // Skoro isključeno (±6 %): na jačim vrednostima je štampa u visokoj
    // rezoluciji izgledala izgrebano i prljavo — a čitkost izbliza je bitnija
    // od iluzije da boja prati svaki nabor.
    const f = Math.max(0.94, Math.min(1.06, 1 + (lum - sredLum) / 300));
    for (let kk = 0; kk < 3; kk++) S[p + kk] = Math.max(0, Math.min(255, S[p + kk] * f));
  }
  sg.putImageData(sl, 0, 0);

  g.drawImage(sloj, 0, 0);
  await writeFile(path.join(SRC, izlaz), await c.encode('png'));
  console.log(`  → ${izlaz}`);
}
console.log('\ngotovo. Sledeće: node scripts/gen-drykult.mjs');
