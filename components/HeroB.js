import { useEffect, useRef } from 'react';
import TowelStage from './TowelStage';
import LiquidButton from './LiquidButton';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, HROM, MAMBA, peskirSlika } from '../lib/faction';
import { LOW } from '../lib/device';
import styles from './HeroB.module.css';

// HERO — verzija B.
//
// Obrazac je iz reference (soda / thewatch): proizvod je u 3D u sredini i prati
// kursor, sa strane su kartice varijanti, klik na karticu okrene proizvod za
// 720 stepeni i zameni teksturu na vrhu obrta.
//
// Razlika u odnosu na verziju A je namerna, da bi poređenje imalo smisla:
//   A — izbor strane JE potvrda (naboj se puni, pa lom)
//   B — kartice samo PRIKAZUJU stranu, potvrđuje se dugmetom
//
// Njihovi mehurići koji se dižu ovde su KAPI VODE. Isti mehanizam, a kod nas
// znači nešto: peškir se prodaje na tome što vodu kupi.

const KAPI_INTERVAL = 420;

export default function HeroB({ tier, ready, strana, izabrana, onIzbor, onPoruci }) {
  const kapiRef = useRef(null);

  useEffect(() => {
    const host = kapiRef.current;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Na telefonu kapi ne donose ništa što se vidi, a troše baterinu.
    if (tier === LOW) return;

    const napravi = () => {
      if (document.hidden) return;
      const k = document.createElement('span');
      k.className = styles.kap;
      const v = 4 + Math.random() * 12;
      k.style.width = `${v}px`;
      k.style.height = `${v}px`;
      k.style.left = `${Math.random() * 100}%`;
      k.style.opacity = String(0.15 + Math.random() * 0.3);
      const t = 5 + Math.random() * 6;
      k.style.animationDuration = `${t}s`;
      host.appendChild(k);
      window.setTimeout(() => k.remove(), t * 1000);
    };
    const id = window.setInterval(napravi, KAPI_INTERVAL);
    return () => {
      window.clearInterval(id);
      host.replaceChildren();
    };
  }, [tier]);

  const f = STRANE[strana] || STRANE[HROM];

  return (
    <section className={styles.hero} data-strana={strana || 'hrom'}>
      <div ref={kapiRef} className={styles.kapi} aria-hidden="true" />

      <TowelStage tier={tier} strana={strana} izabrana={izabrana} />

      <div className={styles.grid}>
        {/* --- levo --------------------------------------------------------- */}
        <div className={styles.levo}>
          <RevealLines
            lines={['Suvo je', 'pravilo.']}
            as="h1"
            className={styles.naslov}
            ready={ready}
            stagger={120}
            delay={220}
          />
          <RevealWords
            className={styles.opis}
            text="Twisted-loop strana kupi vodu iz prve. Plišana polira ono što ostane. Jedan prelaz preko panela i nema ni kapi ni traga."
            ready={ready}
            delay={640}
          />
          <RevealFade className={styles.cta} ready={ready} delay={900}>
            <LiquidButton
              variant="solid"
              href="#poruci"
              onClick={(e) => {
                e.preventDefault();
                onPoruci?.({ x: e.clientX, y: e.clientY });
              }}
            >
              Poruči — 3.000 RSD
            </LiquidButton>
          </RevealFade>

          <RevealFade className={styles.znacka} ready={ready} delay={1120}>
            <span className={styles.znackaIkona} aria-hidden="true">
              ◇
            </span>
            <span className={styles.znackaTekst}>
              <span className={styles.znackaGore}>90 × 70 CM · 850 GSM</span>
              <span className={styles.znackaDole}>TWISTED-LOOP · DVE STRANE</span>
            </span>
          </RevealFade>
        </div>

        {/* --- desno -------------------------------------------------------- */}
        <div className={styles.desno}>
          <RevealFade className={styles.kartice} ready={ready} delay={1000}>
            {[HROM, MAMBA].map((id) => {
              const s = STRANE[id];
              const aktivna = (strana || HROM) === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`${styles.kartica} ${aktivna ? styles.karticaOn : ''}`}
                  style={{ '--k': s.core }}
                  onClick={() => onIzbor(id)}
                  aria-pressed={aktivna}
                >
                  <img
                    src={peskirSlika(id, tier, 'sm')}
                    alt={`DRYKULT peškir — strana ${s.ime}`}
                    draggable={false}
                  />
                  <span className={styles.karticaIme}>{s.ime}</span>
                  <span className={styles.karticaBoja}>{s.boja}</span>
                </button>
              );
            })}
          </RevealFade>

          <RevealLines
            lines={['Trag je', 'greška.']}
            as="h2"
            className={`${styles.naslov} ${styles.naslovDesno}`}
            ready={ready}
            stagger={120}
            delay={420}
          />
        </div>
      </div>

      <div className={styles.podnozje}>
        <span className={styles.trziste}>RS · BA · ME</span>
        <span className={styles.tvoja}>
          tvoja strana: <b style={{ color: f.core }}>{f.ime}</b>
        </span>
      </div>
    </section>
  );
}
