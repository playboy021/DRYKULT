// Hero podloga za "izaberi stranu" — jedna generisana hauba, dve boje svetla.
//
// Zašto jedna, a ne dve generisane: u podeljenom heroju leva i desna polovina
// moraju da se čitaju kao ISTA hauba osvetljena različito. Dve odvojene
// generacije daju dve različite haube, pa mokra ivica između njih izgleda kao
// spoj dve fotke umesto kao granica na jednoj površini. Uz to, generisani
// pink je odlutao u magentu — a ovako je boja pod našom kontrolom do stepena.
//
// Sadržaj je scenografija: mokar lak i svetlo, bez peškira i bez logotipa.
// Pravi izrezani peškir se kompozituje preko, pa je proizvod stvaran.

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src', 'drykult', 'plate-src.png');
const OUT = path.join(ROOT, 'public', 'drykult');

// Ciljni hue po frakciji. MAMBA je 91 stepen, ne 74: izmereno sa peškira je
// 64-68 (žuto-zeleno), ali na sajtu to čita kao limun-žuta umesto kao zelena.
// 91 je kompromis — dovoljno zeleno da se prepozna, dovoljno blizu materijalu
// da veza sa proizvodom u ruci ne pukne.
// `lift` diže svetlinu. Bez njega pink ispada CRVEN: hue 353 sa svetlinom
// kakva je u izvoru daje krvavo crvenu, a koralna #FF6E80 je HSL(353,100%,71%)
// — dakle mnogo svetlija. Zelena to ne traži jer je #8CEF2E već na 56%.
const FRAKCIJE = [
  { id: 'mamba', hue: 91, sat: 1.0, lift: 0 },
  { id: 'pink', hue: 353, sat: 0.82, lift: 0.14 },
];

const TARGETS = [
  { name: 'hi', w: 1920 },
  { name: 'md', w: 1280 },
  { name: 'low', w: 760 },
];

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [((h * 60) + 360) % 360, s, l];
}

function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function recolor(img, w, hue, satMul, lift) {
  const h = Math.round((img.height / img.width) * w);
  const c = createCanvas(w, h);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);

  const id = x.getImageData(0, 0, w, h);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    const [H, S, L] = rgb2hsl(d[i], d[i + 1], d[i + 2]);

    // DVA praga, i oba su neophodna:
    //   zasićenje — pomera se samo ono što je stvarno obojeno
    //   svetlina  — u crnini "hue" je samo JPEG šum, a ne boja
    // Sa pragom samo po zasićenju (0.08) cela tamna površina je posle
    // dizanja svetline postala bordo: šum u senkama ima nisko ali nenulto
    // zasićenje, pa je bio tretiran kao neon.
    // Mera ostaje meka, jer neonsko svetlo curi po kapljicama u sve slabijim
    // tonovima — oštar prag bi tu ostavio vidljiv rub.
    const w8 = smoothstep(0.25, 0.55, S) * smoothstep(0.06, 0.18, L);
    if (w8 <= 0.001) continue;

    const L2 = L + (1 - L) * lift;
    const [nr, ng, nb] = hsl2rgb(hue, Math.min(1, S * satMul), L2);
    d[i] = d[i] + (nr - d[i]) * w8;
    d[i + 1] = d[i + 1] + (ng - d[i + 1]) * w8;
    d[i + 2] = d[i + 2] + (nb - d[i + 2]) * w8;
  }

  x.putImageData(id, 0, 0);
  return { canvas: c, w, h };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const img = await loadImage(SRC);

  // Kontrola: koji je hue neona u izvoru, da se vidi koliko ga pomeramo.
  const probe = createCanvas(400, Math.round((img.height / img.width) * 400));
  const px = probe.getContext('2d');
  px.drawImage(img, 0, 0, probe.width, probe.height);
  const pd = px.getImageData(0, 0, probe.width, probe.height).data;
  // Hue je ugao, pa se ne sme usrednjiti linearno — prosek 350 i 10 stepeni
  // linearno daje 180 (cijan), a tačan odgovor je 0 (crveno). Zato ide
  // vektorski prosek: saberu se jedinični vektori pa se uzme njihov ugao.
  let sx = 0, sy = 0, hn = 0;
  for (let i = 0; i < pd.length; i += 4) {
    const [H, S] = rgb2hsl(pd[i], pd[i + 1], pd[i + 2]);
    if (S > 0.45) { const a = (H * Math.PI) / 180; sx += Math.cos(a); sy += Math.sin(a); hn++; }
  }
  const srednji = hn ? Math.round((((Math.atan2(sy, sx) * 180) / Math.PI) + 360) % 360) : null;
  console.log(`  izvorni neon: ${srednji ?? '?'} stepeni  (${hn} px)`);

  const report = [];
  for (const f of FRAKCIJE) {
    for (const t of TARGETS) {
      const r = recolor(img, t.w, f.hue, f.sat, f.lift);
      const buf = await r.canvas.encode('jpeg', 86);
      const name = `plate-${f.id}-${t.name}.jpg`;
      await writeFile(path.join(OUT, name), buf);
      report.push({ name, kb: +(buf.length / 1024).toFixed(1), dim: `${r.w}x${r.h}` });
    }
  }

  console.log('\n  fajl                     velicina    dimenzije');
  console.log('  ' + '-'.repeat(48));
  for (const r of report) console.log(`  ${r.name.padEnd(24)}${String(r.kb).padStart(8)} KB   ${r.dim}`);
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
