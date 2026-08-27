// HERO SCENA — peškir stoji na reflektujućem podu, neon sjaj iza, džinovski
// znak kao vodeni žig. Postavka kao na Flash Detail proizvodnoj fotki, ali u
// našem jeziku: crno lice sa logom ka kameri, neon samo tamo gde brend govori.
//
// Sve je proceduralno iz jedne studijske fotke — nema snimanja, nema tuđeg
// materijala. Kad stigne pravo snimanje, ista kompozicija se ponovi sa pravom
// fotkom umesto izrezka.
//
// node scripts/gen-scena.mjs
//   → assets-src/drykult/scena-mamba.png, scena-pink.png (2400 × 3000)

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src', 'drykult');

const W = 2400, H = 3000;
const POD = 2620; // linija poda — ispod nje živi samo refleksija

const SCENE = [
  { ulaz: 'peskir-1-logo.png', izlaz: 'scena-mamba.png', ime: 'MAMBA', rgb: [140, 239, 46] },
  { ulaz: 'peskir-2-logo.png', izlaz: 'scena-pink.png', ime: 'PINK', rgb: [255, 110, 128] },
];

// --- izrezivanje sa bele — isti recept kao gen-drykult.mjs -------------------
// (uslov zasićenosti čuva neon; luminansa seče belu i njenu senku;
//  dekontaminacija skida beli oreol sa mekih ivica)
const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lum01 = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const L_OUT = 0.78, L_IN = 0.5;

function izrezi(img) {
  const c = createCanvas(img.width, img.height);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, img.width, img.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b);
    const sat = mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx;
    if (sat > 0.22) continue;
    const L = lum01(r, g, b);
    if (L >= L_OUT) { d[i + 3] = 0; continue; }
    if (L <= L_IN) continue;
    const a = (L_OUT - L) / (L_OUT - L_IN);
    d[i + 3] = Math.round(255 * a);
    if (a > 0.01) {
      d[i] = clamp255((r - 255 * (1 - a)) / a);
      d[i + 1] = clamp255((g - 255 * (1 - a)) / a);
      d[i + 2] = clamp255((b - 255 * (1 - a)) / a);
    }
  }
  x.putImageData(id, 0, 0);
  return c;
}

// --- znak iz SVG-a -----------------------------------------------------------
async function znakPutanje() {
  const svg = await readFile(path.join(ROOT, 'logo', 'svg', 'drykult-mark-black.svg'), 'utf8');
  const d = svg.match(/ d="([^"]+)"/)[1];
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const putanje = d.split('M').filter(Boolean).map((deo) =>
    deo.replace(/Z\s*$/, '').split('L').map((par) => par.trim().split(/\s+/).map(Number))
  );
  return { putanje, w: Number(vb[1]), h: Number(vb[2]) };
}

const znak = await znakPutanje();

