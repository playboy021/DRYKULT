import { useEffect, useRef, useState } from 'react';
import { stopScroll, startScroll } from '../lib/scrollLock';
import styles from './Loader.module.css';

const DURATION = 1300; // koliko brojač putuje 000 → 100 kad je sve već tu
const HARD_CAP = 4000; // ZAKON 4.7 — posle ovoga ide dalje bez obzira na sve
const KEY = 'drykult:loaded';

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pad3 = (n) => String(Math.round(n)).padStart(3, '0');

// Prati STVARNO učitavanje ključnih slika, ne tajmer. Tajmer je samo gornja
// granica brzine (da ne prelete na 100 za 50ms) i tvrda kočnica na 4s.
export default function Loader({ assets = [], onDone }) {
  // Ista sesija = bez ponavljanja. Provera je u lenjom inicijalizatoru da
  // loader ne bi bljesnuo jedan frejm pre nego što se sakrije.
  const [skip] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(KEY) === '1';
  });

  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (skip) {
      onDone?.();
      return;
    }

    stopScroll();

    let loaded = 0;
    const total = Math.max(1, assets.length);
    const imgs = [];

    // Ne blokiraj na grešci: slika koja pukne ne sme da zaključa ceo sajt.
    const bump = () => {
      loaded += 1;
    };
    for (const src of assets) {
      const im = new Image();
      im.onload = bump;
      im.onerror = bump;
      im.src = src;
      imgs.push(im);
    }

    const t0 = performance.now();
    let raf;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPct(100);
      setLeaving(true);
      // Ploča klizne nagore 900ms; skrol i hero se otključavaju tek na kraju,
      // inače bi se otkrivanje naslova odigralo iza zavese.
      window.setTimeout(() => {
        try {
          sessionStorage.setItem(KEY, '1');
        } catch {
          /* private mode — nije kritično */
        }
        startScroll();
        onDone?.();
      }, 900);
    };

    const tick = (now) => {
      const elapsed = now - t0;

      if (elapsed >= HARD_CAP) {
        finish();
        return;
      }

      const timed = easeInOutCubic(Math.min(1, elapsed / DURATION));
      const real = loaded / total;
      // Brojač ide brzinom tajmera, ali ga stvarno učitavanje može zadržati.
      // +0.12 da nikad ne stoji na nuli dok prva slika ne stigne.
      const p = Math.min(timed, 0.12 + 0.88 * real);
      setPct(p * 100);

      if (p >= 0.999) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      for (const im of imgs) {
        im.onload = null;
        im.onerror = null;
      }
      if (!doneRef.current) startScroll(); // ne ostavljaj sajt zaključan
    };
    // assets je konstantan niz iz index.js — namerno ne ulazi u deps
    // da promena reference ne bi restartovala loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  if (skip) return null;

  return (
    <div className={`${styles.wrap} ${leaving ? styles.leaving : ''}`} aria-hidden={leaving}>
      <div className={styles.inner}>
        <div className={styles.brand}>DRYKULT</div>
        <div className={styles.count}>{pad3(pct)}</div>
      </div>
      <div className={styles.track}>
        <div className={styles.bar} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
