import { useEffect, useRef, useState } from 'react';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, HROM, MAMBA, peskirSlika } from '../lib/faction';
import { LOW, MID, uskiRaspored, imaPokazivac } from '../lib/device';
import styles from './SideChooser.module.css';

// HERO — "izaberi stranu".
//
// Pozadina je POLJE ČESTICA koje teku po strujnom polju i ostavljaju tragove.
// Dve struje: koralna nadire sleva, zelena zdesna, i sudaraju se po šavu.
// Trag se ne pravi crtanjem linija nego tako što se platno svaki frejm
// PRETAPA tankim slojem crne umesto da se briše — čestice tako same iscrtaju
// dim. To je i najjeftinija tehnika: hiljadu tačaka po frejmu, bez gradijenata.
//
// Do ovoga se stiglo kroz dva odbačena pokušaja: fotografija mokre haube
// (imala je svoju dijagonalnu prugu koja se tukla sa podelom) i polja oblaka
// u boji (previše mrtvog šuma iza proizvoda).
//
// IZBOR IDE BEZ KLIKA. Što se duže držiš jedne strane, to se njen naboj više
// puni; na 100% se sam okida lom. Klik radi kao prečica.

const NASLOV = ['Suvo je pravilo.', 'Trag je greška.'];

const PRAG = 0.3;
// Brzine su po SEKUNDI, ne po frejmu (ZAKON 4.8).
const PUNJENJE = 1 / 1.05;
const PRAZNJENJE = 1 / 0.42;

const CESTICA = { [LOW]: 260, [MID]: 550, high: 900 };

// Vrednosti su podešene kroz offline render (Node + canvas), jer se trag
// gradi tek kroz stotine frejmova pa se na jednom kadru ne vidi ništa.
// Prve dve verzije su bile promašaj i vredi znati zašto:
//   - pretapanje 0.085 i sjaj ~0.35 → sve pretamno, tragovi se pojedu
//   - čestice raštrkane po celoj teritoriji → sredina prazna, ivice zgusnute
// Vitice se zato drže UZ ŠAV: tamo je sudar, a ostatak kadra ostaje crn —
// isto kao na referenci, gde dim stoji oko proizvoda a ne preko celog ekrana.
const TOK = {
  pretapanje: 0.028, // niže = duži trag
  brzina: 0.11, // udeo visine ekrana po sekundi
  nosi: 0.45, // koliko se vuče ka šavu
  sjaj: 0.9,
  poluprecnik: [1.0, 2.6],
  trajanje: [6, 11],
  kovitlac: 2.4,
  pojas: 0.24, // koliko široko oko šava čestice žive
};

