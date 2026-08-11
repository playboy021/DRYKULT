// Iz JEDNE prave fotke (mat crni M5 + MEGAZ peškir) izvodi ceo hero par.
//
// Zašto izvedeno, a ne dve odvojene fotke: liquid reveal farba drugu sliku
// preko prve po tragu kursora. Ako se dve slike razlikuju i za jedan piksel
// geometrije, ivica četke odaje da su to dve fotke i iluzija pukne.
// Ovako su mokra i suva verzija PIKSEL U PIKSEL isti kadar — menja se samo
// stanje površine, što je tačno ono što peškir i radi.
//
// Iz istog razloga zrno i vinjeta se računaju iz ISTOG seed-a i primenjuju
// na oba sloja identično. Da zrno šeta između slojeva, reveal bi "šuštao".

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src', 'm5-towel.jpg');
const OUT = path.join(ROOT, 'public', 'megaz');

// Izvor je 941x1672 (9:16). Za pejzažni hero uzimamo pojas sa celim autom;
// object-fit:cover na sajtu doseca ostatak po potrebi.
const CROP_WIDE = { x: 0, y: 580, w: 941, h: 620 };

const TARGETS = [
  { name: 'hi', w: 1440, h: 949, q: 88 },
  { name: 'md', w: 1024, h: 675, q: 84 },
];

// Peškir na fotki — gruba kutija u koordinatama izvora, da ključevanje plave
// ne pokupi nebo (i ono je plavkasto, samo svetlije).
const TOWEL_BOX = { x: 385, y: 800, w: 350, h: 215 };

// Silueta auta u normalizovanim koordinatama IZLAZA — po jedna za svaki izrez,
// jer pejzažni pojas i pun portret smeštaju auto na različita mesta u kadru.
const CAR_WIDE = { cx: 0.48, cy: 0.52, rx: 0.44, ry: 0.48 };
const CAR_TALL = { cx: 0.478, cy: 0.54, rx: 0.44, ry: 0.185 };

// --- alat -------------------------------------------------------------------

// Deterministički PRNG. Isti seed = isto zrno = isti kapljice svaki put,
// pa ponovno pokretanje skripte ne menja sajt bez razloga.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

// Nacrta iseceni pojas izvora na platno ciljne veličine.
function drawCrop(img, crop, w, h) {
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  return { canvas: c, ctx };
}

// Zajednički "look" — radi se PRE grananja na mokro/suvo, da oba sloja
// dele istu bazu: isti kontrast, ista vinjeta, isto zrno.
function baseGrade(ctx, w, h, seed) {
  const rnd = mulberry32(seed);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  // Zrno unapred, u fiksni niz — da oba sloja dobiju BAŠ isti šum.
  const grain = new Int8Array(w * h);
  for (let i = 0; i < grain.length; i++) grain[i] = (rnd() - 0.5) * 14;

  const cx = w / 2;
  const cy = h * 0.52;
  const maxD = Math.hypot(cx, cy);

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // Kontrast oko srednje sive + blago dizanje crnog (da senke ne "zalepe")
    r = (r - 128) * 1.14 + 128 + 3;
    g = (g - 128) * 1.14 + 128 + 3;
    b = (b - 128) * 1.14 + 128 + 4;

    // Hladne senke: što je piksel tamniji, to više plavog dobija.
    // Time se fotka sa žućkastim svetlom hale privodi paleti brenda.
    const L = lum(r, g, b);
    const shadow = 1 - Math.min(1, L * 1.6);
    b += shadow * 16;
    r -= shadow * 7;
    g -= shadow * 2;

    // Vinjeta — pažnja na auto, ivice tonu u --bg
    const x = p % w;
    const y = (p / w) | 0;
    const dist = Math.hypot(x - cx, y - cy) / maxD;
    const vig = 1 - Math.pow(Math.max(0, dist - 0.42) / 0.58, 1.9) * 0.62;
    r *= vig;
    g *= vig;
    b *= vig;

    const n = grain[p];
    d[i] = clamp255(r + n);
    d[i + 1] = clamp255(g + n);
    d[i + 2] = clamp255(b + n);
  }

  ctx.putImageData(id, 0, 0);
  return id; // vraćamo da mokra grana može da čita luminansu baze
}

