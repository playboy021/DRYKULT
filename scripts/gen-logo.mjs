// DRYKULT logo — jedan izvor geometrije, iz njega i SVG i PNG.
//
// Zašto poligoni a ne font: fajlovi idu proizvođaču. Slovo iz tuđeg fonta znači
// tuđu licencu na tvom logotipu i zavisnost od fajla koji fabrika nema. Ovde je
// svako slovo nacrtano, pa je logo ceo tvoj i otvara se svuda isto.
//
// Zašto sve pravim linijama: krivu vez ne ume da isprati, a tkani žakard je
// rasterizuje u stepenice. Fasete se vezu i tkaju čisto — i daju hromiran,
// sečen ton koji ide uz ime HROM.
//
// node scripts/gen-logo.mjs

import { createCanvas } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOREN = join(dirname(fileURLToPath(import.meta.url)), '..', 'logo');

const BOJE = { black: '#07080A', white: '#F4F6F8', hrom: '#FF6E80', mamba: '#8CEF2E' };

// --- sistem ----------------------------------------------------------------
// Sve mere izlaze iz ova četiri broja. Kad se jedan promeni, ceo logo ostaje
// dosledan — to je razlika između crtanja slova i crtanja LOGOTIPA.
const KAPA = 100;                 // visina verzala
const UGAO = 12;                  // italik, motorsport ton
const NAGIB = Math.tan((UGAO * Math.PI) / 180);
const ZASEK = 20;                 // spoljna faseta (45°) — potpisni detalj
const ZASEK_UNUTRA = 12;          // faseta u unutrašnjosti slova

// ---------------------------------------------------------------------------
// ZNAK: kap presečena na dve. Poenta brenda je da kap ne preživi.
// ---------------------------------------------------------------------------

// Kap se NE ređa tačkama napamet — tako su prve dve verzije ispale kao jedro:
// stranice su išle pravo iz vrha do dna. Prava kap je krug pri dnu i DVE
// TANGENTE sa vrha na taj krug; stranice su zato ispupčene.
//
// Vrh je pomeren desno od centra kruga — odatle nagib, bez ijedne krive linije.
function napraviKap({ cx, cy, r, vx, vy, faseta }) {
  const d = Math.hypot(cx - vx, cy - vy);
  const ka = Math.atan2(cy - vy, cx - vx); // pravac vrh → centar
  const pola = Math.asin(r / d);           // poluugao vrha
  const duz = Math.sqrt(d * d - r * r);    // dužina tangente
  const dodir = (s) => {
    const u = ka + s * pola;
    return [vx + Math.cos(u) * duz, vy + Math.sin(u) * duz];
  };
  const a = dodir(-1);
  const b = dodir(1);
  const [desno, levo] = a[0] > b[0] ? [a, b] : [b, a];

  const ugao = (p) => Math.atan2(p[1] - cy, p[0] - cx);
  let od = ugao(desno);
  let doU = ugao(levo);
  while (doU < od) doU += Math.PI * 2; // luk ide preko DNA (y raste nadole)

  const luk = [];
  for (let i = 1; i < faseta; i++) {
    const u = od + ((doU - od) * i) / faseta;
    luk.push([cx + Math.cos(u) * r, cy + Math.sin(u) * r]);
  }
  return [[vx, vy], desno, ...luk, levo].map(([x, y]) => [
    Math.round(x * 100) / 100,
    Math.round(y * 100) / 100,
  ]);
}

// Odnos visine i poluprečnika je ono što odlučuje da li je kap ili jedro. Na
// 3.15 × r gornje dve trećine ostaju trougao. Na ~2.7 × r krug preuzima oblik
// i kap se prepozna odmah.
const KAP = napraviKap({ cx: 46, cy: 78, r: 46, vx: 62, vy: -2, faseta: 10 });
const REZ_SREDINA = 70; // visina reza — oba dela moraju da imaju mase
const REZ_SIRINA = 14;  // debljina proreza
// Pomeraj gornjeg dela je probavan i izbačen: na prvi pogled čita kao greška u
// štampi, a ne kao pokret. Nagib reza sam nosi dinamiku.
const REZ_POMAK = 0;