for (const { ulaz, izlaz, ime, rgb } of SCENE) {
  const img = await loadImage(path.join(SRC, ulaz));
  const isecak = izrezi(img);
  const [R, G, B] = rgb;
  const boja = (a) => `rgba(${R},${G},${B},${a})`;

  const c = createCanvas(W, H);
  const g = c.getContext('2d');

  // --- pozadina --------------------------------------------------------------
  g.fillStyle = '#050608';
  g.fillRect(0, 0, W, H);

  // sjaj iza peškira — razlog zašto crno lice uopšte čita na crnoj sceni
  let rad = g.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.78);
  rad.addColorStop(0, boja(0.34));
  rad.addColorStop(0.45, boja(0.10));
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, W, H);

  // --- džinovski znak kao vodeni žig (njihov grom → naša presečena kap) ------
  g.save();
  g.translate(W * 0.66, H * 0.36);
  g.rotate(0.16);
  const kz = 2100 / znak.h;
  g.scale(kz, kz);
  g.translate(-znak.w / 2, -znak.h / 2);
  g.strokeStyle = boja(0.16);
  g.lineWidth = 30 / kz;
  g.lineJoin = 'miter';
  for (const put of znak.putanje) {
    g.beginPath();
    put.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.stroke();
  }
  g.restore();

  // --- peškir u zasebnom sloju (treba nam i za refleksiju) -------------------
  const sloj = createCanvas(W, H);
  const sg = sloj.getContext('2d');
  const tw = 1680;
  const th = Math.round((isecak.height / isecak.width) * tw);
  const tx = (W - tw) / 2;
  const ty = POD - th; // dno tačno na liniji poda — zato "stoji", ne lebdi
  // neonski oreol prati SILUETU (shadowBlur po alfi), ne pravougaonik slike
  // Dva prolaza: širok mek oreol + uzan jarki rub. Alfa je namerno ispod 0.6 —
  // na 0.75 je oreol gutao ivicu tkanine i čitao kao nalepnica koja svetli.
  sg.shadowColor = boja(0.5);
  sg.shadowBlur = 150;
  sg.drawImage(isecak, tx, ty, tw, th);
  sg.shadowColor = boja(0.6);
  sg.shadowBlur = 40;
  sg.drawImage(isecak, tx, ty, tw, th);

  // kontaktna senka pre peškira, da telo sedne na pod
  const senka = g.createRadialGradient(W / 2, POD + 10, 0, W / 2, POD + 10, tw * 0.62);
  senka.addColorStop(0, 'rgba(0,0,0,0.72)');
  senka.addColorStop(1, 'rgba(0,0,0,0)');
  g.save();
  g.translate(0, POD + 10);
  g.scale(1, 0.06);
  g.translate(0, -(POD + 10));
  g.fillStyle = senka;
  g.fillRect(0, 0, W, H * 4);
  g.restore();

  g.drawImage(sloj, 0, 0);

  // --- refleksija u podu -----------------------------------------------------
  g.save();
  g.beginPath();
  g.rect(0, POD, W, H - POD);
  g.clip();
  g.translate(0, 2 * POD);
  g.scale(1, -1);
  g.globalAlpha = 0.44;
  g.drawImage(sloj, 0, 0);
  // "zamućenje" bez blur filtera: još dva pomerena otiska niske alfe
  g.globalAlpha = 0.14;
  g.drawImage(sloj, -7, 3);
  g.drawImage(sloj, 7, -3);
  g.restore();
  // refleksija tone u pod — fade kreće kasnije da se ogledalo stvarno VIDI
  const fade = g.createLinearGradient(0, POD, 0, H);
  fade.addColorStop(0, 'rgba(5,6,8,0.1)');
  fade.addColorStop(0.45, 'rgba(5,6,8,0.7)');
  fade.addColorStop(1, '#050608');
  g.fillStyle = fade;
  g.fillRect(0, POD, W, H - POD);

  // --- HUD ugao — pravi brojevi, ne dekoracija -------------------------------
  g.strokeStyle = 'rgba(244,246,248,0.28)';
  g.lineWidth = 3;
  for (const [x, y] of [[130, 130], [W - 130, 130], [130, H - 130], [W - 130, H - 130]]) {
    g.beginPath();
    g.moveTo(x - 26, y); g.lineTo(x + 26, y);
    g.moveTo(x, y - 26); g.lineTo(x, y + 26);
    g.stroke();
  }
  const razmaknuto = (t, x, y, vel, raz, fill) => {
    g.fillStyle = fill;
    g.font = `600 ${vel}px sans-serif`;
    let cx = x;
    for (const z of t) { g.fillText(z, cx, y); cx += g.measureText(z).width + raz; }
  };
  razmaknuto(ime, 190, 230, 44, 10, boja(0.95));
  razmaknuto('1000 G/M² · 90 × 70 CM · TWISTED LOOP', 190, 292, 26, 6, 'rgba(244,246,248,0.5)');

  // vinjeta drži oko u sredini
  const vin = g.createRadialGradient(W / 2, H * 0.46, W * 0.32, W / 2, H * 0.46, W * 0.95);
  vin.addColorStop(0, 'rgba(0,0,0,0)');
  vin.addColorStop(1, 'rgba(0,0,0,0.42)');
  g.fillStyle = vin;
  g.fillRect(0, 0, W, H);

  await writeFile(path.join(SRC, izlaz), await c.encode('png'));
  console.log(`${izlaz}  ${W}×${H}`);
}
console.log('gotovo');
