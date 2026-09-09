// NOVI PEŠKIR — zelen sa crnim logom, po mockup-u koji je stigao 9. 9.
//
// Nema više fotke: peškir se CRTA. Zelena površina, crn opšiv, naš pun sklop
// (znak + DRYKULT + spec linija) u crnom, centriran. Tekstura mikrofibera je
// zrno + meki nabori — dovoljno da se u 3D sceni čita kao tkanina, a ne kao
// nalepnica. Kad stigne prava fotka proizvoda, menja se samo ulaz.
//
// Roze varijanta se izvodi rotacijom tona (116° → 353°) i služi SAMO za
// zaključanu karticu „uskoro" — na sajt kao proizvod ne ide.
//
// node scripts/gen-peskir-zeleni.mjs
//   → public/drykult/{mamba,pink}-{hi,md,sm}.webp  +  _provera-*.jpg
//   → assets-src/drykult/peskir-zeleni.png (pun original, sa alfom)

import { createCanvas } from '@napi-rs/canvas';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'drykult');
const SRC = path.join(ROOT, 'assets-src', 'drykult');

// 4:3, kao mockup. Sve dalje (3D ravan, kartice) računa sa ovim odnosom.
const W = 2000, H = 1500;
// IZMERENO sa fabričkog mockupa (assets-src/drykult/peskir-zeleni-mockup.jpeg,
// prosek 252 k zasićenih piksela): #59F312, hue 101°, zasićenost 90 %.
// Prva verzija je imala upisano #4AF23F (hue 116) — pogođeno okom, ne izmereno,
// i ceo sajt je jedno vreme išao za tom pogrešnom bojom. Ovo je izvor istine
// dok ne stigne prava fotka; lib/faction.js i globals.css nose istu vrednost.
const ZELENA = [89, 243, 18]; // #59F312
const CRNA = [7, 8, 10];

const TARGETS = [
  { name: 'hi', w: 1000, q: 86 },
  { name: 'md', w: 640, q: 84 },
  { name: 'sm', w: 420, q: 82 },
];

const zaobljen = (g, x, y, w, h, r) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
};

async function lockup() {
  const svg = await readFile(path.join(ROOT, 'logo', 'svg', 'drykult-horizontal-spec-black.svg'), 'utf8');
  const d = svg.match(/ d="([^"]+)"/)[1];
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const putanje = d.split('M').filter(Boolean).map((deo) =>
    deo.replace(/Z\s*$/, '').split('L').map((par) => par.trim().split(/\s+/).map(Number))
  );
  return { putanje, w: Number(vb[1]), h: Number(vb[2]) };
}

function nacrtaj(boja) {
  const c = createCanvas(W, H);
  const g = c.getContext('2d');

  const M = 46;          // margina do ivice platna (blaga senka ide van)
  const OPSIV = 26;      // debljina crnog opšiva
  const R = 90;          // radijus ugla

  // meka senka ispod, da se u kartici ne "lepi" za pozadinu
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.55)';
  g.shadowBlur = 40;
  g.shadowOffsetY = 14;
  g.fillStyle = `rgb(${CRNA.join(',')})`;
  zaobljen(g, M, M, W - 2 * M, H - 2 * M, R);
  g.fill();
  g.restore();

  // zelena površina unutar opšiva
  g.fillStyle = `rgb(${boja.join(',')})`;
  zaobljen(g, M + OPSIV, M + OPSIV, W - 2 * (M + OPSIV), H - 2 * (M + OPSIV), R - OPSIV);
  g.fill();

  // --- tkanina: nabori + zrno, samo na zelenom ---------------------------------
  const id = g.getImageData(0, 0, W, H);
  const D = id.data;
  const zelenPix = (p) => D[p + 3] > 0 && D[p + 1] > D[p] + 40; // zeleno, ne opšiv
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      if (!zelenPix(p)) continue;
      const u = x / W, v = y / H;
      // tri spora talasa = nabori mikrofibera; vinjeta = oblina peškira
      const nabor =
        Math.sin(u * 7.3 + v * 2.1) * 0.035 +
        Math.sin(v * 9.7 - u * 3.4) * 0.028 +
        Math.sin((u + v) * 14.2) * 0.012;
      const dx = u - 0.5, dy = v - 0.5;
      const vinjeta = -Math.min(0.14, (dx * dx + dy * dy) * 0.42);
      const zrno = (Math.random() - 0.5) * 0.045;
      const f = 1 + nabor + vinjeta + zrno;
      for (let k = 0; k < 3; k++) D[p + k] = Math.max(0, Math.min(255, D[p + k] * f));
    }
  }
  g.putImageData(id, 0, 0);

  // blagi unutrašnji rub uz opšiv — šav
  g.save();
  zaobljen(g, M + OPSIV, M + OPSIV, W - 2 * (M + OPSIV), H - 2 * (M + OPSIV), R - OPSIV);
  g.clip();
  g.strokeStyle = 'rgba(0,0,0,0.28)';
  g.lineWidth = 10;
  zaobljen(g, M + OPSIV, M + OPSIV, W - 2 * (M + OPSIV), H - 2 * (M + OPSIV), R - OPSIV);
  g.stroke();
  g.restore();

  return c;
}

async function stampaj(c, lk) {
  const g = c.getContext('2d');
  const sirina = W * 0.60; // kao na mockup-u: logo je ~60 % širine peškira
  const k = sirina / lk.w;
  const x0 = (W - sirina) / 2;
  const y0 = (H - lk.h * k) / 2;
  g.save();
  g.translate(x0, y0);
  g.scale(k, k);
  g.fillStyle = 'rgb(7,8,10)';
  g.beginPath();
  for (const put of lk.putanje) {
    put.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  }
  g.fill('evenodd');
  g.restore();
  // štampa upije malo zrna tkanine — nije nalepnica
  const id = g.getImageData(0, 0, W, H);
  const D = id.data;
  for (let i = 0; i < D.length; i += 4) {
    if (D[i + 3] === 0) continue;
    if (D[i] < 40 && D[i + 1] < 40) {
      const z = (Math.random() - 0.5) * 14;
      for (let k = 0; k < 3; k++) D[i + k] = Math.max(0, Math.min(60, D[i + k] + 8 + z));
    }
  }
  g.putImageData(id, 0, 0);
}

function rotiraj([r, g, b], hue) {
  r /= 255; g /= 255; b /= 255;
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

async function izvezi(c, ime) {
  for (const t of TARGETS) {
    const h = Math.round((H / W) * t.w);
    const s = createCanvas(t.w, h);
    s.getContext('2d').drawImage(c, 0, 0, t.w, h);
    await writeFile(path.join(OUT, `${ime}-${t.name}.webp`), await s.encode('webp', t.q));
  }
  const p = createCanvas(1000, 750);
  const pg = p.getContext('2d');
  pg.fillStyle = '#07080A';
  pg.fillRect(0, 0, 1000, 750);
  pg.drawImage(c, 0, 0, 1000, 750);
  await writeFile(path.join(OUT, `_provera-${ime}.jpg`), await p.encode('jpeg', 88));
}

await mkdir(OUT, { recursive: true });
const lk = await lockup();

const mamba = nacrtaj(ZELENA);
await stampaj(mamba, lk);
await writeFile(path.join(SRC, 'peskir-zeleni.png'), await mamba.encode('png'));
await izvezi(mamba, 'mamba');

const pink = nacrtaj(rotiraj(ZELENA, 353));
await stampaj(pink, lk);
await izvezi(pink, 'pink');

console.log(`gotovo: ${W}×${H} → hi/md/sm za mamba i pink`);
