// REEL IZ SAJTA — uspravan snimak skrola, 9:16.
//
// Ovo je jedini materijal koji Instagram vezuje za sajt: ono što se vidi u
// objavi je BAŠ ono što posetilac dobije kad klikne link. Nema montaže, nema
// tuđih snimaka — samo naš sajt na telefonu.
//
// Zašto se ne snima ekran ručno: skrol mora da bude isti svaki put (da se snimak
// može ponoviti kad se sajt promeni), a rezolucija veća od telefona. Zato ide
// headless Chrome preko DevTools protokola: skrol se postavlja po kadru, slika
// se hvata, pa ffmpeg sklopi film.
//
// Traži POKRENUT dev server (`npm run dev`, port 3210) i `ffmpeg` u PATH-u.
// Pokretanje:  node scripts/gen-reel.mjs
// Izlaz:       instagram/reels/sajt-skrol.mp4

import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const KOREN = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(KOREN, 'package.json'));
const wsmod = require('next/dist/compiled/ws');
const WebSocket = wsmod.WebSocket || wsmod.default || wsmod;

const URL_SAJTA = 'http://localhost:3210/';
const PORT = 9444;
const KADROVA = 190; // ~6,3 s na 30 fps — Reels traži najmanje 3 s
const FPS = 30;
const SIRINA = 400; // CSS px; sa dpr 2.7 daje 1080 px širine
const VISINA = 711; // 400 × 16/9 → tačan 9:16 kadar
const DPR = 2.7;

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const IZLAZ = path.join(KOREN, 'instagram', 'reels');
const KADROVI = path.join(IZLAZ, '_kadrovi');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Skrol ne ide linearno: kreće mirno, ubrza kroz sredinu, staje na kraju.
// Linearan skrol izgleda kao da ga vuče mašina, a ovo kao da ga vuče ruka.
const lako = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function main() {
  await rm(KADROVI, { recursive: true, force: true });
  await mkdir(KADROVI, { recursive: true });

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${path.join(IZLAZ, '_profil')}`,
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      `--remote-debugging-port=${PORT}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let meta = [];
  for (let i = 0; i < 80; i++) {
    try {
      meta = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      if (meta.some((t) => t.type === 'page')) break;
    } catch {
      /* još se diže */
    }
    await sleep(300);
  }
  const strana = meta.find((t) => t.type === 'page');
  if (!strana) throw new Error('Chrome se nije podigao');

  const ws = new WebSocket(strana.webSocketDebuggerUrl);
  await new Promise((res, rej) => (ws.on('open', res), ws.on('error', rej)));
  let id = 0;
  const ceka = new Map();
  ws.on('message', (d) => {
    const m = JSON.parse(d.toString());
    const p = ceka.get(m.id);
    if (!p) return;
    ceka.delete(m.id);
    m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
  });
  const zovi = (method, params = {}) =>
    new Promise((res, rej) => (ceka.set(++id, { res, rej }), ws.send(JSON.stringify({ id, method, params }))));
  const js = async (expression) =>
    (await zovi('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;

  await zovi('Page.enable');
  await zovi('Runtime.enable');
  await zovi('Emulation.setDeviceMetricsOverride', {
    width: SIRINA,
    height: VISINA,
    deviceScaleFactor: DPR,
    mobile: true,
  });
  await zovi('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await zovi('Page.navigate', { url: URL_SAJTA });

  // Čeka se da hero stvarno osvane — loader ode i naslov se otkrije.
  const spreman = `(() => {
    const h = document.querySelector('h1');
    const ld = document.querySelector('[class*="Loader"]');
    return !!h && h.classList.contains('rvOn') && (!ld || /leaving/.test(ld.className));
  })()`;
  for (let i = 0; i < 160 && !(await js(spreman)); i++) await sleep(250);
  await sleep(2500); // da se 3D scena slegne i kapi krenu

  const visina = await js('document.documentElement.scrollHeight - innerHeight');
  // Ne ide se do dna: posle brojki u sekciji DOKAZ ide pasus teksta, a reel ne
  // sme da se završi usred pasusa. Staje se na tri brojke (0,63 m² / 630 g / 2).
  const domet = Math.min(visina, Math.round(visina * 0.55));
  console.log(`visina strane ${visina}px, snima se do ${domet}px`);

  for (let i = 0; i < KADROVA; i++) {
    // Prvih 12 % kadrova stoji na heroju — reel mora da počne mirno, da se
    // pročita naslov pre nego što krene pokret. Poslednjih 12 % stoji na
    // brojkama, da poslednji kadar (onaj koji ostane na ekranu kad se reel
    // vrti u krug) bude nešto što se čita, a ne zamrznuti pokret.
    const t = Math.min(1, Math.max(0, (i / (KADROVA - 1) - 0.12) / 0.76));
    const y = Math.round(lako(t) * domet);
    await js(
      `(() => { if (window.__lenis) window.__lenis.scrollTo(${y}, { immediate: true, force: true }); else scrollTo(0, ${y}); return scrollY; })()`
    );
    await sleep(40); // da rAF nacrta bar jedan kadar posle pomeraja
    const { data } = await zovi('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
    await writeFile(path.join(KADROVI, `k${String(i).padStart(4, '0')}.jpg`), Buffer.from(data, 'base64'));
    if (i % 40 === 0) console.log(`  kadar ${i}/${KADROVA} (skrol ${y}px)`);
  }

  await zovi('Browser.close').catch(() => {});
  ws.close();
  chrome.kill();

  const mp4 = path.join(IZLAZ, 'sajt-skrol.mp4');
  const ff = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-framerate', String(FPS),
      '-i', path.join(KADROVI, 'k%04d.jpg'),
      // Instagram voli tačno 1080×1920; scale+pad čuva odnos ako se kadar promeni.
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p',
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-crf', '20',
      '-movflags', '+faststart',
      mp4,
    ],
    { encoding: 'utf8' }
  );
  if (ff.status !== 0) {
    console.error(ff.stderr?.slice(-1500));
    throw new Error('ffmpeg nije uspeo');
  }
  await rm(KADROVI, { recursive: true, force: true });
  await rm(path.join(IZLAZ, '_profil'), { recursive: true, force: true });
  console.log('gotovo →', mp4);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
