import { useEffect, useRef } from 'react';
import { stopScroll, startScroll } from '../lib/scrollLock';
import { LOW, MID } from '../lib/device';
import { STRANE } from '../lib/faction';
import styles from './WetTransition.module.css';

// MOKRI PRELAZ — klik na "Poruči" pretvara ceo ekran u mokro staklo,
// pa peškir prebriše zdesna nalevo i iza njega ostaje sekcija za poručivanje.
//
// Tri faze:
//   SPRAY  0-450ms    kapljice niču od tačke klika ka ivicama, iza njih
//                     stranica ide u neoštrinu (kao gledanje kroz mokro staklo)
//   WIPE   450-1750   peškir prelazi, iza njega je čisto
//   SETTLE 1750-2050  ostatak izbledi
//
// Trik koji ovo drži jednostavnim: skok na odredište se dešava POD vodom.
// Kad kapljice i zamagljenje prekriju ekran, skrol se prebaci trenutno na
// #poruci. Peškir posle ne "otkriva novu stranicu" — on briše veo sa nje.
// Vizuelno je isto, a nema dupliranja sekcije ni sinhronizacije dva DOM stabla.

const SPRAY_END = 450;
const WIPE_END = 1750;
const TOTAL = 2050;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Jedna kap se crta JEDNOM u sprite, pa se posle samo drawImage-uje.
// Sa 500 kapi po frejmu, tri gradijenta svaka bila bi 1500 fill-ova —
// drawImage keširanog sprite-a je red veličine jeftiniji.
function makeDropSprite(size, rgb) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const x = c.getContext('2d');
  const r = size / 2;

  // Obrub i odsjaj su NAMERNO slabi. Sa jačim vrednostima kap prestaje da
  // liči na vodu i postaje mehur sapunice — ista greška je već napravljena
  // na hero slikama, pa su ovde brojevi odmah prigušeni.
  const sh = x.createRadialGradient(r + r * 0.18, r + r * 0.22, 0, r, r, r);
  sh.addColorStop(0, 'rgba(0,6,16,0.22)');
  sh.addColorStop(1, 'rgba(0,6,16,0)');
  x.fillStyle = sh;
  x.fillRect(0, 0, size, size);

  // Obod nosi boju frakcije — kap je i dalje voda, ali osvetljena njenim neonom.
  const body = x.createRadialGradient(r, r, 0, r, r, r * 0.92);
  body.addColorStop(0, `rgba(${rgb},0.04)`);
  body.addColorStop(0.66, `rgba(${rgb},0.08)`);
  body.addColorStop(0.9, `rgba(${rgb},0.34)`);
  body.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = body;
  x.beginPath();
  x.arc(r, r, r * 0.92, 0, Math.PI * 2);
  x.fill();

  const sp = x.createRadialGradient(r - r * 0.3, r - r * 0.34, 0, r - r * 0.3, r - r * 0.34, r * 0.38);
  sp.addColorStop(0, 'rgba(255,255,255,0.5)');
  sp.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = sp;
  x.beginPath();
  x.arc(r - r * 0.3, r - r * 0.34, r * 0.38, 0, Math.PI * 2);
  x.fill();

  return c;
}

// Swoosh se SINTETIŠE, ne učitava: filtrirani šum sa kovertom zvuči kao
// prevlačenje tkanine, a ne košta nijedan bajt mreže.
// Klik je korisnički gest, pa je ovo jedini trenutak kad browser sme da pusti
// zvuk (ZAKON 4.5 — skrol se ne računa, klik da).
function playSwoosh(ton) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const dur = 1.1;
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    // Prelaz frekvencije naniže = utisak da nešto prolazi pored uha.
    // Opseg dolazi iz frakcije: HROM viši i staklast, MAMBA niži i oštriji.
    bp.frequency.setValueAtTime(ton.od, ac.currentTime);
    bp.frequency.exponentialRampToValueAtTime(ton.do, ac.currentTime + dur);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.13, ac.currentTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);

    src.connect(bp).connect(gain).connect(ac.destination);
    src.start();
    src.stop(ac.currentTime + dur);
    src.onended = () => ac.close();
  } catch {
    /* zvuk je ukras — ako padne, prelaz i dalje radi */
  }
}

