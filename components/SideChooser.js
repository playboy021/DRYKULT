import { useEffect, useRef } from 'react';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, HROM, MAMBA, peskirSlika } from '../lib/faction';
import { LOW, MID } from '../lib/device';
import styles from './SideChooser.module.css';

// HERO — "izaberi stranu".
//
// Pozadina NIJE slika sa linijom preko nje. Pozadina JESTE sudar dve boje:
// dva polja koja se guraju, a granica je mesto gde se dodiruju. Ranije je
// ovde stajala fotografija mokre haube sa dijagonalnom neonskom prugom, pa
// se ta pruga tukla sa vertikalnom podelom — dve linije na različite strane,
// ništa nije pratilo ništa. Fotografija se vraća kad se snimi pravi materijal.
//
// IZBOR IDE BEZ KLIKA. Što se duže držiš jedne strane, to se njen naboj više
// puni; na 100% se sam okida lom. Klik i dalje radi kao brza prečica — ali
// punjenje je ono što nosi trenutak, jer odluka ima trajanje.
//
// Po tieru:
//   high — granica prati kursor, oba polja žive
//   mid  — granica na sredini, naboj se puni hover-om nad polovinom
//   low  — nema kursora: dve ploče, naboj se puni DRŽANJEM prsta

const NASLOV = ['Suvo je pravilo.', 'Trag je greška.'];

const PRAG = 0.3;
// Brzine su po SEKUNDI, ne po frejmu (ZAKON 4.8).
const PUNJENJE = 1 / 1.05;
const PRAZNJENJE = 1 / 0.42;

