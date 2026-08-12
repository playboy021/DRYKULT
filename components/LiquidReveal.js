import { useEffect, useRef } from 'react';
import styles from './LiquidReveal.module.css';

const BRUSH_RADIUS = 143; // CSS px
const DECAY = 0.016; // koliko traga nestane po frejmu
const IDLE_FRAMES = 120; // posle toliko mirnih frejmova gasimo petlju
const MAX_STEPS = 60; // gornja granica međutačaka po pomeraju

// Liquid reveal: donji sloj je MOKRA hauba (obični <img>), a platno iznad
// farba SUVU po tragu kursora.
//
// Zašto jedno platno a ne maska + kompozit:
//   1. destination-out sa crnom alfom  -> pojede deo postojećeg traga
//   2. četka (radijalni gradijent)     -> doda alfu tamo gde je kursor
//   3. source-in sa cover-slikom       -> SVA preostala alfa postane suva hauba
// Treći korak svaki frejm iznova oboji ceo trag, pa boja same četke nije bitna.
//
// Offscreen "cover" platno postoji da drugi korak bude drawImage 1:1.
// Da skaliramo original svaki frejm, na 2880x1620 bi to bilo najskuplje mesto.
export default function LiquidReveal({ wet, dry, tier, className, children }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    // ZAKON 4.6 — ko je tražio manje pokreta, dobija samo mokru sliku.
    // Ni platno se ne pravi: nema petlje, nema GPU-a, nema baterije.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let cover = null; // offscreen platno sa suvom slikom, već "cover"-ovanom
    let coverCtx = null;
    let W = 0;
    let H = 0;
    let radius = BRUSH_RADIUS * dpr;

    const dryImg = new Image();
    let dryReady = false;

    // Ista matematika koju radi CSS object-fit: cover. Mora da se poklopi
    // u piksel sa donjim <img>-om, inače se otkriveni deo "pomeri" i
    // odmah se vidi da su to dve slike.
    const fitCover = () => {
      if (!dryReady || !W || !H) return;
      if (!cover) {
        cover = document.createElement('canvas');
        coverCtx = cover.getContext('2d');
      }
      cover.width = W;
      cover.height = H;
      const iw = dryImg.naturalWidth;
      const ih = dryImg.naturalHeight;
      const scale = Math.max(W / iw, H / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      coverCtx.clearRect(0, 0, W, H);
      coverCtx.drawImage(dryImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      radius = BRUSH_RADIUS * dpr;
      fitCover();
      // Promena veličine resetuje trag — stari trag pripada starom kadru.
      ctx.clearRect(0, 0, W, H);
    };

    dryImg.onload = () => {
      dryReady = true;
      fitCover();
    };
    dryImg.src = dry;

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // --- stanje kursora -----------------------------------------------------
    let px = -1;
    let py = -1;
    let hasLast = false;
    const queue = []; // tačke koje čekaju da budu iscrtane u sledećem frejmu
    let idle = 0;
    let running = false;
    let raf = 0;

    const brush = (x, y) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.82)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = () => {
      if (!dryReady) {
        raf = requestAnimationFrame(frame);
        return;
      }

      // 1) izjedi deo postojećeg traga
      // Kad korisnik miruje, ubrzavamo nestajanje: sa fiksnih 0.016 trag
      // asimptotski stoji na ~14% i tvrdi clearRect bi se video kao "trzaj".
      const fade = idle > 60 ? DECAY * 3.5 : DECAY;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, W, H);

      // 2) dodaj alfu tamo gde je kursor prošao
      ctx.globalCompositeOperation = 'source-over';
      if (queue.length) {
        for (const p of queue) brush(p.x, p.y);
        queue.length = 0;
        idle = 0;
      } else {
        idle += 1;
      }

      // 3) sva preostala alfa postaje SUVA hauba
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(cover, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      // 4) svetli prsten na aktivnoj četki — voda koju peškir gura ispred sebe.
      // Bez ovoga prelaz mokro/suvo je statična granica; ovako ima smer i
      // brzinu, pa se čita kao POTEZ a ne kao maska koja se pomera.
      // Gasi se kroz 20 frejmova mirovanja, da ne ostane svetla mrlja.
      const edge = Math.max(0, 1 - idle / 20);
      if (edge > 0.01) {
        const rg = ctx.createRadialGradient(px, py, radius * 0.7, px, py, radius * 1.04);
        rg.addColorStop(0, 'rgba(143,216,255,0)');
        rg.addColorStop(0.55, `rgba(186,232,255,${(0.17 * edge).toFixed(3)})`);
        rg.addColorStop(1, 'rgba(143,216,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(px, py, radius * 1.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      if (idle > IDLE_FRAMES) {
        // Trag je već skoro nevidljiv — obriši ga tvrdo i ugasi petlju.
        // Bez ovoga rAF radi zauvek i troši bateriju na prazno platno.
        ctx.clearRect(0, 0, W, H);
        running = false;
        hasLast = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (running) return;
      running = true;
      idle = 0;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr;
      const y = (e.clientY - r.top) * dpr;

      if (hasLast) {
        // Interpolacija: brz pokret miša daje retke tačke i trag bi bio
        // niz odvojenih krugova umesto poteza. Popunjavamo razmak.
        const dx = x - px;
        const dy = y - py;
        const dist = Math.hypot(dx, dy);
        const step = Math.max(radius * 0.3, 1);
        const n = Math.min(MAX_STEPS, Math.floor(dist / step));
        for (let i = 1; i <= n; i++) {
          queue.push({ x: px + (dx * i) / n, y: py + (dy * i) / n });
        }
      }
      queue.push({ x, y });
      px = x;
      py = y;
      hasLast = true;
      kick();
    };

    const onLeave = () => {
      hasLast = false; // ne povlači potez preko celog kadra kad se miš vrati
    };

    // Samo miš. Na dodiru ovog uopšte nema (LOW tier ide na video),
    // ali pointerType čuva slučaj hibridnog laptopa sa ekranom na dodir.
    const move = (e) => {
      if (e.pointerType === 'touch') return;
      onMove(e);
    };

    host.addEventListener('pointermove', move, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });

    // ZAKON 4.6 — tab u pozadini ne crta ništa.
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      dryImg.onload = null;
    };
  }, [dry, tier]);

  return (
    <div ref={hostRef} className={`${styles.host} ${className || ''}`}>
      {/* Osnovni sloj — MOKRO. Uvek vidljiv, i jedini sloj kad je reduced-motion. */}
      <img ref={imgRef} src={wet} alt="" className={styles.base} draggable={false} />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.grade} aria-hidden="true" />
      {children}
    </div>
  );
}