export default function SideChooser({ tier, ready, izabrana, onIzbor, onNaboj }) {
  const hostRef = useRef(null);
  const cvRef = useRef(null);
  const lRef = useRef(null);
  const rRef = useRef(null);
  const drziRef = useRef(null);
  const pocetakRef = useRef(null);

  // RASPORED ne zavisi od tiera. Desktop na sporoj vezi je `low` tier, ali
  // i dalje ima miša i dve kolone — dok je ovo bilo spojeno, takav korisnik
  // je dobijao mobilni raspored i sajt je izgledao pokvareno.
  const [uski, setUski] = useState(false);

  useEffect(() => {
    const proveri = () => setUski(uskiRaspored());
    proveri();
    window.addEventListener('resize', proveri, { passive: true });
    return () => window.removeEventListener('resize', proveri);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const cv = cvRef.current;
    if (!host || !cv) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Praćenje kursora zavisi od POKAZIVAČA, ne od tiera.
    const prati = imaPokazivac() && !uski;

    let W = 0;
    let H = 0;
    let cestice = [];

    const zasej = () => {
      const n = CESTICA[tier] || CESTICA.high;
      cestice = [];
      for (let i = 0; i < n; i++) {
        const strana = i % 2 === 0 ? -1 : 1;
        cestice.push({
          strana,
          x: W * 0.5 + strana * (0.02 + Math.random() * TOK.pojas) * W,
          y: Math.random() * H,
          zivot: Math.random(),
          trajanje: TOK.trajanje[0] + Math.random() * (TOK.trajanje[1] - TOK.trajanje[0]),
          brzina: 0.6 + Math.random() * 0.9,
          r: (TOK.poluprecnik[0] + Math.random() * (TOK.poluprecnik[1] - TOK.poluprecnik[0])) * dpr,
        });
      }
    };

    const razmeri = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      cv.width = W;
      cv.height = H;
      // Čita se --bg umesto da se upisuje broj: platno tako ne može da se
      // razmimoiđe sa podlogom kad frakcija promeni pozadinu.
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#07080a';
      ctx.fillRect(0, 0, W, H);
      zasej();
    };
    razmeri();
    const ro = new ResizeObserver(razmeri);
    ro.observe(host);

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

    // Šav: dva sinusa različitih frekvencija. Jedan izgleda mehanički kao
    // talas iz udžbenika; dva daju nepravilnost tečnosti.
    const savX = (k, x0, amp, brz) =>
      x0 + Math.sin(k * 7.5 + t * 1.6 * brz) * amp + Math.sin(k * 3.1 - t * 1.05 * brz) * amp * 1.7;

    // Strujno polje. Nije prava Perlin buka nego zbir tri sinusa — na oko se
    // ne razlikuje, a nema ni tabele ni biblioteke.
    const ugao = (x, y) =>
      (Math.sin(x * 0.0016 + t * 0.2) +
        Math.cos(y * 0.0019 - t * 0.16) +
        Math.sin((x - y) * 0.0009 + t * 0.26)) *
      TOK.kovitlac;

    const frejm = (sada) => {
      const dt = Math.min(0.05, (sada - prosli) / 1000);
      prosli = sada;

      // `poz` je GRANICA (udeo ekrana koji drži HROM). Mapiranje je obrnuto —
      // `1 - meta` — jer kursor GURA granicu od sebe: stojiš duboko u svojoj
      // strani i ona raste.
      const cilj = izabrana === HROM ? 0.985 : izabrana === MAMBA ? 0.015 : 1 - meta;
      poz += (cilj - poz) * (1 - Math.pow(0.0001, dt));
      if (!reduced) t += dt;

      // --- naboj -------------------------------------------------------------
      if (!izabrana) {
        let strana = null;
        let jacina = 0;
        if (drziRef.current) {
          strana = drziRef.current;
          jacina = 1;
        } else if (prati) {
          // Puni se po KURSORU, ne po granici — granica kasni za kursorom.
          if (meta < PRAG) {
            strana = HROM;
            jacina = (PRAG - meta) / PRAG;
          } else if (meta > 1 - PRAG) {
            strana = MAMBA;
            jacina = (meta - (1 - PRAG)) / PRAG;
          }
        }
        if (strana) {
          if (stranaNaboja !== strana) {
            stranaNaboja = strana;
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

      // --- pretapanje umesto brisanja -----------------------------------------
      // Ovo je cela tajna dima: platno se ne briše nego se preko njega prelije
      // tanak sloj podloge. Ono što je bilo pre par frejmova još je tu, samo
      // tamnije — pa čestica sama za sobom ostavi trag bez ijedne nacrtane linije.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(7,8,10,${TOK.pretapanje})`;
      ctx.fillRect(0, 0, W, H);

      const uzb = naboj;
      const x0 = poz * W;
      const amp = H * (0.02 + uzb * 0.03);
      const brz = 1 + uzb * 2;

      ctx.globalCompositeOperation = 'lighter';
      for (const c of cestice) {
        c.zivot += dt / c.trajanje;
        const sx = savX(c.y / H, x0, amp, brz);

        if (c.zivot >= 1) {
          // Rađa se UZ ŠAV, na svojoj strani. Raštrkane po celoj teritoriji
          // su ostavljale sredinu praznu, a ivice zgusnute.
          c.zivot = 0;
          c.y = Math.random() * H;
          c.x = sx + c.strana * (0.02 + Math.random() * TOK.pojas) * W;
        }

        const a = ugao(c.x, c.y);
        const dosav = Math.sign(sx - c.x);
        const moc = c.strana < 0 ? lw : rw;
        const nab = c.strana < 0 ? nl : nr;
        const v = c.brzina * H * TOK.brzina * (0.7 + moc * 0.5 + nab * 0.6) * (1 + uzb * 0.6);

        c.x += (Math.cos(a) + dosav * TOK.nosi) * v * dt;
        c.y += Math.sin(a) * v * dt;

        if (c.y < -10) c.y = H + 10;
        else if (c.y > H + 10) c.y = -10;

        // Prešla je šav — pojede je suprotna struja. Isto i ako izađe iz kadra.
        if ((c.strana < 0 && c.x > sx) || (c.strana > 0 && c.x < sx)) {
          c.zivot = 1;
          continue;
        }
        if (c.x < -20 || c.x > W + 20) {
          c.zivot = 1;
          continue;
        }

        const rgb = c.strana < 0 ? STRANE[HROM].rgb : STRANE[MAMBA].rgb;
        // Najsvetlije uz sam šav — tamo je pritisak najveći.
        const blizina = Math.min(1, Math.abs(sx - c.x) / (W * (TOK.pojas + 0.02)));
        const sjaj = (TOK.sjaj + (1 - blizina) * 0.45) * (0.5 + moc * 0.35 + nab * 0.5);
        const izlaz = Math.sin(c.zivot * Math.PI); // tiho se pojavi i tiho nestane
        ctx.fillStyle = `rgba(${rgb},${(sjaj * izlaz).toFixed(3)})`;
        ctx.fillRect(c.x, c.y, c.r, c.r);
      }

      ctx.globalCompositeOperation = 'source-over';

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
  }, [tier, izabrana, onNaboj, uski]);

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
          // Naboj je možda već okinuo izbor; klik posle otpuštanja bi ga
          // potvrdio drugi put i lom bi krenuo dvaput.
          if (izabrana) return;
          onIzbor(id, { x: e.clientX, y: e.clientY });
        }}
        onPointerDown={(e) => {
          drziRef.current = id;
          pocetakRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          // Prevlačenje preko ploče je SKROL, ne držanje.
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
          src={peskirSlika(id, tier, uski ? 'sm' : 'md')}
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
    <section ref={hostRef} className={`${styles.hero} ${uski ? styles.stack : ''}`}>
      <canvas ref={cvRef} className={styles.cv} aria-hidden="true" />
      <div className={styles.smiraj} aria-hidden="true" />

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
            uski
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
