// Izrezivanje DRYKULT peškira sa bele studijske pozadine.
//
// Peškir je CRN, pozadina je BELA — pa se ključuje po luminansi, a ne po boji.
// Neonski delovi (opšiv, natpis, pliš) su svetli ali ZASIĆENI, pa ih drugi
// uslov spasava od brisanja.
//
// Ključna stvar je DEKONTAMINACIJA RUBA. Pikseli na ivici su mešavina crne
// tkanine i bele pozadine. Ako im se samo spusti alfa, boja im ostane siva i
// na crnoj podlozi se vidi beo oreol oko celog peškira. Zato se za delimično
// providne piksele boja "odmešava" od bele:
//     original = (mešavina - bela * (1 - a)) / a
// To je obrnuta operacija od kompozitovanja preko bele, i jedina koja stvarno
// skida oreol umesto da ga sakrije.

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src', 'drykult');
const OUT = path.join(ROOT, 'public', 'drykult');

const FRAKCIJE = [
  { id: 'mamba', src: 'peskir 1.png' },
  { id: 'pink', src: 'peskir 2.png' },
];

const TARGETS = [
  { name: 'hi', w: 1000 },
  { name: 'md', w: 640 },
  { name: 'sm', w: 420 }, // mokapi i sitni prikazi
];

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// Prag: iznad L_OUT je sigurno pozadina, ispod L_IN sigurno peškir,
// između je meka ivica. Senka na beloj podlozi pada oko L 0.75-0.95,
// a telo peškira je ispod 0.15 — razmak je ogroman, pa je prag bezbedan.
const L_OUT = 0.78;
const L_IN = 0.5;

function cut(img, w) {
  const h = Math.round((img.height / img.width) * w);
  const c = createCanvas(w, h);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);

  const id = x.getImageData(0, 0, w, h);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;

    // Neon ostaje uvek — opšiv, natpis i pliš su svetli, ali zasićeni.
    // Bez ovog uslova bi ih prag luminanse obrisao zajedno sa pozadinom.
    if (sat > 0.22) continue;

    const L = lum(r, g, b);
    if (L >= L_OUT) {
      d[i + 3] = 0;
      continue;
    }
    if (L <= L_IN) continue; // puna tkanina

    // Meka ivica + dekontaminacija
    const a = (L_OUT - L) / (L_OUT - L_IN);
    d[i + 3] = Math.round(255 * a);
    if (a > 0.01) {
      d[i] = clamp255((r - 255 * (1 - a)) / a);
      d[i + 1] = clamp255((g - 255 * (1 - a)) / a);
      d[i + 2] = clamp255((b - 255 * (1 - a)) / a);
    }
  }

  x.putImageData(id, 0, 0);
  return { canvas: c, w, h };
}

// Kontrolna slika: izrezan peškir NA CRNOJ podlozi. Beo oreol se na beloj
// pozadini ne vidi, a na sajtu bi bio prvo što upada u oči.
function onBlack(cut) {
  const c = createCanvas(cut.w, cut.h);
  const x = c.getContext('2d');
  x.fillStyle = '#07080A';
  x.fillRect(0, 0, cut.w, cut.h);
  x.drawImage(cut.canvas, 0, 0);
  return c;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const report = [];

  for (const f of FRAKCIJE) {
    const img = await loadImage(path.join(SRC, f.src));
    for (const t of TARGETS) {
      const c = cut(img, t.w);
      const buf = await c.canvas.encode('png');
      await writeFile(path.join(OUT, `${f.id}-${t.name}.png`), buf);
      report.push({ file: `${f.id}-${t.name}.png`, kb: +(buf.length / 1024).toFixed(1), dim: `${c.w}x${c.h}` });

      if (t.name === 'md') {
        const chk = await onBlack(c).encode('jpeg', 90);
        await writeFile(path.join(OUT, `_provera-${f.id}.jpg`), chk);
      }
    }
  }

  console.log('\n  fajl                 velicina    dimenzije');
  console.log('  ' + '-'.repeat(46));
  for (const r of report) console.log(`  ${r.file.padEnd(20)}${String(r.kb).padStart(8)} KB   ${r.dim}`);
  console.log('\n  _provera-*.jpg su kontrolne slike na crnoj podlozi (nisu za sajt).\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
