// MOST WANTED — crteži opreme.
//
// Šest proizvoda iz sekcije, nacrtani kao BELA LINIJA na providnoj podlozi.
// Namerno crtež, a ne fotografija ni AI render: nijedan od ovih proizvoda još
// ne postoji u našim rukama, pa bi svaka slika koja liči na fotku bila tvrdnja
// koju ne možemo da podupremo (ista zamka koju smo već platili na peškiru).
// Linijski crtež kaže „ovo je zamisao" bez ijedne reči objašnjenja.
//
// Isti fajlovi služe dvema stvarima:
//   1. sajtu — ikonice uz stavke u sekciji MOST WANTED
//   2. dobavljaču — predložak šta tačno tražimo, kao što je `logo/` otišao
//      fabrici za peškir
//
// Pokretanje:  node scripts/gen-oprema.mjs
// Izlaz:       public/oprema/

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const KOREN = path.resolve(import.meta.dirname, '..');
const OUT = path.join(KOREN, 'public', 'oprema');

const S = 600; // radna veličina; sve mere su u odnosu na nju
const BELA = '#F4F6F8';
const NEON = '#59F312';

// Jedna debljina linije za sve, da šest crteža izgleda kao jedan komplet.
// 0.038 × S je najtanje što na 28 px (veličina u spisku) još ostane vidljivo.
const LINIJA = S * 0.038;

function platno() {
  const c = createCanvas(S, S);
  const g = c.getContext('2d');
  g.strokeStyle = BELA;
  g.fillStyle = BELA;
  g.lineWidth = LINIJA;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  return { c, g };
}

// Naš znak (kap presečena pod 45°) kao ispuna — koristi se na patosnici i
// LED znaku, jer su to proizvodi koji NOSE naš crtež.
async function znak(g, cx, cy, h) {
  const im = await loadImage(path.join(KOREN, 'logo', 'png', 'drykult-mark-white.png'));
  const w = (im.width / im.height) * h;
  g.drawImage(im, cx - w / 2, cy - h / 2, w, h);
}

const CRTEZI = {
  // 1 — PATOSNICA: obris gazišta sa petnim ojačanjem i našim znakom
  async patosnica(g) {
    g.beginPath();
    g.moveTo(S * 0.24, S * 0.16);
    g.lineTo(S * 0.78, S * 0.16);
    g.lineTo(S * 0.84, S * 0.84);
    g.lineTo(S * 0.18, S * 0.84);
    g.closePath();
    g.stroke();
    // petno ojačanje
    g.beginPath();
    g.roundRect(S * 0.3, S * 0.62, S * 0.26, S * 0.16, S * 0.03);
    g.stroke();
    await znak(g, S * 0.52, S * 0.4, S * 0.26);
  },

  // 2 — VISEĆA RUČKA (tsurikawa): prsten na traci
  patosnicaPrtljaznik(g) {
    // šire i pliće od kabinske — prtljažnik je pravougaon
    g.beginPath();
    g.roundRect(S * 0.12, S * 0.3, S * 0.76, S * 0.4, S * 0.04);
    g.stroke();
    g.beginPath();
    for (let i = 1; i < 4; i++) {
      g.moveTo(S * 0.12 + (S * 0.76 * i) / 4, S * 0.3);
      g.lineTo(S * 0.12 + (S * 0.76 * i) / 4, S * 0.7);
    }
    g.stroke();
  },

  rucka(g) {
    // traka
    g.beginPath();
    g.moveTo(S * 0.42, S * 0.1);
    g.lineTo(S * 0.42, S * 0.42);
    g.moveTo(S * 0.58, S * 0.1);
    g.lineTo(S * 0.58, S * 0.42);
    g.stroke();
    // kopča
    g.beginPath();
    g.roundRect(S * 0.38, S * 0.24, S * 0.24, S * 0.1, S * 0.02);
    g.stroke();
    // prsten
    g.beginPath();
    g.arc(S * 0.5, S * 0.64, S * 0.22, 0, Math.PI * 2);
    g.stroke();
  },

  // 3 — LED ZNAK: naš znak u krugu, sa zracima
  async ledZnak(g) {
    g.beginPath();
    g.arc(S * 0.5, S * 0.5, S * 0.3, 0, Math.PI * 2);
    g.stroke();
    await znak(g, S * 0.5, S * 0.5, S * 0.3);
    // zraci — jedini element koji sme u neon, jer proizvod stvarno svetli
    g.save();
    g.strokeStyle = NEON;
    g.lineWidth = LINIJA * 0.7;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      g.beginPath();
      g.moveTo(S * 0.5 + Math.cos(a) * S * 0.37, S * 0.5 + Math.sin(a) * S * 0.37);
      g.lineTo(S * 0.5 + Math.cos(a) * S * 0.45, S * 0.5 + Math.sin(a) * S * 0.45);
      g.stroke();
    }
    g.restore();
  },

  // 4 — SVETLO ZA NOGE: letva sa snopom svetla nadole
  svetlo(g) {
    g.beginPath();
    g.roundRect(S * 0.16, S * 0.22, S * 0.68, S * 0.14, S * 0.06);
    g.stroke();
    g.save();
    g.strokeStyle = NEON;
    g.lineWidth = LINIJA * 0.7;
    for (let i = 0; i < 5; i++) {
      const x = S * 0.24 + i * S * 0.13;
      g.beginPath();
      g.moveTo(x, S * 0.42);
      g.lineTo(x - S * 0.05, S * 0.76);
      g.stroke();
    }
    g.restore();
  },

  // 5 — MARKER ZA GUME: telo, kosi vrh, potez
  marker(g) {
    g.save();
    g.translate(S * 0.5, S * 0.5);
    g.rotate((-32 * Math.PI) / 180);
    g.beginPath();
    g.roundRect(-S * 0.09, -S * 0.34, S * 0.18, S * 0.46, S * 0.04);
    g.stroke();
    // vrat
    g.beginPath();
    g.moveTo(-S * 0.05, S * 0.12);
    g.lineTo(-S * 0.03, S * 0.24);
    g.lineTo(S * 0.03, S * 0.24);
    g.lineTo(S * 0.05, S * 0.12);
    g.stroke();
    // vrh
    g.beginPath();
    g.moveTo(-S * 0.03, S * 0.24);
    g.lineTo(0, S * 0.33);
    g.lineTo(S * 0.03, S * 0.24);
    g.closePath();
    g.fill();
    g.restore();
    // potez koji ostavlja
    g.save();
    g.lineWidth = LINIJA * 0.8;
    g.beginPath();
    g.moveTo(S * 0.2, S * 0.82);
    g.quadraticCurveTo(S * 0.5, S * 0.72, S * 0.82, S * 0.8);
    g.stroke();
    g.restore();
  },

  // 6 — ZATAMNJENJE TABLICE: tablica sa roletnom koja je do pola spuštena.
  // Namerno POLA: proizvod se prodaje kao oprema za stazu i privatan posed,
  // pa crtež pokazuje mehanizam, ne sakrivenu tablicu.
  tablica(g) {
    g.beginPath();
    g.roundRect(S * 0.12, S * 0.32, S * 0.76, S * 0.36, S * 0.04);
    g.stroke();
    // zavesa preko gornje polovine
    g.save();
    g.fillStyle = 'rgba(244,246,248,0.22)';
    g.beginPath();
    g.roundRect(S * 0.12, S * 0.32, S * 0.76, S * 0.17, S * 0.04);
    g.fill();
    g.restore();
    g.beginPath();
    g.moveTo(S * 0.12, S * 0.49);
    g.lineTo(S * 0.88, S * 0.49);
    g.stroke();
    // slova koja se naziru u donjoj polovini
    g.save();
    g.lineWidth = LINIJA * 0.7;
    for (let i = 0; i < 4; i++) {
      const x = S * 0.24 + i * S * 0.15;
      g.beginPath();
      g.moveTo(x, S * 0.55);
      g.lineTo(x, S * 0.63);
      g.stroke();
    }
    g.restore();
  },
};