// SUVI sloj: ono što se otkriva pod kursorom. Čistije, sjajnije, hladnije.
function gradeDry(ctx, w, h) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // Sjaj: gornji tonovi se guraju naviše (lak "peče"), donji ostaju duboki.
    const L = lum(r, g, b);
    const gloss = Math.pow(Math.max(0, L - 0.5) / 0.5, 1.6) * 40;
    r += gloss;
    g += gloss + 2;
    b += gloss + 8;

    // Zasićenje malo naviše — suva čista boja je punija od mokre
    const avg = (r + g + b) / 3;
    r = avg + (r - avg) * 1.12;
    g = avg + (g - avg) * 1.12;
    b = avg + (b - avg) * 1.16;

    d[i] = clamp255(r);
    d[i + 1] = clamp255(g);
    d[i + 2] = clamp255(b);
  }
  ctx.putImageData(id, 0, 0);
}

// Film vode spljošti odsjaje — mokra površina je MEKŠA, ne oštrija.
// Ovo prodaje "mokro" jače nego ijedna pojedinačna kap: blagi blur preko
// oštre slike, pa se meša nazad na ~55%. Bez ovoga kapi izgledaju nalepljeno.
function softenWet(canvas, ctx, w, h) {
  const blur = createCanvas(w, h);
  const bctx = blur.getContext('2d');
  bctx.filter = `blur(${Math.max(0.8, w / 1400).toFixed(2)}px)`;
  bctx.drawImage(canvas, 0, 0);
  bctx.filter = 'none';

  // 0.35, ne 0.55: jače mešanje pravi tamni oreol tamo gde silueta auta
  // seče svetli beton, pa auto izgleda kao loše izrezan kolaž.
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.drawImage(blur, 0, 0);
  ctx.restore();
}

// MOKRI sloj: osnovni, uvek vidljiv. Tamnije, mutnije, isprano.
function gradeWet(ctx, w, h) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // Mokra tamna površina upija svetlo — sve ide dole i ka plavom.
    r *= 0.82;
    g *= 0.85;
    b *= 0.94;

    // Isprano zasićenje — film vode "razmaže" boju
    const avg = (r + g + b) / 3;
    r = avg + (r - avg) * 0.88;
    g = avg + (g - avg) * 0.88;
    b = avg + (b - avg) * 0.92;

    d[i] = clamp255(r);
    d[i + 1] = clamp255(g);
    d[i + 2] = clamp255(b);
  }
  ctx.putImageData(id, 0, 0);
}