export default function SideChooser({ tier, ready, izabrana, onIzbor, onNaboj }) {
  const hostRef = useRef(null);
  const cvRef = useRef(null);
  const lRef = useRef(null);
  const rRef = useRef(null);
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

    // Kapi koje klize niz šav — jedini pokret u pozadini pored samog šava.
    const kapi = [];
    for (let i = 0; i < (tier === LOW ? 10 : 22); i++) {
      kapi.push({
        y: Math.random(),
        brzina: 0.03 + Math.random() * 0.12,
        r: 0.6 + Math.random() * 1.8,
        a: 0.3 + Math.random() * 0.5,
      });
    }

    // Granica: dva sinusa različitih frekvencija. Jedan izgleda mehanički
    // kao talas iz udžbenika; dva daju nepravilnost tečnosti.
    const granicaX = (k, x0, amp1, amp2, brzina, uzbudjenje) =>
      x0 +
      Math.sin(k * 7.5 + t * 1.6 * brzina) * amp1 +
      Math.sin(k * 3.1 - t * 1.05 * brzina) * amp2 +
      Math.sin(k * 19 + t * 3.2 * brzina) * amp1 * uzbudjenje * 0.5;

    const frejm = (sada) => {
      // Ograničeno na 50ms: kad se tab vrati iz pozadine, prvi dt zna da bude
      // ogroman i naboj bi skočio na pun u jednom frejmu.
      const dt = Math.min(0.05, (sada - prosli) / 1000);
      prosli = sada;

      // `poz` je GRANICA (udeo ekrana koji drži HROM), a ne pozicija kursora.
      // Mapiranje je obrnuto — `1 - meta` — jer kursor GURA granicu od sebe:
      // stojiš duboko u svojoj strani i ona raste. Sa direktnim mapiranjem
      // se dešavalo suprotno: pomeriš miša levo, a zeleno preplavi ekran.
      const cilj = izabrana === HROM ? 0.985 : izabrana === MAMBA ? 0.015 : 1 - meta;
      poz += (cilj - poz) * (1 - Math.pow(0.0001, dt));
      if (!reduced) t += dt;

      // --- naboj -------------------------------------------------------------
      if (!izabrana) {
        let punjenjeStrane = null;
        let jacina = 0;

        if (drziRef.current) {
          punjenjeStrane = drziRef.current;
          jacina = 1;
        } else if (prati) {
          // Naboj se puni po KURSORU, ne po granici — granica kasni za
          // kursorom (opruga), pa bi punjenje inače kasnilo za pokretom.
          if (meta < PRAG) {
            punjenjeStrane = HROM;
            jacina = (PRAG - meta) / PRAG;
          } else if (meta > 1 - PRAG) {
            punjenjeStrane = MAMBA;
            jacina = (meta - (1 - PRAG)) / PRAG;
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

      // Moć strane = širina njene teritorije. HROM drži 0..poz, MAMBA poz..1.
      const lw = poz;
      const rw = 1 - poz;
      const nl = stranaNaboja === HROM ? naboj : 0;
      const nr = stranaNaboja === MAMBA ? naboj : 0;
      if (lRef.current) {
        lRef.current.style.setProperty('--w', lw.toFixed(3));
        lRef.current.style.setProperty('--naboj', nl.toFixed(3));
      }
      if (rRef.current) {
        rRef.current.style.setProperty('--w', rw.toFixed(3));
        rRef.current.style.setProperty('--naboj', nr.toFixed(3));
      }

      if (!ctx) {
        raf = requestAnimationFrame(frejm);
        return;
      }

      // --- crtanje ------------------------------------------------------------
      // Pozadina je ČISTA CRNA. Dva pokušaja su otpala: fotografija mokre haube
      // (imala je svoju dijagonalnu prugu koja se tukla sa podelom) i polja
      // oblaka u boji (previše šuma iza proizvoda). Ostaje samo šav između dve
      // strane i blag sjaj koji iz njega curi. Peškir je jedina slika u kadru,
      // a to je i cela poenta crne tkanine sa neonskim rubom.
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);

      const x0 = poz * W;
      const uzbudjenje = naboj;
      const amp1 = H * (0.02 + uzbudjenje * 0.035);
      const amp2 = H * (0.035 + uzbudjenje * 0.055);
      const brzina = 1 + uzbudjenje * 2.2;

      // Sjaj koji curi iz šava — jedina boja u pozadini, i to uska.
      const sirina = H * (0.14 + uzbudjenje * 0.2);
      const gl = ctx.createLinearGradient(x0 - sirina, 0, x0, 0);
      gl.addColorStop(0, `rgba(${STRANE[HROM].rgb},0)`);
      gl.addColorStop(1, `rgba(${STRANE[HROM].rgb},${(0.07 + lw * 0.1 + nl * 0.2).toFixed(3)})`);
      ctx.fillStyle = gl;
      ctx.fillRect(x0 - sirina, 0, sirina, H);

      const gr = ctx.createLinearGradient(x0 + sirina, 0, x0, 0);
      gr.addColorStop(0, `rgba(${STRANE[MAMBA].rgb},0)`);
      gr.addColorStop(1, `rgba(${STRANE[MAMBA].rgb},${(0.07 + rw * 0.1 + nr * 0.2).toFixed(3)})`);
      ctx.fillStyle = gr;
      ctx.fillRect(x0, 0, sirina, H);

      // Kapi klize niz šav — jedini pokret pored samog šava.
      if (!reduced) {
        for (const kap of kapi) {
          kap.y += kap.brzina * dt * (1 + uzbudjenje * 2);
          if (kap.y > 1.05) kap.y = -0.05;
          const kx = granicaX(kap.y, x0, amp1, amp2, brzina, uzbudjenje);
          const boja = lw > rw ? STRANE[HROM].rgb : STRANE[MAMBA].rgb;
          ctx.fillStyle = `rgba(${boja},${(kap.a * (0.4 + uzbudjenje * 0.6)).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(kx, kap.y * H, kap.r * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- šav ----------------------------------------------------------------
      // Mesto gde se dve strane dodiruju: nosi obe boje i beli usijani spoj.
      ctx.lineCap = 'round';
      const putanja = (pomeraj) => {
        ctx.beginPath();
        for (let y = 0; y <= H; y += 6) {
          const x = granicaX(y / H, x0, amp1, amp2, brzina, uzbudjenje) + pomeraj;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      };
      const razmak = (4 + uzbudjenje * 9) * dpr;
      ctx.lineWidth = (3 + uzbudjenje * 3) * dpr;
      ctx.strokeStyle = `rgba(${STRANE[HROM].rgb},${(0.4 + uzbudjenje * 0.5).toFixed(3)})`;
      putanja(-razmak);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${STRANE[MAMBA].rgb},${(0.4 + uzbudjenje * 0.5).toFixed(3)})`;
      putanja(razmak);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255,255,255,${(0.5 + uzbudjenje * 0.45).toFixed(3)})`;
      ctx.lineWidth = (1 + uzbudjenje * 1.4) * dpr;
      putanja(0);
      ctx.stroke();

      // Naslov stoji tačno preko šava, pa mu treba mirna podloga — ali samo
      // uska traka oko sredine, ne vinjeta preko celog kadra.
      const v = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.4);
      v.addColorStop(0, 'rgba(7,8,10,0.72)');
      v.addColorStop(1, 'rgba(7,8,10,0)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(frejm);
    };
    raf = requestAnimationFrame(frejm);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        prosli = performance.now();
        raf = requestAnimationFrame(frejm);
      }
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
          const p = pocetakRef.current;
          if (!p || !drziRef.current) return;
          if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 12) drziRef.current = null;
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
        <span className={styles.naboj} aria-hidden="true">
          <span className={styles.naboji} style={{ background: s.core }} />
        </span>
      </button>
    );
  };

  return (
    <section ref={hostRef} className={`${styles.hero} ${tier === LOW ? styles.stack : ''}`}>
      <canvas ref={cvRef} className={styles.cv} aria-hidden="true" />

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
