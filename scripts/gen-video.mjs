// Web-verzije telefonskih snimaka. PRAVI materijal, ne sintetika.
//
// Sirovi .MOV nisu u git-u (vidi .gitignore) — original drži van repo-a.
// Ako fajl nedostaje, taj klip se preskače uz upozorenje, da skripta i dalje
// može da regeneriše ostale.
//
// Zajednička podešavanja i zašto:
//   -g 60   Pravilo `-g 6` iz MAŠINE važi za scrub-video koji se premotava
//           skrolom. Ovi se puštaju sami i nikad se ne traži pozicija.
//           Izmereno na staroj sintetici: 2539 KB na -g 6 protiv 419 na -g 60.
//   crf 31  Uporedjeni kadrovi na 720px vizuelno nerazlučivi od crf 28,
//           a fajl pada za trećinu. Spuštanje fps-a skoro ne pomaže —
//           kod snimka iz ruke crf je poluga, ne frame rate.
//   -an     ZAKON 4.5 — autoplay sa zvukom browser blokira. Bez zvuka.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'assets-src', 'video');
const OUT = path.join(ROOT, 'public', 'hero');

const CLIPS = [
  {
    // Hero na telefonu. Peškir prelazi preko šoferšajbne pune tragova vode
    // i ostavlja je kao ogledalo. Transformacija je između 1.5s i 9.5s;
    // pre toga se peškir tek namešta, posle je statično čisto staklo.
    src: 'wipe.mov',
    out: 'hero-low.mp4',
    poster: 'hero-poster-low.jpg',
    start: 1.5,
    duration: 8.0,
    speed: 1.4,
    w: 720,
    h: 1280,
    crf: 31,
  },
  {
    // Drugi hook, u sekciji za poručivanje. Ruke aktivno brišu retrovizor,
    // pa ostane čisto staklo koje se ogleda. Manji kadar jer stoji u koloni,
    // ne preko celog ekrana.
    src: 'mirror.mov',
    out: 'order-hook.mp4',
    poster: 'order-hook-poster.jpg',
    start: 0.8,
    duration: 7.2,
    speed: 1.3,
    w: 540,
    h: 960,
    crf: 30,
  },
];

async function build(c) {
  const src = path.join(SRC_DIR, c.src);
  if (!existsSync(src)) {
    console.warn(`  preskacem ${c.out} — nema ${c.src} (sirovi snimci nisu u repo-u)`);
    return null;
  }

  await run('ffmpeg', [
    '-y',
    '-ss', String(c.start),
    '-t', String(c.duration),
    '-i', src,
    '-vf', `setpts=PTS/${c.speed},scale=${c.w}:${c.h}:flags=lanczos`,
    '-r', '30', // 60fps je bacanje za film koji se jednom izvrti
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', String(c.crf),
    '-g', '60',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', // metapodaci na pocetak, krece bez punog skidanja
    '-an',
    path.join(OUT, c.out),
  ]);

  // Poster MORA biti prvi kadar BAS tog filma. Da dolazi iz druge slike,
  // video bi na startu vidno preskocio sa postera na svoj prvi frejm.
  await run('ffmpeg', [
    '-y',
    '-ss', String(c.start),
    '-i', src,
    '-frames:v', '1',
    '-vf', `scale=${c.w}:${c.h}:flags=lanczos`,
    '-q:v', '4',
    path.join(OUT, c.poster),
  ]);

  const kb = (f) => +(statSync(path.join(OUT, f)).size / 1024).toFixed(1);
  return {
    out: c.out,
    mp4: kb(c.out),
    poster: kb(c.poster),
    secs: (c.duration / c.speed).toFixed(1),
    dim: `${c.w}x${c.h}`,
  };
}

async function main() {
  const rows = [];
  for (const c of CLIPS) {
    const r = await build(c);
    if (r) rows.push(r);
  }

  console.log('\n  fajl                 video     poster   trajanje  format');
  console.log('  ' + '-'.repeat(58));
  for (const r of rows) {
    console.log(
      `  ${r.out.padEnd(20)}${String(r.mp4).padStart(6)} KB ${String(r.poster).padStart(7)} KB` +
        `${(r.secs + 's').padStart(9)}  ${r.dim}`
    );
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
