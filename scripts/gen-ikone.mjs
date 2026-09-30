// IKONICE SAJTA — favicon, apple-touch, PWA.
//
// Bez ovoga browser u tabu crta globus, a sajt na telefonu, kad se doda na
// početni ekran, dobije snimak ekrana umesto znaka.
//
// Crta se ZNAK (kap presečena pod 45°), ne logotip: na 16 px slova su mrlja.
// Iz istog razloga ovde NE ide prsten-nišan sa Instagram profilne — prsten je
// tamo debeo 4,2 % širine, što na 16 px ispadne 0,7 px i nestane. Instagram
// prikazuje 32 px i naviše, tab prikazuje 16 px; to su dve različite veličine
// i traže dva različita crteža istog znaka.
//
// Pokretanje:  node scripts/gen-ikone.mjs
// Izlaz:       public/ (favicon.ico, icon-*.png, apple-touch-icon.png, site.webmanifest)

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const KOREN = path.resolve(import.meta.dirname, '..');
const OUT = path.join(KOREN, 'public');

const BG = '#070E03'; // MAMBA podloga — ista kao na sajtu
const NEON = '#59F312';

// Ikonica se ne crta jednom pa skalira: na 16 px se kap mora nacrtati DEBLJE
// nego na 512, inače je siva mrlja. Zato udeo kapi u kvadratu raste kako
// veličina pada.
function udeo(n) {
  if (n <= 16) return 0.94;
  if (n <= 32) return 0.88;
  if (n <= 64) return 0.82;
  return 0.74;
}

async function ikona(n, { zaobljeno = 0, providna = false } = {}) {
  const znak = await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-mamba.png'));
  const c = createCanvas(n, n);
  const g = c.getContext('2d');

  if (!providna) {
    g.fillStyle = BG;
    if (zaobljeno > 0) {
      const r = n * zaobljeno;
      g.beginPath();
      g.moveTo(r, 0);
      g.arcTo(n, 0, n, n, r);
      g.arcTo(n, n, 0, n, r);
      g.arcTo(0, n, 0, 0, r);
      g.arcTo(0, 0, n, 0, r);
      g.closePath();
      g.fill();
    } else {
      g.fillRect(0, 0, n, n);
    }
  }

  const k = udeo(n);
  const kw = (znak.width / znak.height) * n * k;
  const kh = n * k;
  g.drawImage(znak, (n - kw) / 2, (n - kh) / 2, kw, kh);
  return c;
}

// ICO je prost kontejner: zaglavlje + po jedan zapis za svaku veličinu + PNG
// podaci. Moderni browseri prihvataju PNG unutar ICO-a, pa se ništa ne
// prekodira. Pišem ga ručno jer canvas ne ume .ico.
function upakujIco(pngovi) {
  const n = pngovi.length;
  const zaglavlje = Buffer.alloc(6);
  zaglavlje.writeUInt16LE(0, 0); // rezervisano
  zaglavlje.writeUInt16LE(1, 2); // tip 1 = ikonica
  zaglavlje.writeUInt16LE(n, 4);

  const zapisi = Buffer.alloc(16 * n);
  let pomak = 6 + 16 * n;
  pngovi.forEach(({ velicina, buf }, i) => {
    const o = 16 * i;
    zapisi.writeUInt8(velicina >= 256 ? 0 : velicina, o + 0); // 0 znači 256
    zapisi.writeUInt8(velicina >= 256 ? 0 : velicina, o + 1);
    zapisi.writeUInt8(0, o + 2); // broj boja u paleti
    zapisi.writeUInt8(0, o + 3); // rezervisano
    zapisi.writeUInt16LE(1, o + 4); // ravni
    zapisi.writeUInt16LE(32, o + 6); // bita po pikselu
    zapisi.writeUInt32LE(buf.length, o + 8);
    zapisi.writeUInt32LE(pomak, o + 12);
    pomak += buf.length;
  });

  return Buffer.concat([zaglavlje, zapisi, ...pngovi.map((p) => p.buf)]);
}

async function main() {
  const snimi = async (ime, buf) => {
    await writeFile(path.join(OUT, ime), buf);
    console.log(' ', ime, (buf.length / 1024).toFixed(1) + ' KB');
  };

  // favicon.ico — 16/32/48, ono što browser traži sam od sebe
  const zaIco = [];
  for (const n of [16, 32, 48]) {
    const c = await ikona(n);
    zaIco.push({ velicina: n, buf: await c.encode('png') });
  }
  await snimi('favicon.ico', upakujIco(zaIco));

  // moderni <link rel="icon">
  for (const n of [32, 192, 512]) {
    const c = await ikona(n, { zaobljeno: n >= 192 ? 0.18 : 0 });
    await snimi(`icon-${n}.png`, await c.encode('png'));
  }

  // iOS: mora biti NEPROVIDNA i bez zaobljenja — sistem sam seče uglove,
  // a providnu ikonicu popuni crnom pa se izgubi podloga.
  await snimi('apple-touch-icon.png', await (await ikona(180)).encode('png'));

  // maskable za Android: znak mora da stane u krug upisan u kvadrat,
  // pa ide sa više vazduha oko sebe
  const m = createCanvas(512, 512);
  const mg = m.getContext('2d');
  mg.fillStyle = BG;
  mg.fillRect(0, 0, 512, 512);
  const znak = await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-mamba.png'));
  const mh = 512 * 0.52;
  const mw = (znak.width / znak.height) * mh;
  mg.drawImage(znak, (512 - mw) / 2, (512 - mh) / 2, mw, mh);
  await snimi('icon-maskable-512.png', await m.encode('png'));

  const manifest = {
    name: 'DRYKULT — premium microfiber peškir za auto',
    short_name: 'DRYKULT',
    description: '90 × 70 cm, 1000 GSM, 80 % poliester / 20 % poliamid. Garancija 2 godine.',
    start_url: '/',
    display: 'standalone',
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  await snimi('site.webmanifest', Buffer.from(JSON.stringify(manifest, null, 2)));

  // Kontrolni list: ikonica u PRAVIM veličinama, na svetloj i tamnoj traci
  // taba — jedina provera koja nešto znači.
  const W = 900;
  const H = 260;
  const p = createCanvas(W, H);
  const pg = p.getContext('2d');
  pg.fillStyle = '#0b0d10';
  pg.fillRect(0, 0, W, H);
  const trake = [
    { y: 40, bg: '#202124', ime: 'tamna traka taba' },
    { y: 150, bg: '#dee1e6', ime: 'svetla traka taba' },
  ];
  for (const t of trake) {
    pg.fillStyle = t.bg;
    pg.fillRect(40, t.y, W - 80, 70);
    let x = 70;
    for (const n of [16, 32, 48, 64]) {
      const c = await ikona(n);
      pg.drawImage(c, x, t.y + 35 - n / 2, n, n);
      x += n + 60;
    }
    pg.fillStyle = t.bg === '#202124' ? '#9aa0a6' : '#3c4043';
    pg.font = '16px Arial';
    pg.fillText(t.ime + '  —  16 / 32 / 48 / 64 px', 420, t.y + 42);
  }
  await snimi('_provera-ikonice.png', await p.encode('png'));

  console.log('\ngotovo →', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
