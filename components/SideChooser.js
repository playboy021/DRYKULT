import { useEffect, useRef } from 'react';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, HROM, MAMBA, peskirSlika, podlogaSlika } from '../lib/faction';
import { LOW, MID } from '../lib/device';
import styles from './SideChooser.module.css';

// HERO — "izaberi stranu".
//
// Obe polovine nose ISTU haubu; menja se samo boja svetla. Zato podela mora
// da izgleda kao granica NA jednoj površini, a ne kao spoj dve fotke:
// background-size 200% + position left/right znači da leva polovina prikazuje
// levu stranu iste slike, a desna desnu. Spoj se poklapa u piksel.
//
// IZBOR IDE BEZ KLIKA. Što se duže držiš jedne strane, to se njen naboj više
// puni; na 100% se sam okida lom. Klik i dalje radi kao brza prečica — ali
// punjenje je ono što nosi trenutak, jer odluka ima trajanje.
//
// Po tieru:
//   high — mokra ivica prati kursor, naboj se puni blizinom
//   mid  — ivica stoji na sredini, naboj se puni hover-om nad polovinom
//   low  — nema kursora: dve ploče, naboj se puni DRŽANJEM prsta

const NASLOV = ['Suvo je pravilo.', 'Trag je greška.'];

// Prag: koliko duboko u stranu treba ući da naboj počne da raste.
const PRAG = 0.3;
// Brzine su po SEKUNDI, ne po frejmu. Vezivanje za frejm je klasična zamka:
// na monitoru od 144Hz rAF okine 2.4 puta češće nego na 60Hz, pa bi se naboj
// tamo punio za 0.44s umesto za 1.05s — kod bi „radio" samo na ekranu na kom
// je pisan.
const PUNJENJE = 1 / 1.05; // pun naboj za ~1.05s držanja na samom kraju
const PRAZNJENJE = 1 / 0.42; // prazni se brže nego što se puni

