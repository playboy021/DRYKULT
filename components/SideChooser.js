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

// Jedan oblak se crta JEDNOM u sprite pa se posle samo drawImage-uje.
// Trideset radijalnih gradijenata po frejmu preko celog ekrana bi bilo
// najskuplje mesto u celoj animaciji; keširani sprite je red veličine jeftiniji.
function oblakSprite(size, rgb) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const x = c.getContext('2d');
  const r = size / 2;
  const g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${rgb},0.42)`);
  g.addColorStop(0.35, `rgba(${rgb},0.2)`);
  g.addColorStop(0.7, `rgba(${rgb},0.06)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  return c;
}

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

    // --- polja koja se guraju -------------------------------------------------
    const spriteH = ctx ? oblakSprite(256, STRANE[HROM].rgb) : null;
    const spriteM = ctx ? oblakSprite(256, STRANE[MAMBA].rgb) : null;
    const brojOblaka = tier === LOW ? 8 : tier === MID ? 12 : 18;

    const oblaci = [];
    for (const strana of [-1, 1]) {
      for (let i = 0; i < brojOblaka; i++) {
        oblaci.push({
          strana, // -1 levo (HROM), +1 desno (MAMBA)
          y: (i + 0.5) / brojOblaka + (Math.random() - 0.5) * 0.06,
          faza: Math.random() * Math.PI * 2,
          brzina: 0.5 + Math.random() * 0.8,
          r: 0.22 + Math.random() * 0.26, // udeo visine ekrana
          dubina: Math.random(), // koliko daleko od granice stoji
        });
      }
    }

    // Varnice na samom sudaru — sitne, žive, u boji strane koja gura jače.
    const varnice = [];
    const sejVarnicu = () => {
      varnice.push({
        y: Math.random(),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 0.6,
        zivot: 0,
        trajanje: 0.5 + Math.random() * 0.9,
        r: 0.6 + Math.random() * 1.8,
        strana: Math.random() < 0.5 ? -1 : 1,
      });
    };

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

      // --- crtanje sudara ----------------------------------------------------
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#07080a';
      ctx.fillRect(0, 0, W, H);

      const x0 = poz * W;
      const uzbudjenje = naboj;
      const amp1 = H * (0.02 + uzbudjenje * 0.035);
      const amp2 = H * (0.035 + uzbudjenje * 0.055);
      const brzina = 1 + uzbudjenje * 2.2;

      // Oblaci se crtaju sa 'lighter' — gde se dva polja preklope, boja se
      // sabira i sudar sam od sebe postane najsvetlije mesto u kadru.
      ctx.globalCompositeOperation = 'lighter';
      for (const o of oblaci) {
        const k = o.y;
        const bx = granicaX(k, x0, amp1, amp2, brzina, uzbudjenje);

        // Oblaci ISPUNJAVAJU svoju teritoriju, ne skupljaju se uz granicu.
        // Prva verzija ih je kačila za granicu sa odmakom — kad se granica
        // pomeri levo, cela desna polovina ekrana ostajala je crna umesto da
        // je preplavi pobednička boja. Sad se `dubina` čita kao položaj
        // UNUTAR teritorije: 0 je uz sam sudar, 1 je uz ivicu ekrana.
        const teritorija = o.strana < 0 ? bx : W - bx;
        const talas = Math.sin(t * o.brzina + o.faza) * H * 0.04;
        const x = bx + o.strana * (teritorija * o.dubina + talas);
        const y = k * H + Math.cos(t * o.brzina * 0.7 + o.faza) * H * 0.045;

        const moc = o.strana < 0 ? lw : rw;
        const nabojStrane = o.strana < 0 ? nl : nr;
        // Poluprečnik prati širinu teritorije da pokrivenost ostane puna i
        // kad je strana potisnuta uz ivicu.
        const osnova = Math.max(teritorija * 0.55, H * 0.18);
        const r = o.r * 2 * osnova * (0.85 + 0.3 * Math.sin(t * o.brzina * 1.3 + o.faza));

        ctx.globalAlpha = (0.4 + moc * 0.5 + nabojStrane * 0.25) * 0.9;
        ctx.drawImage(o.strana < 0 ? spriteH : spriteM, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      // --- varnice na sudaru --------------------------------------------------
      if (!reduced) {
        const zeljeno = 18 + Math.round(uzbudjenje * 40);
        while (varnice.length < zeljeno) sejVarnicu();
        for (let i = varnice.length - 1; i >= 0; i--) {
          const v = varnice[i];
          v.zivot += dt;
          if (v.zivot > v.trajanje) {
            varnice.splice(i, 1);
            continue;
          }
          const p = v.zivot / v.trajanje;
          const bx = granicaX(v.y, x0, amp1, amp2, brzina, uzbudjenje);
          const x = bx + v.vx * p * H * (0.12 + uzbudjenje * 0.2);
          const y = v.y * H + v.vy * p * H * 0.1;
          const rgb = v.strana < 0 ? STRANE[HROM].rgb : STRANE[MAMBA].rgb;
          ctx.fillStyle = `rgba(${rgb},${((1 - p) * 0.9).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, v.r * dpr * (1 + uzbudjenje), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- sam sudar: uska vrela linija --------------------------------------
      // Nije ukrasna crta preko slike — to je mesto gde se dva polja dodiruju,
      // pa nosi obe boje i beli usijani spoj u sredini.
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

      // --- smirivanje sredine -------------------------------------------------
      // Naslov stoji preko sudara; bez ovoga ga svetlost polja pojede.
      ctx.globalCompositeOperation = 'source-over';
      const v = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.62);
      v.addColorStop(0, 'rgba(7,8,10,0.72)');
      v.addColorStop(0.55, 'rgba(7,8,10,0.35)');
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