const SPISAK = [
  ['patosnica', 'Komplet za kabinu'],
  ['patosnicaPrtljaznik', 'Patosnica za prtljažnik'],
  ['rucka', 'Viseća ručka'],
  ['ledZnak', 'LED znak'],
  ['svetlo', 'Svetlo za noge'],
  ['marker', 'Marker za gume'],
  ['tablica', 'Zatamnjenje tablice'],
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const nacrtani = [];

  for (const [ime] of SPISAK) {
    const { c, g } = platno();
    await CRTEZI[ime](g);
    const buf = await c.encode('png');
    await writeFile(path.join(OUT, `${ime}.png`), buf);
    console.log(' ', `oprema/${ime}.png`, (buf.length / 1024).toFixed(1) + ' KB');
    nacrtani.push(c);
  }

  // Kontrolni list: svih sedam u nizu, i u maloj veličini u kojoj se stvarno
  // koriste na sajtu (28 px) — tu se vidi da li linija preživljava.
  const kol = 4;
  const red = Math.ceil(SPISAK.length / kol);
  const CEL = 260;
  const W = kol * CEL;
  const H = red * (CEL + 46) + 70;
  const p = createCanvas(W, H);
  const pg = p.getContext('2d');
  pg.fillStyle = '#0b0d10';
  pg.fillRect(0, 0, W, H);
  pg.fillStyle = '#8A9099';
  pg.font = '18px Arial';
  pg.fillText('MOST WANTED — crteži opreme (bela linija). Dole levo: stvarna veličina u spisku, 28 px.', 24, 34);

  SPISAK.forEach(([, naziv], i) => {
    const x = (i % kol) * CEL;
    const y = 60 + Math.floor(i / kol) * (CEL + 46);
    pg.drawImage(nacrtani[i], x + 20, y, CEL - 40, CEL - 40);
    pg.fillStyle = '#F4F6F8';
    pg.font = '15px Arial';
    pg.fillText(naziv, x + 20, y + CEL - 8);
    pg.drawImage(nacrtani[i], x + 20, y + CEL + 6, 28, 28);
  });

  const buf = await p.encode('png');
  await writeFile(path.join(OUT, '_provera.png'), buf);
  console.log('\n  oprema/_provera.png', (buf.length / 1024).toFixed(1) + ' KB');
  console.log('gotovo →', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