// Kapljice smeju SAMO na karoseriju. Dva filtera zajedno, jer nijedan sam
// nije dovoljan: elipsa oko auta izbacuje zid i beton izvan siluete, a prag
// luminanse izbacuje svetle delove UNUTAR elipse (nebo kroz staklo, felne,
// sam peškir — on je upravo obrisao, ne kaplje s njega).
//
// mask = {cx, cy, rx, ry} u NORMALIZOVANIM koordinatama izlaza, jer se
// pejzažni i portretni izrez razlikuju.
function drawDroplets(ctx, w, h, baseData, seed, mask) {
  const rnd = mulberry32(seed);
  const d = baseData.data;

  const lumAt = (x, y) => {
    const p = ((y | 0) * w + (x | 0)) << 2;
    return lum(d[p], d[p + 1], d[p + 2]);
  };

  // Koliko je tačka duboko u silueti auta (1 = centar haube, 0 = van).
  const inCar = (x, y) => {
    const dx = (x / w - mask.cx) / mask.rx;
    const dy = (y / h - mask.cy) / mask.ry;
    return 1 - Math.min(1, Math.hypot(dx, dy));
  };

  const scale = w / 1440;

  // Perspektiva: bliži delovi kadra su niže, pa su tamo kapi krupnije.
  // Bez ovoga cela hauba je posuta zrnima iste veličine i izgleda kao tekstura.
  const persp = (y) => 0.55 + 0.85 * (y / h);

  const drop = (x, y, r, a) => {
    // Senka dole-desno daje zapreminu. Slaba — kap je mala, ne kugla.
    const sh = ctx.createRadialGradient(x + r * 0.25, y + r * 0.35, 0, x + r * 0.25, y + r * 0.35, r * 1.3);
    sh.addColorStop(0, `rgba(0,5,14,${0.3 * a})`);
    sh.addColorStop(1, 'rgba(0,5,14,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(x + r * 0.25, y + r * 0.35, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Telo: sredina providna, obod tanko svetli — voda lomi svetlo na rubu.
    // Obrub je namerno slab (0.26 umesto 0.5) — jači je čitao kao mehur sapunice.
    const body = ctx.createRadialGradient(x, y, 0, x, y, r);
    body.addColorStop(0, `rgba(143,216,255,${0.03 * a})`);
    body.addColorStop(0.66, `rgba(143,216,255,${0.07 * a})`);
    body.addColorStop(0.9, `rgba(186,232,255,${0.26 * a})`);
    body.addColorStop(1, 'rgba(143,216,255,0)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Odsjaj gore-levo — JEDAN izvor svetla za sve kapi. Da svaka blješti
    // na svoju stranu, oko bi odmah videlo da je crtano.
    const sp = ctx.createRadialGradient(x - r * 0.3, y - r * 0.34, 0, x - r * 0.3, y - r * 0.34, r * 0.4);
    sp.addColorStop(0, `rgba(255,255,255,${0.5 * a})`);
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.34, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  };

  // Sitne perle — glavnina mokrog utiska. Mnogo, sitno, prigušeno.
  let placed = 0;
  const wantSmall = 5200 * scale;
  for (let i = 0; i < 90000 && placed < wantSmall; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const inside = inCar(x, y);
    if (inside <= 0) continue;
    if (lumAt(x, y) > 0.24) continue; // svetlo unutar siluete = staklo/felna/peškir
    const r = (0.7 + rnd() * 2.1) * scale * persp(y);
    // Gašenje ka rubu elipse: bez ovoga kapi prestaju po oštrom luku
    // i maska se VIDI kao crtež, a ne kao granica karoserije.
    drop(x, y, r, (0.55 + inside * 0.45) * Math.min(1, inside * 4));
    placed++;
  }

  // Krupnije kapi — bez njih je to prašina, a ne voda. Malo ih je.
  let beads = 0;
  for (let i = 0; i < 30000 && beads < 190 * scale; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const inside = inCar(x, y);
    if (inside <= 0.15) continue;
    if (lumAt(x, y) > 0.2) continue;
    const r = (2.6 + rnd() * 3.4) * scale * persp(y);
    drop(x, y, r, (0.7 + inside * 0.3) * Math.min(1, (inside - 0.15) * 4));
    beads++;
  }

  // Nekoliko slivova nadole — voda se skuplja i curi niz vertikale.
  let runs = 0;
  for (let i = 0; i < 12000 && runs < 16 * scale; i++) {
    const x = rnd() * w;
    const y = rnd() * h * 0.75;
    if (inCar(x, y) <= 0.2) continue;
    if (lumAt(x, y) > 0.18) continue;
    const len = (14 + rnd() * 40) * scale;
    const ex = x + (rnd() - 0.5) * 3 * scale;
    const gr = ctx.createLinearGradient(x, y, ex, y + len);
    gr.addColorStop(0, 'rgba(186,232,255,0.16)');
    gr.addColorStop(1, 'rgba(186,232,255,0)');
    ctx.strokeStyle = gr;
    ctx.lineWidth = (0.8 + rnd() * 1.1) * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, y + len);
    ctx.stroke();
    drop(ex, y + len, (1.8 + rnd() * 2) * scale * persp(y + len), 0.9);
    runs++;
  }
}

// --- peškir kao PNG isečak --------------------------------------------------
// Plavi peškir na mat crnom autu je najlakši mogući ključ: kanal B jasno
// nadvisuje R. Ograničeno na kutiju da ne pokupi nebo.
async function cutTowel(img) {
  const { x, y, w, h } = TOWEL_BOX;
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const isTowel = b - r > 22 && b > 65;
    if (!isTowel) {
      d[i + 3] = 0;
    } else {
      // Meka ivica: što je razlika manja, to je piksel bliži rubu tkanine
      const edge = Math.min(1, (b - r - 22) / 26);
      d[i + 3] = Math.round(255 * (0.35 + 0.65 * edge));
    }
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

// --- glavni tok -------------------------------------------------------------

async function main() {
  await mkdir(OUT, { recursive: true });
  const img = await loadImage(SRC);
  console.log(`izvor: ${img.width}x${img.height}`);

  const report = [];
  const save = async (file, buf) => {
    await writeFile(path.join(OUT, file), buf);
    report.push({ file, kb: +(buf.length / 1024).toFixed(1) });
  };

  for (const t of TARGETS) {
    // Jedna zajednička baza, pa se GRANA — tako mokro i suvo dele
    // identičnu geometriju, zrno i vinjetu.
    const mkBase = () => {
      const { canvas, ctx } = drawCrop(img, CROP_WIDE, t.w, t.h);
      const baseData = baseGrade(ctx, t.w, t.h, 20260811);
      return { canvas, ctx, baseData };
    };

    const dry = mkBase();
    gradeDry(dry.ctx, t.w, t.h);
    await save(`hero-dry-${t.name}.jpg`, await dry.canvas.encode('jpeg', t.q));

    const wet = mkBase();
    gradeWet(wet.ctx, t.w, t.h);
    softenWet(wet.canvas, wet.ctx, t.w, t.h); // film vode pre kapi, ne posle
    drawDroplets(wet.ctx, t.w, t.h, wet.baseData, 77123, CAR_WIDE);
    await save(`hero-wet-${t.name}.jpg`, await wet.canvas.encode('jpeg', t.q));
  }

  // LOW tier: portret 9:16 — izvor je već tačno taj odnos, pa samo smanjujemo.
  const lowW = 720;
  const lowH = 1280;
  const low = drawCrop(img, { x: 0, y: 0, w: img.width, h: img.height }, lowW, lowH);
  const lowBase = baseGrade(low.ctx, lowW, lowH, 20260811);
  gradeWet(low.ctx, lowW, lowH);
  softenWet(low.canvas, low.ctx, lowW, lowH);
  drawDroplets(low.ctx, lowW, lowH, lowBase, 77123, CAR_TALL);
  await save('hero-poster-low.jpg', await low.canvas.encode('jpeg', 82));

  // Suvi portret — treba i za završni kadar low-tier videa.
  const lowDry = drawCrop(img, { x: 0, y: 0, w: img.width, h: img.height }, lowW, lowH);
  baseGrade(lowDry.ctx, lowW, lowH, 20260811);
  gradeDry(lowDry.ctx, lowW, lowH);
  await save('hero-dry-low.jpg', await lowDry.canvas.encode('jpeg', 82));

  const towel = await cutTowel(img);
  await save('towel-hi.png', await towel.encode('png'));

  const tm = createCanvas(Math.round(TOWEL_BOX.w * 0.6), Math.round(TOWEL_BOX.h * 0.6));
  tm.getContext('2d').drawImage(towel, 0, 0, tm.width, tm.height);
  await save('towel-md.png', await tm.encode('png'));

  console.log('\n  fajl                    veličina');
  console.log('  ' + '-'.repeat(38));
  for (const r of report) console.log(`  ${r.file.padEnd(24)}${String(r.kb).padStart(7)} KB`);
  const total = report.reduce((a, b) => a + b.kb, 0);
  console.log('  ' + '-'.repeat(38));
  console.log(`  ukupno${String(total.toFixed(1)).padStart(25)} KB\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
