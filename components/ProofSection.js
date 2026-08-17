import { useEffect, useRef, useState } from 'react';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, HROM } from '../lib/faction';
import { LOW, MID } from '../lib/device';
import styles from './ProofSection.module.css';

// DOKAZ.
//
// Nemamo još snimke pravog brisanja, a izmišljene brojke ne dolaze u obzir
// (vidi Pravilo poštenja u CLAUDE.md). Zato dokaz mora biti nešto što
// posetilac SAM uradi: traka puna kapi koju prevuče i pokupi ih.
//
// Brojevi ispod nisu tvrdnja nego RAČUNICA iz specifikacije koju i sami
// objavljujemo: 90 × 70 cm je 0,63 m², a 850 g/m² puta 0,63 je 536 g tkanine.
// Sve što se ne može izračunati iz specifikacije ovde ne stoji.

const KAPI = { [LOW]: 260, [MID]: 460, high: 700 };

function kapSprite(size, rgb) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const x = c.getContext('2d');
  const r = size / 2;

  const sh = x.createRadialGradient(r + r * 0.18, r + r * 0.22, 0, r, r, r);
  sh.addColorStop(0, 'rgba(0,6,16,0.28)');
  sh.addColorStop(1, 'rgba(0,6,16,0)');
  x.fillStyle = sh;
  x.fillRect(0, 0, size, size);

  const b = x.createRadialGradient(r, r, 0, r, r, r * 0.92);
  b.addColorStop(0, `rgba(${rgb},0.05)`);
  b.addColorStop(0.66, `rgba(${rgb},0.1)`);
  b.addColorStop(0.9, `rgba(${rgb},0.4)`);
  b.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = b;
  x.beginPath();
  x.arc(r, r, r * 0.92, 0, Math.PI * 2);
  x.fill();

  const sp = x.createRadialGradient(r - r * 0.3, r - r * 0.34, 0, r - r * 0.3, r - r * 0.34, r * 0.38);
  sp.addColorStop(0, 'rgba(255,255,255,0.6)');
  sp.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sp;
  x.beginPath();
  x.arc(r - r * 0.3, r - r * 0.34, r * 0.38, 0, Math.PI * 2);
  x.fill();

  return c;
}

export default function ProofSection({ tier, strana }) {
  const hostRef = useRef(null);
  const cvRef = useRef(null);
  const [pokupljeno, setPokupljeno] = useState(0);
  const [dirano, setDirano] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const cv = cvRef.current;
    if (!host || !cv) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const f = STRANE[strana || HROM];
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0;
    let H = 0;
    let kapi = [];
    let ukupno = 0;

    const sprite = kapSprite(72, f.rgb);

    const zasej = () => {
      const n = KAPI[tier] || KAPI.high;
      kapi = [];
      for (let i = 0; i < n; i++) {
        kapi.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (2 + Math.pow(Math.random(), 2.4) * 13) * dpr,
          ziva: true,
        });
      }
      ukupno = kapi.length;
    };

    const razmeri = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      cv.width = W;
      cv.height = H;
      zasej();
      crtaj();
    };

    function crtaj() {
      ctx.clearRect(0, 0, W, H);
      for (const k of kapi) {
        if (!k.ziva) continue;
        ctx.drawImage(sprite, k.x - k.r, k.y - k.r, k.r * 2, k.r * 2);
      }
    }

    razmeri();
    const ro = new ResizeObserver(razmeri);
    ro.observe(host);

    // Poluprečnik brisanja prati visinu trake, ne fiksni broj piksela —
    // na telefonu je traka niža, pa bi fiksnih 90px obrisalo sve iz jednog poteza.
    const brisi = (cx, cy) => {
      const R = Math.max(H * 0.38, 40 * dpr);
      let promena = false;
      for (const k of kapi) {
        if (!k.ziva) continue;
        if (Math.hypot(k.x - cx, k.y - cy) < R) {
          k.ziva = false;
          promena = true;
        }
      }
      if (promena) {
        crtaj();
        const ostalo = kapi.reduce((s, k) => s + (k.ziva ? 1 : 0), 0);
        setPokupljeno(Math.round(((ukupno - ostalo) / ukupno) * 100));
      }
    };

    let prosli = null;
    const onMove = (e) => {
      if (reduced) return;
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr;
      const y = (e.clientY - r.top) * dpr;
      setDirano(true);

      // Interpolacija: brz pokret daje retke tačke i trag bi bio niz rupa.
      if (prosli) {
        const d = Math.hypot(x - prosli.x, y - prosli.y);
        const korak = Math.max(H * 0.18, 12 * dpr);
        const n = Math.min(40, Math.floor(d / korak));
        for (let i = 1; i <= n; i++) {
          brisi(prosli.x + ((x - prosli.x) * i) / n, prosli.y + ((y - prosli.y) * i) / n);
        }
      }
      brisi(x, y);
      prosli = { x, y };
    };
    const onLeave = () => {
      prosli = null;
    };

    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });
    host.addEventListener('pointerdown', onMove, { passive: true });

    return () => {
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onMove);
    };
  }, [tier, strana]);

  return (
    <section id="dokaz" className={styles.wrap}>
      <div className={styles.inner}>
        <RevealFade className={styles.kicker} delay={60}>
          Dokaz
        </RevealFade>
        <RevealLines
          lines={['Ne veruj nam.', 'Obriši sam.']}
          as="h2"
          className={styles.naslov}
          stagger={110}
          delay={140}
        />
        <RevealWords
          className={styles.lede}
          text={
            tier === LOW
              ? 'Prevuci prstom preko trake. Kapi koje pokupiš ne vraćaju se.'
              : 'Prevuci mišem preko trake. Kapi koje pokupiš ne vraćaju se.'
          }
          delay={520}
        />

        <div ref={hostRef} className={styles.traka}>
          <canvas ref={cvRef} className={styles.cv} aria-hidden="true" />
          <div className={`${styles.uputstvo} ${dirano ? styles.sakrij : ''}`} aria-hidden="true">
            {tier === LOW ? 'prevuci prstom' : 'prevuci preko'}
          </div>
          <div className={styles.brojac} role="status">
            <span className={styles.broj}>{pokupljeno}%</span>
            <span className={styles.oznaka}>pokupljeno</span>
          </div>
        </div>

        {/* Sve tri stavke su računica iz specifikacije koju objavljujemo,
            ne tvrdnja koju bi neko morao da nam veruje na reč. */}
        <RevealFade className={styles.brojke} delay={760}>
          <div className={styles.stavka}>
            <span className={styles.vrednost}>0,63 m²</span>
            <span className={styles.opis}>površina — 90 × 70 cm</span>
          </div>
          <div className={styles.stavka}>
            <span className={styles.vrednost}>536 g</span>
            <span className={styles.opis}>tkanine — 850 g/m² × 0,63 m²</span>
          </div>
          <div className={styles.stavka}>
            <span className={styles.vrednost}>2</span>
            <span className={styles.opis}>strane — twisted-loop kupi, pliš polira</span>
          </div>
        </RevealFade>

        <p className={styles.napomena}>
          Kad stigne prva serija, ovde ide snimak jednog prelaza preko celog auta — nesečen.
          Dotle stoji ono što se može proveriti: računica i tvoja ruka.
        </p>
      </div>
    </section>
  );
}
