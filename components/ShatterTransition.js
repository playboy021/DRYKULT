import { useEffect, useRef } from 'react';
import { stopScroll, startScroll } from '../lib/scrollLock';
import { STRANE, peskirSlika } from '../lib/faction';
import { LOW, MID } from '../lib/device';
import styles from './ShatterTransition.module.css';

// LOM — kad se punjenje napuni do kraja, ekran pukne i ostane samo proizvod.
//
// Tri faze:
//   PUKOTINE  0-260ms   linije pucanja jure od tačke izbora ka ivicama, blesak
//   RASPAD    260-1100  krhotine odlete uz rotaciju i gravitaciju
//   PROIZVOD  900-1500  iza njih ostaje crno i peškir izabrane strane
//
// Krhotine su TAMNO STAKLO sa užarenom ivicom, ne fotografija. Pukao je
// ekran, a ne slika na njemu — pa i ne treba da nose nikakvu sliku.

const PUKOTINE_END = 260;
const RASPAD_END = 1100;
const TOTAL = 1500;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Krhotine se prave zracima iz tačke udara.
//
// Ključ je da radijusi prstenova idu PO SVAKOJ ŽBICI posebno, a ne zajednički.
// Sa zajedničkim radijusima prstenovi ispadaju savršeni krugovi i ceo lom
// izgleda kao meta za pikado — provereno offline renderom. Sa radijusima po
// žbici prstenovi postaju nazubljeni poligoni, što staklo i radi.
//
// Isto važi za uglove: ravnomerna podela na N delova se vidi kao točak sa
// paocima, pa razmak između žbica varira skoro dvostruko.
function napraviKrhotine(W, H, ox, oy, isecaka, prstenova, rnd) {
  const R = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) * 1.2;

  const uglovi = [];
  let a = rnd() * Math.PI * 2;
  const pocetak = a;
  for (let i = 0; i < isecaka; i++) {
    uglovi.push(a);
    a += ((Math.PI * 2) / isecaka) * (0.55 + rnd() * 0.9);
  }
  // Razvuci nazad na pun krug — bez ovoga ostane rupa ili preklop
  const raspon = a - pocetak;
  for (let i = 0; i < isecaka; i++) {
    uglovi[i] = pocetak + (uglovi[i] - pocetak) * ((Math.PI * 2) / raspon);
  }

  const rad = [];
  for (let i = 0; i < isecaka; i++) {
    // Prvi prsten kreće ODMAKNUT od centra. Bez toga se oko tačke udara
    // nakupi rozeta sitnih krhotina koja izgleda kao vatromet.
    const kol = [R * (0.11 + rnd() * 0.07)];
    for (let j = 1; j <= prstenova; j++) {
      const baza = Math.pow(j / prstenova, 1.3) * R;
      kol.push(Math.max(kol[j - 1] + R * 0.06, baza * (0.62 + rnd() * 0.72)));
    }
    rad.push(kol);
  }

  const tacka = (i, j) => {
    const ug = uglovi[i % isecaka];
    const r = rad[i % isecaka][j];
    return [ox + Math.cos(ug) * r, oy + Math.sin(ug) * r];
  };

  const krhotine = [];
  for (let j = 0; j < prstenova; j++) {
    for (let i = 0; i < isecaka; i++) {
      const tacke = [tacka(i, j), tacka(i + 1, j), tacka(i + 1, j + 1), tacka(i, j + 1)];
      const cx = tacke.reduce((s, p) => s + p[0], 0) / 4;
      const cy = tacke.reduce((s, p) => s + p[1], 0) / 4;
      const daljina = Math.hypot(cx - ox, cy - oy);

      krhotine.push({
        tacke,
        cx,
        cy,
        // Bliže krhotine kreću ranije i brže — udarni talas ide od centra
        kasnjenje: (daljina / R) * 280,
        brzina: (0.9 + rnd() * 0.9) * (1 - (daljina / R) * 0.35),
        ugao: Math.atan2(cy - oy, cx - ox),
        spin: (rnd() - 0.5) * 3.2,
        pad: 0.6 + rnd() * 1.1,
      });
    }
  }

  // Same pukotine za prvu fazu: žbice od centra i nazubljeni prstenovi.
  // Crtanje obrisa SVIH krhotina bi dalo gustu mrežu — staklo pri udaru
  // prvo pukne u nekoliko linija, tek posle se raspadne.
  const linije = [];
  for (let i = 0; i < isecaka; i++) {
    const kraj = tacka(i, prstenova);
    linije.push({ od: [ox, oy], do: kraj, kasnjenje: 0 });
  }
  for (let j = 1; j <= prstenova; j++) {
    for (let i = 0; i < isecaka; i++) {
      if (rnd() < 0.28) continue; // poneki segment nedostaje — lom nije uredan
      linije.push({
        od: tacka(i, j),
        do: tacka(i + 1, j),
        kasnjenje: (rad[i][j] / R) * 220,
      });
    }
  }

  return { krhotine, linije, R };
}

