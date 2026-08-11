// LOW tier film: PRAVI snimak brisanja, ne sintetika.
//
// Ranije je ovo bio nacrtan val (gradijent koji klizi preko para slika).
// Sad je pravi kadar: peškir prelazi preko šoferšajbne pune tragova vode i
// ostavlja je kao ogledalo. Nema razloga da se crta ono što je snimljeno.
//
// Izvor: assets-src/video/wipe.mov (IMG_0373, 1080x1920, 60fps, 14.8s).
// Sirovi .MOV nije u git-u — vidi .gitignore. Original drži van repo-a.
//
// Zašto baš ovaj isečak: transformacija se odigrava između 1.5s i 9.5s.
// Pre toga se peškir tek namešta, posle 9.5s je samo statično čisto staklo.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src', 'video', 'wipe.mov');
const OUT = path.join(ROOT, 'public', 'megaz');

const START = 1.5;
const DURATION = 8.0;
// Blago ubrzanje: 8s snimka staje u 5.7s. Više od ovoga i pokret ruke
// počne da izgleda isprekidano, jer je snimak iz ruke.
const SPEED = 1.4;

const W = 720;
const H = 1280; // izvor je 1080x1920, isti odnos — samo smanjenje, bez sečenja

async function main() {
  const mp4 = path.join(OUT, 'hero-low.mp4');

  await run('ffmpeg', [
    '-y',
    '-ss', String(START),
    '-t', String(DURATION),
    '-i', SRC,
    '-vf', `setpts=PTS/${SPEED},scale=${W}:${H}:flags=lanczos`,
    '-r', '30', // 60fps je bacanje za hero koji se jednom izvrti
    '-c:v', 'libx264',
    '-preset', 'slow',
    // crf 31, ne 28. Uporedjeni kadrovi na 720px su vizuelno nerazlucivi,
    // a fajl pada sa 1166 KB na 795 KB. Spustanje fps-a na 24 skoro ne pomaze
    // (865 KB) jer je snimak iz ruke — kod takvog materijala crf je poluga.
    '-crf', '31',
    // GOP 60, ne 6. Pravilo "-g 6" iz MAŠINE važi za scrub-video koji se
    // premotava skrolom; ovaj se pušta jednom i nikad se ne traži pozicija.
    '-g', '60',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an', // ZAKON 4.5 — autoplay sa zvukom browser ionako blokira
    mp4,
  ]);

  // Poster MORA biti prvi kadar BAŠ ovog filma. Da uzmemo neku drugu sliku,
  // video bi na startu vidno "preskočio" sa postera na svoj prvi frejm.
  await run('ffmpeg', [
    '-y',
    '-ss', String(START),
    '-i', SRC,
    '-frames:v', '1',
    '-vf', `scale=${W}:${H}:flags=lanczos`,
    '-q:v', '4',
    path.join(OUT, 'hero-poster-low.jpg'),
  ]);

  const kb = (f) => (statSync(path.join(OUT, f)).size / 1024).toFixed(1);
  const secs = (DURATION / SPEED).toFixed(1);
  console.log(`\n  hero-low.mp4          ${kb('hero-low.mp4')} KB   (${secs}s, ${W}x${H}, 30fps)`);
  console.log(`  hero-poster-low.jpg   ${kb('hero-poster-low.jpg')} KB\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