export default function WetTransition({ active, origin, targetId, tier, side, onDone }) {
  const hostRef = useRef(null);
  const dropsRef = useRef(null);
  const towelRef = useRef(null);
  const veilRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const host = hostRef.current;
    const drops = dropsRef.current;
    const towelC = towelRef.current;
    const veil = veilRef.current;
    if (!host || !drops || !towelC || !veil) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Brava se mora otpustiti TAČNO jednom. Bez ove zastavice se startScroll
    // pozove i na kraju animacije i u cleanup-u, pa drugi poziv otpusti tuđu
    // bravu (loader) i skrol se odblokira pre vremena.
    let locked = false;
    const lock = () => {
      if (locked) return;
      locked = true;
      stopScroll();
    };
    const unlock = () => {
      if (!locked) return;
      locked = false;
      startScroll();
    };

    const jumpTo = () => {
      const el = document.getElementById(targetId);
      if (!el) return;
      // Skrol se mora NAKRATKO otključati da bi skok uopšte prošao:
      // stopScroll postavlja html{overflow:hidden}, a tada element nije
      // skrolabilan pa ni programski scrollTop ne radi. Traje jedan frejm
      // i dešava se pod vodom, tako da se ne vidi.
      const bilo = locked;
      if (bilo) unlock();
      if (window.__lenis) window.__lenis.scrollTo(el, { immediate: true, force: true });
      else el.scrollIntoView({ behavior: 'auto' });
      if (bilo) lock();
    };

    // ZAKON 4.6 — bez pokreta nema predstave. Samo skoči i gotovo.
    if (reduced) {
      jumpTo();
      onDone?.();
      return;
    }

    // Pre izbora strane sprej je neutralno beo — nijedna frakcija se ne gura.
    const f = side ? STRANE[side] : null;
    const rgb = f ? f.rgb : '226,238,246';
    const ton = f ? f.zvuk : { od: 2600, do: 420 };

    lock();
    playSwoosh(ton);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(window.innerWidth * dpr);
    const H = Math.round(window.innerHeight * dpr);
    for (const c of [drops, towelC]) {
      c.width = W;
      c.height = H;
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
    }
    const dctx = drops.getContext('2d');
    const tctx = towelC.getContext('2d');

    // backdrop-filter preko celog ekrana je na telefonu najskuplja stavka
    // u ovoj animaciji — GPU ga preračunava svaki frejm. Na LOW tieru ide
    // upola slabije zamućenje; utisak mokrog stakla drže kapljice, ne blur.
    veil.style.setProperty('--maxblur', tier === LOW ? '0.4rem' : '0.75rem');

    const sprite = makeDropSprite(96, rgb);

    // Kapi se rađaju u TALASU od tačke klika: kašnjenje svake je srazmerno
    // udaljenosti. Bez toga se ekran popuni odjednom i nema osećaja izvora.
    // Više i SITNIJIH kapi. Krupne su izgledale kao sapunica koja lebdi
    // ispred ekrana; voda na staklu je gusta i sitna, sa par većih slivova.
    //
    // LOW ide na 380, ne na proporcionalnih ~250. Telefonski ekran ima manje
    // površine, pa ista gustina po pikselu deluje prazno — na malom kadru se
    // svaka kap gleda izbliza. Trošak je zanemarljiv: kapi su keširani
    // sprite-ovi, skupo je zamućenje, a njega smo već prepolovili za LOW.
    const count = tier === LOW ? 380 : tier === MID ? 500 : 950;
    const ox = (origin?.x ?? window.innerWidth / 2) * dpr;
    const oy = (origin?.y ?? window.innerHeight / 2) * dpr;
    const maxDist = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));

    const parts = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const dist = Math.hypot(x - ox, y - oy);
      parts.push({
        x,
        y,
        // Eksponent 3 gura raspodelu ka sitnom: mnogo perli, malo krupnih.
        r: (1.4 + Math.pow(Math.random(), 3) * 10) * dpr,
        delay: (dist / maxDist) * SPRAY_END * 0.85 + Math.random() * 70,
        // Krupnije kapi klize nadole — sitne se drže za staklo
        vy: Math.random() < 0.22 ? (10 + Math.random() * 40) * dpr : 0,
      });
    }

    const towel = new Image();
    let towelReady = false;
    towel.onload = () => {
      towelReady = true;
    };
    towel.src = '/megaz/towel-sweep.png';

    let jumped = false;
    let raf = 0;
    const t0 = performance.now();

    const frame = (now) => {
      const t = now - t0;

      // --- veo: mokro staklo -------------------------------------------------
      const veilIn = Math.min(1, t / (SPRAY_END * 0.8));
      veil.style.setProperty('--veil', easeOutCubic(veilIn).toFixed(3));

      // --- kapljice ----------------------------------------------------------
      dctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        const age = t - p.delay;
        if (age <= 0) continue;
        const grow = Math.min(1, age / 220);
        const r = p.r * easeOutCubic(grow);
        const slide = p.vy * (age / 1000);
        const s = r * 2;
        dctx.drawImage(sprite, p.x - r, p.y - r + slide, s, s);
      }

      // --- peškir ------------------------------------------------------------
      tctx.clearRect(0, 0, W, H);
      let wipe = 0;
      if (t >= SPRAY_END) {
        wipe = Math.min(1, (t - SPRAY_END) / (WIPE_END - SPRAY_END));
        const e = easeInOutCubic(wipe);

        // Skok na odredište se dešava POD vodom — ekran je tad prekriven.
        if (!jumped && e > 0.04) {
          jumped = true;
          jumpTo();
        }

        // 1.05, ne 1.22: na 1.22 je peškir pokrivao 84% širine ekrana i
        // čitao se kao plava zavesa, ne kao krpa. Nagib dopunjava visinu
        // koju smo izgubili, pa rez preko pune visine i dalje ima pokriće.
        const th = H * 1.05;
        const aspect = towelReady ? towel.width / towel.height : 1.2;

        // Širina se OGRANIČAVA na 1.3 širine ekrana. Bez ovog ograničenja
        // je na portretu (telefon) ispadala 1.23 * H, što je na 400x800
        // ekranu 1033px preko 400px — peškir 2.6 puta širi od ekrana, pa se
        // tokom celog prelaza vidi samo plava površina bez ijedne ivice.
        // Na uskom ekranu se malo izduži; u pokretu, sa talasanjem tkanine,
        // to niko ne meri — a razlika između "krpa briše" i "plavo polje" je ogromna.
        const tw = Math.min(th * aspect, W * 1.3);

        // Putanja se računa IZ širine peškira, ne iz fiksnih procenata:
        // ulazi tačno iza desne ivice i izlazi tačno iza leve, koliko god
        // da je širok. Sa fiksnim -0.3W je na telefonu ostajala trećina
        // peškira zaglavljena u kadru na kraju animacije.
        const cx = W + tw / 2 - e * (W + tw);

        // Veo i kapi se sklanjaju sa DESNE strane peškira — tamo je obrisano.
        const cut = Math.max(0, Math.min(100, (cx / W) * 100));
        veil.style.clipPath = `inset(0 ${(100 - cut).toFixed(2)}% 0 0)`;
        drops.style.clipPath = `inset(0 ${(100 - cut).toFixed(2)}% 0 0)`;

        if (towelReady) {
          // Kontaktna senka ispred vodeće ivice — bez nje peškir lebdi
          // umesto da naleže na staklo.
          const shx = cx - tw * 0.5;
          const sg = tctx.createLinearGradient(shx - H * 0.07, 0, shx + H * 0.02, 0);
          sg.addColorStop(0, 'rgba(0,4,12,0)');
          sg.addColorStop(1, 'rgba(0,4,12,0.5)');
          tctx.fillStyle = sg;
          tctx.fillRect(shx - H * 0.07, 0, H * 0.09, H);

          // Tkanina se talasa: crtamo peškir u vertikalnim trakama i svaku
          // pomeramo po sinusu koji putuje. Jedan <img> koji klizi izgleda
          // kao karton; ovo izgleda kao krpa.
          // Nagib od -8 stepeni skida osu-poravnatost — pravougaonik
          // paralelan sa ivicom ekrana uvek izgleda kao UI element, ne kao stvar.
          tctx.save();
          tctx.translate(cx, H / 2);
          tctx.rotate(-0.14);

          const SLICES = 26;
          const sw = towel.width / SLICES;
          const dw = tw / SLICES;
          const phase = t / 130;
          for (let i = 0; i < SLICES; i++) {
            const k = i / (SLICES - 1);
            const wave = Math.sin(phase + k * 3.4) * H * 0.032;
            const squash = 1 + Math.sin(phase * 0.8 + k * 2.1) * 0.055;
            tctx.drawImage(
              towel,
              i * sw,
              0,
              sw + 1,
              towel.height,
              -tw / 2 + i * dw,
              (-th * squash) / 2 + wave,
              dw + 1,
              th * squash
            );
          }
          tctx.restore();

          // Bow-wave: voda koju peškir gura ispred sebe (levo od njega)
          const bw = tctx.createLinearGradient(shx - H * 0.16, 0, shx - H * 0.02, 0);
          bw.addColorStop(0, `rgba(${rgb},0)`);
          bw.addColorStop(0.65, `rgba(${rgb},0.3)`);
          bw.addColorStop(1, `rgba(${rgb},0)`);
          tctx.fillStyle = bw;
          tctx.fillRect(shx - H * 0.16, 0, H * 0.16, H);
        }
      }

      // --- kraj --------------------------------------------------------------
      if (t >= WIPE_END) {
        const out = Math.min(1, (t - WIPE_END) / (TOTAL - WIPE_END));
        host.style.opacity = String(1 - out);
      }
      if (t >= TOTAL) {
        unlock();
        onDone?.();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      towel.onload = null;
      unlock(); // no-op ako je animacija već završila i otpustila bravu
    };
  }, [active, origin, targetId, tier, side, onDone]);

  if (!active) return null;

  return (
    <div ref={hostRef} className={styles.host} aria-hidden="true">
      <div ref={veilRef} className={styles.veil} />
      <canvas ref={dropsRef} className={styles.layer} />
      <canvas ref={towelRef} className={styles.layer} />
    </div>
  );
}
