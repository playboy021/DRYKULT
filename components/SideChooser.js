import { useEffect, useRef } from 'react';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import LiquidButton from './LiquidButton';
import { STRANE, HROM, MAMBA } from '../lib/faction';
import { LOW, MID } from '../lib/device';
import styles from './SideChooser.module.css';

// HERO — "izaberi stranu".
//
// Obe polovine nose ISTU haubu; menja se samo boja svetla. Zato podela mora
// da izgleda kao granica NA jednoj površini, a ne kao spoj dve fotke:
// background-size 200% + position left/right znači da leva polovina prikazuje
// levu stranu iste slike, a desna desnu. Spoj se poklapa u piksel.
//
// Po tieru:
//   high — mokra ivica prati kursor, obe strane žive
//   mid  — ivica stoji na sredini i sama se talasa, bira se klikom
//   low  — nema kursora: dve ploče jedna ispod druge, bira se tapom

const NASLOV = ['Suvo je pravilo.', 'Trag je greška.'];

export default function SideChooser({ tier, ready, izabrana, onIzbor, onPoruci }) {
  const hostRef = useRef(null);
  const cvRef = useRef(null);
  const lRef = useRef(null);
  const rRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const cv = cvRef.current;
    if (!host || !cv) return;

    // LOW nema kursora ni ivice — tamo su dve ploče, pa canvas nema šta da radi.
    if (tier === LOW) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const razmeri = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      cv.width = W;
      cv.height = H;
    };
    razmeri();
    const ro = new ResizeObserver(razmeri);
    ro.observe(host);

    // MID ne prati kursor — ivica stoji na sredini. Tamo je izbor klik,
    // pa praćenje kursora samo troši rAF bez koristi.
    const prati = tier !== MID;

    let meta = 0.5;
    let poz = 0.5;
    let t = 0;
    let raf = 0;

    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      meta = Math.max(0.16, Math.min(0.84, (e.clientX - r.left) / r.width));
    };
    const onLeave = () => {
      meta = 0.5;
    };
    if (prati) {
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerleave', onLeave, { passive: true });
    }

    const frejm = () => {
      // Kad je strana već izabrana, ivica se povlači na kraj kadra —
      // odluka je pala, nema više dve strane.
      const cilj = izabrana === HROM ? 0.985 : izabrana === MAMBA ? 0.015 : meta;
      poz += (cilj - poz) * 0.1;
      if (!reduced) t += 0.016;

      ctx.clearRect(0, 0, W, H);
      const x0 = poz * W;
      const lw = 1 - poz;
      const rw = poz;

      // Strana koja gubi TONE U CRNO. Ne samo da tamni — povlači se.
      const gl = ctx.createLinearGradient(0, 0, x0, 0);
      gl.addColorStop(0, `rgba(7,8,10,${Math.max(0, 0.66 - lw * 0.52).toFixed(3)})`);
      gl.addColorStop(1, 'rgba(7,8,10,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(0, 0, x0, H);

      const gr = ctx.createLinearGradient(W, 0, x0, 0);
      gr.addColorStop(0, `rgba(7,8,10,${Math.max(0, 0.66 - rw * 0.52).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(7,8,10,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x0, 0, W - x0, H);

      // Ivica: DVA sinusa različitih frekvencija. Jedan sinus izgleda
      // mehanički kao talas iz udžbenika; dva daju nepravilnost vode.
      ctx.beginPath();
      for (let y = 0; y <= H; y += 4) {
        const k = y / H;
        const x =
          x0 +
          Math.sin(k * 7.5 + t * 1.6) * (H * 0.018) +
          Math.sin(k * 3.1 - t * 1.05) * (H * 0.03);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2 * dpr;
      ctx.strokeStyle = 'rgba(244,246,248,0.5)';
      ctx.shadowBlur = 20 * dpr;
      ctx.shadowColor = lw > rw ? 'rgba(255,110,128,0.95)' : 'rgba(140,239,46,0.95)';
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (lRef.current) lRef.current.style.setProperty('--w', lw.toFixed(3));
      if (rRef.current) rRef.current.style.setProperty('--w', rw.toFixed(3));

      raf = requestAnimationFrame(frejm);
    };
    raf = requestAnimationFrame(frejm);

    // ZAKON 4.6 — tab u pozadini ne crta.
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frejm);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, [tier, izabrana]);

  const treciRed = izabrana ? `Ti si ${STRANE[izabrana].ime}.` : 'Izaberi stranu.';
  const linije = [...NASLOV, treciRed];

  const polovina = (id, strana) => {
    const s = STRANE[id];
    const aktivna = izabrana === id;
    const odbacena = izabrana && !aktivna;
    return (
      <button
        ref={strana === 'l' ? lRef : rRef}
        type="button"
        className={`${styles.half} ${styles[strana]} ${aktivna ? styles.aktivna : ''} ${
          odbacena ? styles.odbacena : ''
        }`}
        onClick={() => onIzbor(id)}
        aria-pressed={aktivna}
      >
        <img
          className={styles.towel}
          src={`/drykult/${s.peskir}-md.png`}
          alt={`DRYKULT peškir — strana ${s.ime}`}
          draggable={false}
        />
        <span className={styles.ime} style={{ color: s.bright }}>
          {s.ime}
        </span>
        <span className={styles.podnaslov}>{s.boja}</span>
      </button>
    );
  };

  return (
    <section ref={hostRef} className={`${styles.hero} ${tier === LOW ? styles.stack : ''}`}>
      <div className={`${styles.plate} ${styles.pl}`} aria-hidden="true" />
      <div className={`${styles.plate} ${styles.pr}`} aria-hidden="true" />
      {tier !== LOW && <canvas ref={cvRef} className={styles.cv} aria-hidden="true" />}

      <div className={styles.halves}>
        {polovina(HROM, 'l')}
        {polovina(MAMBA, 'r')}
      </div>

      <div className={styles.content}>
        <RevealFade className={styles.kicker} ready={ready} delay={120}>
          <span className={styles.mark}>DRYKULT®</span>
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          dve strane
        </RevealFade>

        <RevealLines lines={linije} className={styles.title} ready={ready} stagger={120} delay={260} />

        <RevealWords
          text="Jedan prelaz pokupi vodu koju običan peškir samo razmaže. Dve strane tkanine: jedna kupi, druga polira."
          className={styles.sub}
          ready={ready}
          stagger={30}
          delay={820}
        />

        <RevealFade className={styles.ctas} ready={ready} delay={1080}>
          <LiquidButton
            variant="solid"
            href="#poruci"
            onClick={(e) => {
              e.preventDefault();
              onPoruci?.({ x: e.clientX, y: e.clientY });
            }}
          >
            Poruči
          </LiquidButton>
        </RevealFade>

        <RevealFade className={styles.trust} ready={ready} delay={1240}>
          <span className={styles.markets}>RS · BA · ME</span>
          <span className={styles.sep} aria-hidden="true" />
          <span>90 × 70 cm · 850 GSM · twisted-loop</span>
        </RevealFade>
      </div>
    </section>
  );
}
