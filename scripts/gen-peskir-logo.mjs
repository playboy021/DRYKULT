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
const POSAO = [
  { izlaz: 'peskir-1-logo.png', boja: '#C3F98D', hue: null },  // MAMBA — kako jeste
  { izlaz: 'peskir-2-logo.png', boja: '#FFB3BE', hue: 353 },   // PINK — opšiv prebojen
];

// --- logotip iz našeg SVG-a ------------------------------------------------
// Ne dupliramo geometriju: čita se isti fajl koji ide u fabriku.
async function ucitajLogotip() {
  const svg = await readFile(path.join(ROOT, 'logo', 'svg', 'drykult-wordmark-white.svg'), 'utf8');
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
        // Bledo ALI SA TONOM. Uslov `raspon > 25` odbacuje belu studijsku
        // pozadinu, koja je isto bleda ali neutralna.
        // Pravilo mora da bude ovako uopšteno: prva verzija je tražila „plavi
        // niži od crvenog" i radila je samo za žuto-zelenu štampu, dok je roze
        // štampa (visok plavi kanal) prolazila neopaženo i ostajala kao duh.
        const mx = Math.max(D[p], D[p + 1], D[p + 2]);
        const mn = Math.min(D[p], D[p + 1], D[p + 2]);
        if (mn > 120 && mx > 175 && mx - mn > 25) {
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

// --- brisanje: piramidalni inpaint ------------------------------------------
// Popuna po redovima ne radi. Isprobana je i pokazala dve mane koje se ne daju
// zakrpiti: pravi vodoravne pruge, i kad su leva i desna ivica različiti
// materijali (velur ↔ pliš) razmaže granicu.
//
// Ovo umesto toga radi klasičan push-pull: slika se spušta niz piramidu tako
// što svaki nivo uprosečuje SAMO važeće piksele, pa se penje nazad i rupe puni
// iz grubljeg nivoa. Rezultat je gladak, bez pruga i bez ivica.
//
// Ključno: kao IZVOR važi samo velur. Pliš i pozadina su isključeni, pa zelena
// ne može da procuri u crno telo.
function inpaint(D, maska, W, H) {
  const n = W * H;
  const vazi = new Float32Array(n);
  const R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const pozadina = Math.min(D[p], D[p + 1], D[p + 2]) > 215;
    const zeleno = D[p + 1] > D[p] + 15;
    const ok = !maska[i] && !pozadina && !zeleno;
    vazi[i] = ok ? 1 : 0;
    R[i] = ok ? D[p] : 0;
    G[i] = ok ? D[p + 1] : 0;
    B[i] = ok ? D[p + 2] : 0;
  }

  // spuštanje
  const nivoi = [{ w: W, h: H, R, G, B, vazi }];
  let cw = W, ch = H;
  while (cw > 4 && ch > 4) {
    const nw = cw >> 1, nh = ch >> 1;
    const gore = nivoi[nivoi.length - 1];
    const r2 = new Float32Array(nw * nh), g2 = new Float32Array(nw * nh);
    const b2 = new Float32Array(nw * nh), v2 = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        let sr = 0, sg = 0, sb = 0, sv = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const j = (y * 2 + dy) * cw + (x * 2 + dx);
            sr += gore.R[j]; sg += gore.G[j]; sb += gore.B[j]; sv += gore.vazi[j];
          }
        }
        const i2 = y * nw + x;
        if (sv > 0) { r2[i2] = sr / sv; g2[i2] = sg / sv; b2[i2] = sb / sv; v2[i2] = 1; }
      }
    }
    nivoi.push({ w: nw, h: nh, R: r2, G: g2, B: b2, vazi: v2 });
    cw = nw; ch = nh;
  }

  // penjanje — rupe se pune iz grubljeg nivoa
  for (let l = nivoi.length - 2; l >= 0; l--) {
    const dole = nivoi[l + 1], ovaj = nivoi[l];
    for (let y = 0; y < ovaj.h; y++) {
      for (let x = 0; x < ovaj.w; x++) {
        const i2 = y * ovaj.w + x;
        if (ovaj.vazi[i2]) continue;
        // BILINEARNO, ne najbliži. Sa najbližim se grublji nivo vidi kao
        // kvadratne mrlje preko celog pojasa — to je bio blokasti artefakt.
        const fx = (x - 0.5) / 2, fy = (y - 0.5) / 2;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        let sr = 0, sg = 0, sb = 0, sw = 0;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const xx = Math.min(dole.w - 1, Math.max(0, x0 + dx));
            const yy = Math.min(dole.h - 1, Math.max(0, y0 + dy));
            const j = yy * dole.w + xx;
            if (!dole.vazi[j]) continue;
            const w = (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty);
            sr += dole.R[j] * w; sg += dole.G[j] * w; sb += dole.B[j] * w; sw += w;
          }
        }
        if (sw <= 0) continue;
        ovaj.R[i2] = sr / sw; ovaj.G[i2] = sg / sw; ovaj.B[i2] = sb / sw;
        ovaj.vazi[i2] = 1;
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (!maska[i]) continue;
    const p = i * 4;
    D[p] = R[i]; D[p + 1] = G[i]; D[p + 2] = B[i];
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
    if (D[p + 1] <= D[p + 2] + 40) continue;
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

for (const { izlaz, boja, hue } of POSAO) {
  const ulaz = ULAZ;
  const img = await loadImage(path.join(SRC, ulaz));
  const W = img.width, H = img.height;
  const c = createCanvas(W, H);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const slika = g.getImageData(0, 0, W, H);
  const D = slika.data;

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
  for (let i = 0; i < W * H; i++) {
    if (!puna[i]) continue;
    const p = i * 4;
    const pozadina = Math.min(D[p], D[p + 1], D[p + 2]) > 215;
    const zeleno = D[p + 1] > D[p] + 15;
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
  // Prebojavanje ide POSLE brisanja stare štampe — inače bi se i njeni ostaci
  // prebojili pa bi duh bio u novoj boji.
  if (hue !== null) prebojZeleno(D, W, H, hue);
  g.putImageData(slika, 0, 0);

  // --- naš logotip ---------------------------------------------------------
  const { putanje, w: lw, h: lh } = await ucitajLogotip();

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

  const k = (telo * 0.62) / lw;
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
    // Donja granica ne sme nisko. Na 0.62 je koralna štampa padala na #9E6E76 —
    // blatnjavo i bez kontrasta na crnom. Nabori i dalje prolaze kroz štampu,
    // samo je više ne gase.
    const f = Math.max(0.84, Math.min(1.18, 1 + (lum - sredLum) / 130));
    for (let kk = 0; kk < 3; kk++) S[p + kk] = Math.max(0, Math.min(255, S[p + kk] * f));
  }
  sg.putImageData(sl, 0, 0);

  g.drawImage(sloj, 0, 0);
  await writeFile(path.join(SRC, izlaz), await c.encode('png'));
  console.log(`  → ${izlaz}`);
}
console.log('\ngotovo. Sledeće: node scripts/gen-drykult.mjs');
