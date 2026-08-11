// LOW tier film: mokra hauba → suva, jednim potezom. 720x1280, ~4s.
//
// Zašto NEMA animiranog peškira preko kadra: peškir već leži na haubi na
// izvornoj fotki, u obe verzije. Da preko toga prevučemo još jedan PNG,
// u kadru bi bila DVA peškira. Umesto toga se pomera samo granica brisanja —
// isti utisak ("neko je upravo prešao"), bez laži u kadru.
//
// Frejmovi idu kroz ffmpeg sa malim GOP-om (-g 6): mobilni browseri tako
// mnogo lakše barataju fajlom, a i veličina ostaje pristojna.

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'megaz');

const W = 720;
const H = 1280;
const FPS = 30;
const FRAMES = 120; // 4.0s

// Val kreće tek posle kratke pauze (da se vidi mokro stanje) i staje pre kraja
// (da se vidi suvo stanje). Bez te dve pauze film izgleda kao da je odsečen.
const START = 18;
const END = 92;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function main() {
  const wet = await loadImage(path.join(OUT, 'hero-poster-low.jpg'));
  const dry = await loadImage(path.join(OUT, 'hero-dry-low.jpg'));

  const tmp = path.join(os.tmpdir(), 'megaz-frames');
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const maskC = createCanvas(W, H);
  const maskX = maskC.getContext('2d');

  const dryC = createCanvas(W, H);
  const dryX = dryC.getContext('2d');

  // Dijagonala vala: kreće gore-levo, završava dole-desno. Blago koso je
  // življe od vertikalne linije, a ne skreće pažnju na sebe.
  const AX = -0.15 * W;
  const AY = 0.1 * H;
  const BX = 1.15 * W;
  const BY = 0.9 * H;

  for (let f = 0; f < FRAMES; f++) {
    const raw = (f - START) / (END - START);
    const t = easeInOutCubic(Math.max(0, Math.min(1, raw)));

    // 1) osnovno stanje — mokro
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(wet, 0, 0, W, H);

    if (t > 0) {
      // 2) maska: sve iza vala je puno, ispred prazno, sa mekim prelazom
      const soft = 0.13;
      const g = maskX.createLinearGradient(AX, AY, BX, BY);
      const a = Math.max(0, t - soft);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(a, 'rgba(0,0,0,1)');
      g.addColorStop(Math.max(a + 0.001, Math.min(1, t)), 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      maskX.clearRect(0, 0, W, H);
      maskX.fillStyle = g;
      maskX.fillRect(0, 0, W, H);

      // 3) suva slika obrezana maskom
      dryX.globalCompositeOperation = 'source-over';
      dryX.clearRect(0, 0, W, H);
      dryX.drawImage(dry, 0, 0, W, H);
      dryX.globalCompositeOperation = 'destination-in';
      dryX.drawImage(maskC, 0, 0);
      dryX.globalCompositeOperation = 'source-over';
      ctx.drawImage(dryC, 0, 0);

      // 4) tanak svetao rub na samom valu — voda koju peškir gura ispred sebe
      if (t < 1) {
        const eg = ctx.createLinearGradient(AX, AY, BX, BY);
        const lo = Math.max(0, t - 0.045);
        const hi = Math.min(1, t + 0.012);
        eg.addColorStop(0, 'rgba(143,216,255,0)');
        eg.addColorStop(lo, 'rgba(143,216,255,0)');
        eg.addColorStop(Math.min(hi, (lo + hi) / 2), 'rgba(186,232,255,0.22)');
        eg.addColorStop(hi, 'rgba(143,216,255,0)');
        eg.addColorStop(1, 'rgba(143,216,255,0)');
        ctx.fillStyle = eg;
        ctx.fillRect(0, 0, W, H);
      }
    }

    const buf = await canvas.encode('jpeg', 92);
    await writeFile(path.join(tmp, `f${String(f + 1).padStart(4, '0')}.jpg`), buf);
  }

  console.log(`iscrtano ${FRAMES} frejmova → ${tmp}`);

  const mp4 = path.join(OUT, 'hero-low.mp4');
  await run('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(tmp, 'f%04d.jpg'),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '28',
    // GOP 60, NE 6. Pravilo "-g 6" iz MAŠINE važi za scrub-video koji se
    // premotava skrolom — tamo mali GOP znači brzo traženje pozicije.
    // Ovaj film se pušta jednom i nikad se ne traži, pa bi sitan GOP samo
    // naduvao fajl (izmereno: 2539 KB na -g 6 protiv 419 KB na -g 60).
    '-g', '60',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', // metapodaci na početak, da krene bez punog skidanja
    '-an', // bez zvuka: ZAKON 4.5, autoplay sa zvukom browser ionako blokira
    mp4,
  ]);

  await rm(tmp, { recursive: true, force: true });

  const { statSync } = await import('node:fs');
  const kb = (statSync(mp4).size / 1024).toFixed(1);
  console.log(`\n  hero-low.mp4   ${kb} KB  (${(FRAMES / FPS).toFixed(1)}s, ${W}x${H}, ${FPS}fps)\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