export default function ShatterTransition({ active, origin, side, tier, onDone }) {
  const hostRef = useRef(null);
  const cvRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const host = hostRef.current;
    const cv = cvRef.current;
    if (!host || !cv) return;

    const f = STRANE[side] || STRANE.mamba;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ZAKON 4.6 — bez pokreta nema predstave.
    if (reduced) {
      onDone?.();
      return;
    }

    let locked = false;
    const lock = () => {
      if (!locked) {
        locked = true;
        stopScroll();
      }
    };
    const unlock = () => {
      if (locked) {
        locked = false;
        startScroll();
      }
    };
    lock();

    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(window.innerWidth * dpr);
    const H = Math.round(window.innerHeight * dpr);
    cv.width = W;
    cv.height = H;
    cv.style.width = `${window.innerWidth}px`;
    cv.style.height = `${window.innerHeight}px`;

    const ox = (origin?.x ?? window.innerWidth / 2) * dpr;
    const oy = (origin?.y ?? window.innerHeight / 2) * dpr;

    let seed = 1337;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

    // Manje krhotina na slabijem uređaju — svaka je clip + drawImage po frejmu.
    const isecaka = tier === LOW ? 9 : tier === MID ? 12 : 16;
    const prstenova = tier === LOW ? 3 : tier === MID ? 3 : 4;
    const { krhotine, linije } = napraviKrhotine(W, H, ox, oy, isecaka, prstenova, rnd);

    // Krhotine se ne teksturišu fotografijom. Ranije su nosile podlogu mokre
    // haube, ali pozadina hero-a je sada čista crna sa neonskim šavom — pa bi
    // fragmenti fotografije prikazivali nešto što na ekranu nikad nije bilo.
    // Uz to je taj preload bio 597 KB za sliku koja se možda nikad ne vidi.
    // Sada su krhotine tamno staklo sa užarenom ivicom, što je i tačnije:
    // pukao je EKRAN, a ne slika na njemu.
    const staklo = ctx.createLinearGradient(0, 0, W, H);
    staklo.addColorStop(0, '#14171c');
    staklo.addColorStop(0.5, '#0b0d11');
    staklo.addColorStop(1, '#16191f');

    let raf = 0;
    const t0 = performance.now();

    const frejm = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);

      // --- faza 1: pukotine + blesak ---------------------------------------
      if (t < PUKOTINE_END + 120) {
        const k = Math.min(1, t / PUKOTINE_END);
        const e = easeOutCubic(k);
        ctx.save();
        ctx.strokeStyle = `rgba(${f.rgb},${(0.95 * (1 - k * 0.5)).toFixed(3)})`;
        ctx.lineWidth = 2 * dpr;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 24 * dpr;
        ctx.shadowColor = `rgba(${f.rgb},0.9)`;
        for (const l of linije) {
          const napredak = (e * 280 - l.kasnjenje) / 160;
          if (napredak <= 0) continue;
          // Pukotina se CRTA od svog početka ka kraju umesto da bljesne cela —
          // udarni talas se tako vidi kako putuje ka ivicama.
          const u = Math.min(1, napredak);
          ctx.beginPath();
          ctx.moveTo(l.od[0], l.od[1]);
          ctx.lineTo(l.od[0] + (l.do[0] - l.od[0]) * u, l.od[1] + (l.do[1] - l.od[1]) * u);
          ctx.stroke();
        }
        ctx.restore();

        // Blesak u tački udara — sakriva trenutak kad ekran postane krhotine
        const bl = Math.max(0, 1 - t / 220);
        if (bl > 0) {
          const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, H * 0.9);
          g.addColorStop(0, `rgba(255,255,255,${(0.85 * bl).toFixed(3)})`);
          g.addColorStop(0.25, `rgba(${f.rgb},${(0.5 * bl).toFixed(3)})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }
      }

      // --- faza 2: krhotine odlete ------------------------------------------
      if (t >= PUKOTINE_END) {
        for (const s of krhotine) {
          const age = t - PUKOTINE_END - s.kasnjenje;
          if (age <= 0) {
            // Još stoji na mestu — crtaj je nepomerenu, da kadar ne "nestane"
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(s.tacke[0][0], s.tacke[0][1]);
            for (let i = 1; i < 4; i++) ctx.lineTo(s.tacke[i][0], s.tacke[i][1]);
            ctx.closePath();
            ctx.fillStyle = staklo;
            ctx.fill();
            ctx.restore();
            continue;
          }

          const p = age / (RASPAD_END - PUKOTINE_END);
          if (p >= 1) continue;
          const let_ = age / 1000;
          const dist = s.brzina * let_ * H * 1.6;
          const dx = Math.cos(s.ugao) * dist;
          const dy = Math.sin(s.ugao) * dist + s.pad * let_ * let_ * H * 1.9;

          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - p * 1.15);
          ctx.translate(s.cx + dx, s.cy + dy);
          ctx.rotate(s.spin * let_);
          ctx.translate(-s.cx, -s.cy);
          ctx.beginPath();
          ctx.moveTo(s.tacke[0][0], s.tacke[0][1]);
          for (let i = 1; i < 4; i++) ctx.lineTo(s.tacke[i][0], s.tacke[i][1]);
          ctx.closePath();
          ctx.fillStyle = staklo;
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - p * 1.6) * 0.7;
          ctx.translate(s.cx + dx, s.cy + dy);
          ctx.rotate(s.spin * let_);
          ctx.translate(-s.cx, -s.cy);
          ctx.beginPath();
          ctx.moveTo(s.tacke[0][0], s.tacke[0][1]);
          for (let i = 1; i < 4; i++) ctx.lineTo(s.tacke[i][0], s.tacke[i][1]);
          ctx.closePath();
          ctx.strokeStyle = `rgba(${f.rgb},0.55)`;
          ctx.lineWidth = 1.5 * dpr;
          ctx.stroke();
          ctx.restore();
        }
      }

      if (t >= TOTAL) {
        unlock();
        onDone?.();
        return;
      }
      raf = requestAnimationFrame(frejm);
    };
    raf = requestAnimationFrame(frejm);

    return () => {
      cancelAnimationFrame(raf);
      unlock();
    };
  }, [active, origin, side, tier, onDone]);

  if (!active) return null;
  const f = STRANE[side] || STRANE.mamba;

  return (
    <div ref={hostRef} className={styles.host} aria-hidden="true">
      {/* Proizvod se pojavljuje IZA krhotina, pa kad one odlete — on je već tu.
          Da se pojavljuje posle, video bi se video kao dva odvojena poteza. */}
      <div className={styles.reveal}>
        <img className={styles.towel} src={peskirSlika(side, tier)} alt="" />
        <div className={styles.ime} style={{ color: f.bright }}>
          {f.ime}
        </div>
      </div>
      <canvas ref={cvRef} className={styles.cv} />
    </div>
  );
}