export default function SideChooser({ tier, ready, izabrana, onIzbor, onNaboj }) {
  const hostRef = useRef(null);
  const cvRef = useRef(null);
  const lRef = useRef(null);
  const rRef = useRef(null);
  // Držanje prsta/dugmeta na polovini — koristi ga MID i LOW
  const drziRef = useRef(null);
  const pocetakRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cv = cvRef.current;
    const ctx = cv ? cv.getContext('2d') : null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const razmeri = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      if (cv) {
        cv.width = W;
        cv.height = H;
      }
    };
    razmeri();
    const ro = new ResizeObserver(razmeri);
    ro.observe(host);

    const prati = tier !== MID && tier !== LOW;
    let meta = 0.5;
    let poz = 0.5;
    let t = 0;
    let naboj = 0;
    let stranaNaboja = null;
    let raf = 0;
    let prosli = performance.now();
    let poslednjiKursor = { x: 0, y: 0 };

    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      meta = Math.max(0.16, Math.min(0.84, (e.clientX - r.left) / r.width));
      poslednjiKursor = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      meta = 0.5;
    };
    if (prati) {
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerleave', onLeave, { passive: true });
    }

    // Kapi koje klize niz mokru ivicu. Bez njih je granica samo linija;
    // sa njima se čita kao mesto gde se voda skuplja.
    const kapi = [];
    const sejKap = () => {
      kapi.push({ y: Math.random() * H, brzina: (0.4 + Math.random() * 1.4) * H * 0.0016, r: (1 + Math.random() * 2.6) * dpr, a: 0.35 + Math.random() * 0.5 });
    };
    for (let i = 0; i < 26; i++) sejKap();

    const frejm = (sada) => {
      // Ograničeno na 50ms: kad se tab vrati iz pozadine, prvi dt zna da bude
      // ogroman i naboj bi skočio na pun u jednom frejmu.
      const dt = Math.min(0.05, (sada - prosli) / 1000);
      prosli = sada;

      // --- pozicija ivice ----------------------------------------------------
      const cilj = izabrana === HROM ? 0.985 : izabrana === MAMBA ? 0.015 : meta;
      // Prigušenje vezano za vreme, ne za frejm — inače ivica na 144Hz
      // stiže do kursora osetno brže nego na 60Hz.
      poz += (cilj - poz) * (1 - Math.pow(0.0001, dt));
      if (!reduced) t += dt;

      // --- naboj -------------------------------------------------------------
      if (!izabrana) {
        let punjenjeStrane = null;
        let jacina = 0;

        if (drziRef.current) {
          // MID / LOW: drži se prst ili dugme
          punjenjeStrane = drziRef.current;
          jacina = 1;
        } else if (prati) {
          // HIGH: koliko duboko je kursor ušao u stranu
          if (poz < PRAG) {
            punjenjeStrane = HROM;
            jacina = (PRAG - poz) / PRAG;
          } else if (poz > 1 - PRAG) {
            punjenjeStrane = MAMBA;
            jacina = (poz - (1 - PRAG)) / PRAG;
          }
        }

        if (punjenjeStrane) {
          if (stranaNaboja !== punjenjeStrane) {
            stranaNaboja = punjenjeStrane;
            naboj = 0;
          }
          naboj = Math.min(1, naboj + jacina * PUNJENJE * dt);
        } else {
          naboj = Math.max(0, naboj - PRAZNJENJE * dt);
          if (naboj === 0) stranaNaboja = null;
        }

        if (naboj >= 1 && stranaNaboja) {
          // Napunjeno — okida se bez klika.
          const el = (stranaNaboja === HROM ? lRef : rRef).current;
          const r = el ? el.getBoundingClientRect() : null;
          onNaboj(stranaNaboja, {
            x: poslednjiKursor.x || (r ? r.left + r.width / 2 : window.innerWidth / 2),
            y: poslednjiKursor.y || (r ? r.top + r.height / 2 : window.innerHeight / 2),
          });
          naboj = 0;
          stranaNaboja = null;
        }
      }

      const nl = stranaNaboja === HROM ? naboj : 0;
      const nr = stranaNaboja === MAMBA ? naboj : 0;
      const lw = 1 - poz;
      const rw = poz;
      if (lRef.current) {
        lRef.current.style.setProperty('--w', lw.toFixed(3));
        lRef.current.style.setProperty('--naboj', nl.toFixed(3));
      }
      if (rRef.current) {
        rRef.current.style.setProperty('--w', rw.toFixed(3));
        rRef.current.style.setProperty('--naboj', nr.toFixed(3));
      }

      // --- ivica -------------------------------------------------------------
      if (ctx) {
        ctx.clearRect(0, 0, W, H);
        const x0 = poz * W;

        // Strana koja gubi TONE U CRNO — ne samo da tamni, povlači se.
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

        // Amplituda i frekvencija RASTU sa nabojem — voda počinje da ključa
        // kako se odluka bliži. To je jedini deo animacije koji korisnik
        // vidi kao "nešto se sprema", a da mu niko nije rekao.
        const uzbudjenje = naboj;
        const amp1 = H * (0.018 + uzbudjenje * 0.03);
        const amp2 = H * (0.03 + uzbudjenje * 0.05);
        const brzina = 1 + uzbudjenje * 2.4;

        const putanja = (pomeraj) => {
          ctx.beginPath();
          for (let y = 0; y <= H; y += 4) {
            const k = y / H;
            const x =
              x0 +
              pomeraj +
              Math.sin(k * 7.5 + t * 1.6 * brzina) * amp1 +
              Math.sin(k * 3.1 - t * 1.05 * brzina) * amp2 +
              Math.sin(k * 19 + t * 3.2 * brzina) * amp1 * uzbudjenje * 0.5;
            if (y === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        };

        // Hromatski rascep: koralna levo od jezgra, zelena desno.
        // Ivica time NOSI obe boje umesto da bude neutralna bela crta —
        // granica je doslovno mesto gde se dve frakcije dodiruju.
        const razmak = (3 + uzbudjenje * 7) * dpr;
        ctx.lineWidth = (2.5 + uzbudjenje * 2) * dpr;

        ctx.strokeStyle = `rgba(255,110,128,${(0.55 + uzbudjenje * 0.4).toFixed(3)})`;
        ctx.shadowBlur = (14 + uzbudjenje * 26) * dpr;
        ctx.shadowColor = 'rgba(255,110,128,0.9)';
        putanja(-razmak);
        ctx.stroke();

        ctx.strokeStyle = `rgba(140,239,46,${(0.55 + uzbudjenje * 0.4).toFixed(3)})`;
        ctx.shadowColor = 'rgba(140,239,46,0.9)';
        putanja(razmak);
        ctx.stroke();

        // Jezgro — belo i usko, drži liniju čitljivom preko obe boje
        ctx.strokeStyle = `rgba(255,255,255,${(0.7 + uzbudjenje * 0.3).toFixed(3)})`;
        ctx.lineWidth = (1.2 + uzbudjenje * 1.2) * dpr;
        ctx.shadowBlur = (8 + uzbudjenje * 14) * dpr;
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        putanja(0);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Kapi klize niz ivicu, obojene stranom ka kojoj su bliže
        for (const kap of kapi) {
          kap.y += kap.brzina * (1 + uzbudjenje * 2.5) * dt * 60;
          if (kap.y > H) {
            kap.y = -10;
            kap.r = (1 + Math.random() * 2.6) * dpr;
          }
          const k = kap.y / H;
          const kx =
            x0 +
            Math.sin(k * 7.5 + t * 1.6 * brzina) * amp1 +
            Math.sin(k * 3.1 - t * 1.05 * brzina) * amp2;
          const boja = lw > rw ? '255,110,128' : '140,239,46';
          ctx.fillStyle = `rgba(${boja},${(kap.a * (0.5 + uzbudjenje * 0.5)).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(kx, kap.y, kap.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

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
  }, [tier, izabrana, onNaboj]);

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
        style={{ '--slika': `url('${podlogaSlika(id, tier)}')` }}
        onClick={(e) => {
          // Ako je naboj već okinuo izbor, klik koji stigne posle otpuštanja
          // prsta bi ga potvrdio DRUGI put i lom bi krenuo dvaput.
          if (izabrana) return;
          onIzbor(id, { x: e.clientX, y: e.clientY });
        }}
        onPointerDown={(e) => {
          drziRef.current = id;
          pocetakRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          // Na telefonu je prevlačenje preko ploče SKROL, ne držanje.
          // Bez ovoga bi svako skrolovanje preko hero-a punilo naboj i
          // posle sekunde te samo prebacilo na stranu koju nisi birao.
          const p = pocetakRef.current;
          if (!p || !drziRef.current) return;
          if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 12) {
            drziRef.current = null;
          }
        }}
        onPointerUp={() => {
          drziRef.current = null;
        }}
        onPointerLeave={() => {
          drziRef.current = null;
        }}
        onPointerCancel={() => {
          drziRef.current = null;
        }}
        aria-pressed={aktivna}
      >
        <img
          className={styles.towel}
          src={peskirSlika(id, tier, tier === LOW ? 'sm' : 'md')}
          alt={`DRYKULT peškir — strana ${s.ime}`}
          draggable={false}
        />
        <span className={styles.ime} style={{ color: s.bright }}>
          {s.ime}
        </span>
        <span className={styles.podnaslov}>{s.boja}</span>
        {/* Traka naboja — jedina stvar koja korisniku kaže da se nešto puni */}
        <span className={styles.naboj} aria-hidden="true">
          <span className={styles.naboji} style={{ background: s.core }} />
        </span>
      </button>
    );
  };

  return (
    <section ref={hostRef} className={`${styles.hero} ${tier === LOW ? styles.stack : ''}`}>
      <div
        className={`${styles.plate} ${styles.pl}`}
        style={{ '--slika': `url('${podlogaSlika(HROM, tier)}')` }}
        aria-hidden="true"
      />
      <div
        className={`${styles.plate} ${styles.pr}`}
        style={{ '--slika': `url('${podlogaSlika(MAMBA, tier)}')` }}
        aria-hidden="true"
      />
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
          text={
            tier === LOW
              ? 'Drži prst na svojoj strani dok se ne napuni. Ili je jednostavno tapni.'
              : 'Zadrži se na svojoj strani dok se ne napuni. Ili je jednostavno klikni.'
          }
          className={styles.sub}
          ready={ready}
          stagger={30}
          delay={820}
        />

        <RevealFade className={styles.trust} ready={ready} delay={1240}>
          <span className={styles.markets}>RS · BA · ME</span>
          <span className={styles.sep} aria-hidden="true" />
          <span>90 × 70 cm · 850 GSM · twisted-loop</span>
        </RevealFade>
      </div>
    </section>
  );
}