// Rez ide POD PRAVIM UGLOM NA ITALIK, ne vodoravno. Vodoravan rez na nagnutom
// logotipu je jedina linija koja ne pripada sistemu i odmah se vidi.
// Pun italik ugao preko oblika širokog 78 spusti rez za 17 jedinica s kraja na
// kraj — više od same debljine proreza, pa čita kao zasečak a ne kao rez.
// Polovina ugla: veza sa logotipom se vidi, oblik ostaje čitljiv.
const REZ_K = NAGIB * 0.5;

// Sutherland–Hodgman nad proizvoljnom poluravni. Prorez je tako STVARNI razmak
// između dva tela, a ne bela pruga preko — pa radi i kad se logo štampa u boji,
// i kad se veze koncem, i kad se seče kao nalepnica.
function odseci(tacke, f) {
  const izlaz = [];
  for (let i = 0; i < tacke.length; i++) {
    const a = tacke[i];
    const b = tacke[(i + 1) % tacke.length];
    const va = f(a);
    const vb = f(b);
    if (va <= 0) izlaz.push(a);
    if ((va <= 0) !== (vb <= 0)) {
      const t = va / (va - vb);
      izlaz.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return izlaz;
}
// Linija kroz (x, y0 + K*(x - 46)); pozitivno je ispod nje.
const linija = (y0, smer) => (p) => smer * (p[1] - (y0 + REZ_K * (p[0] - 46)));

const gornji = odseci(KAP, linija(REZ_SREDINA - REZ_SIRINA / 2, 1));
const donji = odseci(KAP, linija(REZ_SREDINA + REZ_SIRINA / 2, -1));
const ZNAK_DELOVI = [gornji.map(([x, y]) => [x + REZ_POMAK, y]), donji];
const ZNAK_PUN = [KAP]; // bez proreza — za sitne primene i vez

// ---------------------------------------------------------------------------
// LOGOTIP: sedam verzala, svaki nacrtan. Uspravno se crta, nagib se peče na kraju.
//
// Stub je 26. Dijagonale se mere UPRAVNO na sebe i drže istih ~26 — u prvoj
// verziji su bile 22 i slova su "treperila", jer je oko videlo da su Y i K
// lakši od D i U.
//
// Svaki spoj dijagonala (K, Y, R) dobija ravnu fasetu iste veličine kao spoljni
// zasek. To je potpis: isti rez se ponavlja i u slovima i u kapi.
// ---------------------------------------------------------------------------

const SLOVA = {
  D: { w: 80, p: [
    [[0, 0], [60, 0], [80, ZASEK], [80, 100 - ZASEK], [60, 100], [0, 100]],
    [[26, 22], [46, 22], [54, 30], [54, 70], [46, 78], [26, 78]],
  ] },
  R: { w: 80, p: [
    [[0, 0], [58, 0], [78, ZASEK], [78, 46], [64, 66], [80, 100], [52, 100],
     [36, 66], [26, 66], [26, 100], [0, 100]],
    [[26, 22], [46, 22], [54, 30], [54, 36], [46, 44], [26, 44]],
  ] },
  Y: { w: 82, p: [
    [[0, 0], [30, 0], [38, 30], [46, 30], [54, 0], [82, 0],
     [54, 56], [54, 100], [28, 100], [28, 56]],
  ] },
  K: { w: 88, p: [
    [[0, 0], [26, 0], [26, 38], [56, 0], [86, 0], [56, 40], [48, 50], [88, 100],
     [56, 100], [34, 62], [26, 72], [26, 100], [0, 100]],
  ] },
  U: { w: 78, p: [
    [[0, 0], [26, 0], [26, 78 - ZASEK_UNUTRA], [34, 78], [44, 78], [52, 78 - ZASEK_UNUTRA],
     [52, 0], [78, 0], [78, 100 - ZASEK], [58, 100], [20, 100], [0, 100 - ZASEK]],
  ] },
  L: { w: 66, p: [
    [[0, 0], [26, 0], [26, 78], [66, 78], [66, 100], [0, 100]],
  ] },
  T: { w: 80, p: [
    [[0, 0], [80, 0], [80, 24], [53, 24], [53, 100], [27, 100], [27, 24], [0, 24]],
  ] },
};

// --- optički razmak --------------------------------------------------------
// Fiksni razmak između slova NE RADI: posle L-a ostaje rupa jer je L otvoren
// dole-desno, a T se sa L-om preklapa jer mu greda visi levo. Razmak se zato
// MERI — računa se belina između dva obrisa i izjednačava po svim parovima.

const CILJ_BELINE = 15;
const KAP_BELINE = 34; // preko ovoga se ne broji, da otvoreni parovi ne dominiraju
// Sam prosek NIJE dovoljan: kod para kao Y–K procep je negde ogroman a negde
// minimalan, prosek ispadne visok i slova se privuku dok se ne dodirnu. Zato i
// tvrdi minimum — najuže mesto između dva slova ne sme ispod ovoga.
const MIN_BELINA = 10;

function rasponi(delovi, y) {
  const t = [];
  for (const p of delovi) {
    for (let i = 0; i < p.length; i++) {
      const [x1, y1] = p[i];
      const [x2, y2] = p[(i + 1) % p.length];
      if (y1 === y2) continue;
      if ((y >= y1 && y < y2) || (y >= y2 && y < y1)) {
        t.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
  }
  t.sort((a, b) => a - b);
  return t;
}

function optickiRazmak(levo, desno) {
  let zbir = 0, n = 0, naj = Infinity;
  for (let y = 2; y <= 98; y += 2) {
    const a = rasponi(levo, y);
    const b = rasponi(desno, y);
    if (!a.length || !b.length) continue;
    const procep = b[0] - a[a.length - 1];
    zbir += Math.min(KAP_BELINE, procep);
    if (procep < naj) naj = procep;
    n++;
  }
  if (!n) return 0;
  // Uzima se ono što je konzervativnije: optički prosek ili tvrdi minimum.
  return Math.max(CILJ_BELINE - zbir / n, MIN_BELINA - naj);
}

// Nagib oko osnovne linije: vrh ide udesno, osnova stoji. Zato (KAPA - y).
const nagni = (put, x) => put.map(([px, py]) => [x + px + (KAPA - py) * NAGIB, py]);

function logotip() {
  const delovi = [];
  let x = 0;
  let prethodno = null;
  for (const z of 'DRYKULT') {
    const s = SLOVA[z];
    let ovo = s.p.map((put) => nagni(put, x));
    if (prethodno) {
      x += optickiRazmak(prethodno, ovo);
      ovo = s.p.map((put) => nagni(put, x));
    }
    delovi.push(...ovo);
    prethodno = ovo;
    x += s.w;
  }
  return { delovi };
}

// ---------------------------------------------------------------------------
// Sklopovi
// ---------------------------------------------------------------------------

const okvir = (delovi) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const d of delovi) for (const [x, y] of d) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
};
const pomeri = (delovi, dx, dy, k = 1) =>
  delovi.map((d) => d.map(([x, y]) => [x * k + dx, y * k + dy]));
const naNulu = (delovi) => { const o = okvir(delovi); return pomeri(delovi, -o.x0, -o.y0); };

function sklopi(vrsta) {
  const rec = naNulu(logotip().delovi);
  const ro = okvir(rec);
  const znakOkvir = okvir(ZNAK_DELOVI);

  if (vrsta === 'wordmark') return { delovi: rec };
  if (vrsta === 'mark') return { delovi: naNulu(ZNAK_DELOVI) };
  if (vrsta === 'mark-solid') return { delovi: naNulu(ZNAK_PUN) };

  if (vrsta === 'horizontal') {
    // Znak je 1.34 × visine verzala — optički izjednačeno sa težinom slova.
    const k = (KAPA * 1.34) / znakOkvir.h;
    const z = naNulu(pomeri(ZNAK_DELOVI, 0, 0, k));
    const zo = okvir(z);
    // Osnovna linija slova sedi malo iznad dna znaka — inače logotip "visi".
    return { delovi: [...z, ...pomeri(rec, zo.w + KAPA * 0.5, (zo.h - ro.h) / 2)] };
  }

  // stacked — oba dela se centriraju na ZAJEDNIČKU širinu. Ranije je svaki
  // dobijao svoj pomeraj pa se sklop raspao čim je logotip bio širi od znaka.
  const k2 = (KAPA * 1.7) / znakOkvir.h;
  const z = naNulu(pomeri(ZNAK_DELOVI, 0, 0, k2));
  const zo = okvir(z);
  const sirina = Math.max(zo.w, ro.w);
  return {
    delovi: [
      ...pomeri(z, (sirina - zo.w) / 2, 0),
      ...pomeri(rec, (sirina - ro.w) / 2, zo.h + KAPA * 0.42),
    ],
  };
}

// ---------------------------------------------------------------------------
// Izlaz
// ---------------------------------------------------------------------------

const zaokr = (v) => Math.round(v * 100) / 100;

function svg(delovi, boja, naziv) {
  const o = okvir(delovi);
  const d = delovi
    .map((p) => 'M' + p.map(([x, y]) => `${zaokr(x - o.x0)} ${zaokr(y - o.y0)}`).join('L') + 'Z')
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${zaokr(o.w)} ${zaokr(o.h)}" role="img" aria-label="DRYKULT">
<title>${naziv}</title>
<path fill="${boja}" fill-rule="evenodd" d="${d}"/>
</svg>
`;
}

async function png(delovi, boja, sirinaPx, put, podloga) {
  const o = okvir(delovi);
  const k = sirinaPx / o.w;
  const c = createCanvas(Math.round(o.w * k), Math.round(o.h * k));
  const g = c.getContext('2d');
  if (podloga) { g.fillStyle = podloga; g.fillRect(0, 0, c.width, c.height); }
  g.fillStyle = boja;
  g.beginPath();
  for (const p of delovi) {
    p.forEach(([x, y], i) => {
      const px = (x - o.x0) * k, py = (y - o.y0) * k;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    });
    g.closePath();
  }
  g.fill('evenodd');
  await writeFile(put, await c.encode('png'));
}

const VARIJANTE = {
  horizontal: ['black', 'white', 'hrom', 'mamba'],
  stacked: ['black', 'white'],
  mark: ['black', 'white', 'hrom', 'mamba'],
  'mark-solid': ['black', 'white'],
  wordmark: ['black', 'white'],
};
const SIRINE = { horizontal: 2400, stacked: 1600, mark: 1200, 'mark-solid': 1200, wordmark: 2400 };

await mkdir(join(KOREN, 'svg'), { recursive: true });
await mkdir(join(KOREN, 'png'), { recursive: true });

// `node scripts/gen-logo.mjs slova` — svako slovo odvojeno, za proveru oblika.
// Bez ovoga se greška u jednom slovu vidi tek kad se spoji cela reč.
if (process.argv.includes('slova')) {
  const delovi = [];
  let x = 0;
  for (const z of 'DRYKULT') {
    delovi.push(...SLOVA[z].p.map((put) => nagni(put, x)));
    x += SLOVA[z].w + 40;
  }
  await png(delovi, BOJE.white, 2600, join(KOREN, 'png', '_provera-slova.png'), BOJE.black);
  console.log('slova → logo/png/_provera-slova.png');
}

for (const vrsta of Object.keys(VARIJANTE)) {
  const { delovi } = sklopi(vrsta);
  for (const v of VARIJANTE[vrsta]) {
    const ime = `drykult-${vrsta}-${v}`;
    await writeFile(join(KOREN, 'svg', `${ime}.svg`), svg(delovi, BOJE[v], `DRYKULT ${vrsta} ${v}`), 'utf8');
    // Bela varijanta na providnom se ne vidi u pregledu, pa dobija crnu podlogu.
    await png(delovi, BOJE[v], SIRINE[vrsta], join(KOREN, 'png', `${ime}.png`), v === 'white' ? BOJE.black : null);
  }
  const o = okvir(delovi);
  console.log(`${vrsta.padEnd(12)} ${zaokr(o.w)} × ${zaokr(o.h)}  (odnos ${(o.w / o.h).toFixed(3)}:1)`);
}
console.log(`\ngotovo → ${KOREN}`);
