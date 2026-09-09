import TowelStage from './TowelStage';
import LiquidButton from './LiquidButton';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, PINK, MAMBA, peskirSlika } from '../lib/faction';
import { LOW } from '../lib/device';
import styles from './HeroB.module.css';

// HERO.
//
// Obrazac je iz reference (thewatch): proizvod je u 3D u sredini, prati kursor
// i LETI na skrol; sa strane su kartice varijanti. Potvrđuje se dugmetom.
//
// Od 9. 9. 2026. proizvod je fabrički render: ZELENO telo, CRNA štampa,
// vodoravan. Kapi vode su u 3D sceni (TowelStage), ne više kao CSS sloj —
// žive u istom prostoru kao peškir i on ih zaklanja.
//
// PINK je ZAKLJUČAN: kartica se vidi da se zna da ženska verzija dolazi, ali
// ne može da se izabere. Bez datuma, bez odbrojavanja — pravilo poštenja.

export default function HeroB({ tier, ready, strana, izabrana, onIzbor, onPoruci }) {
  const f = STRANE[strana] || STRANE[MAMBA];

  return (
    <section className={styles.hero} data-strana={strana || 'mamba'}>
      <TowelStage tier={tier} strana={strana} izabrana={izabrana} />

      <div className={styles.grid}>
        {/* --- levo --------------------------------------------------------- */}
        <div className={styles.levo}>
          <RevealFade className={styles.kicker} ready={ready} delay={120}>
            <span className={styles.kickerBroj}>01</span>
            <span className={styles.kickerCrta} aria-hidden="true" />
            <span>premium microfiber · 1000 gsm</span>
          </RevealFade>

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
              <span className={styles.znackaGore}>90 × 70 CM · 1000 GSM</span>
              <span className={styles.znackaDole}>TWISTED-LOOP · DVE STRANE</span>
            </span>
          </RevealFade>
        </div>

        {/* --- desno -------------------------------------------------------- */}
        <div className={styles.desno}>
          <RevealFade className={styles.kartice} ready={ready} delay={1000}>
            {[MAMBA, PINK].map((id) => {
              const s = STRANE[id];
              const aktivna = (strana || MAMBA) === id;
              const zakljucana = !!s.zakljucano;
              return (
                <button
                  key={id}
                  type="button"
                  className={[
                    styles.kartica,
                    aktivna ? styles.karticaOn : '',
                    zakljucana ? styles.karticaZakljucana : '',
                  ].join(' ')}
                  style={{ '--k': s.core }}
                  onClick={() => !zakljucana && onIzbor(id)}
                  aria-pressed={aktivna}
                  aria-disabled={zakljucana || undefined}
                  title={zakljucana ? `${s.ime} — ${s.uskoro}, uskoro` : undefined}
                >
                  {/* Zaključana kartica nosi ISTI peškir, samo prebojen i utišan
                      kroz CSS filter — nagoveštaj, ne lažan proizvod. */}
                  <img
                    src={peskirSlika(zakljucana ? MAMBA : id, tier, 'sm')}
                    alt={zakljucana ? `${s.ime} — uskoro` : `DRYKULT peškir — strana ${s.ime}`}
                    draggable={false}
                  />
                  {zakljucana && (
                    <span className={styles.kljuc} aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14">
                        <path
                          fill="currentColor"
                          d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"
                        />
                      </svg>
                    </span>
                  )}
                  <span className={styles.karticaIme}>{s.ime}</span>
                  <span className={styles.karticaBoja}>{zakljucana ? 'uskoro' : s.boja}</span>
                </button>
              );
            })}
          </RevealFade>

          <RevealFade className={styles.hint} ready={ready} delay={1240}>
            PINK je zaključan — ženska verzija se pravi. Otključavamo čim bude spremna.
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
        {tier !== LOW && (
          <span className={styles.skrol} aria-hidden="true">
            <i />
            skroluj
          </span>
        )}
        <span className={styles.trziste}>RS · BA · ME</span>
        <span className={styles.tvoja}>
          tvoja strana: <b style={{ color: f.core }}>{f.ime}</b>
        </span>
      </div>
    </section>
  );
}
