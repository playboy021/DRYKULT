import { useRef } from 'react';
import TowelStage from './TowelStage';
import LiquidButton from './LiquidButton';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, PINK, MAMBA, peskirSlika } from '../lib/faction';
import { LOW } from '../lib/device';
import styles from './HeroB.module.css';

// HERO — GTA × Razer.
//
// Kompozicija je POSTER, ne kolone: ogroman naslov gore-levo, ogroman naslov
// dole-desno, proizvod slobodan u sredini, opcije desno kao meni u igri.
// Stefan je 27. 9. zaokružio baš ta dva bloka teksta i pokazao ka uglovima:
// do tada su ležali PREKO peškira, zelena reč preko zelene tkanine, i ništa
// se nije čitalo. Sada ništa ne dodiruje peškir.
//
// Registar: naslovi u GTA fontu (Passion One, duh Pricedown-a) sa tvrdom
// pomerenom senkom; zavrsna reč gore je NEON (proizvod), dole ZLATO (wanted).
// Kapi vode su u 3D sceni (TowelStage) — žive u istom prostoru kao peškir.
//
// PINK je ZAKLJUČAN: vidi se da dolazi, ne može da se uzme. MOST WANTED vodi
// na najavu opreme. Bez datuma, bez odbrojavanja — pravilo poštenja.

const MOST_WANTED = 'most-wanted';

function Katanac() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"
      />
    </svg>
  );
}

export default function HeroB({ tier, ready, strana, izabrana, onIzbor, onPoruci }) {
  const f = STRANE[strana] || STRANE[MAMBA];
  // Prazna ćelija grida u koju peškir mora da stane (vidi TowelStage).
  const okvirRef = useRef(null);

  const naSekciju = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  // Tri opcije, jedan meni. Zaključana nosi ISTI peškir, prebojen i utišan
  // kroz CSS — nagoveštaj, ne lažan proizvod.
  const opcije = [
    { id: MAMBA, ime: 'Mamba', sub: STRANE[MAMBA].boja, k: STRANE[MAMBA].core, slika: peskirSlika(MAMBA, tier, 'sm') },
    { id: PINK, ime: 'Pink', sub: 'ženska verzija · uskoro', k: STRANE[PINK].core, slika: peskirSlika(MAMBA, tier, 'sm'), zakljucana: true },
    { id: MOST_WANTED, ime: 'Most Wanted', sub: 'oprema · uskoro', k: 'var(--gold)', zvezde: true, sekcija: true },
  ];

  return (
    <section className={styles.hero} data-strana={strana || 'mamba'}>
      <div className={styles.grid}>
        {/* Scena je na desktopu pun kadar iza svega (kapi lete kroz tekst),
            a na uskom ekranu običan blok u redosledu. Razliku pravi CSS. */}
        <TowelStage className={styles.scena} okvir={okvirRef} tier={tier} strana={strana} izabrana={izabrana} />
        {/* Ćelija bez teksta. Scena joj meri pravougaonik i u njega uklapa
            peškir — raspored (kolone, prelomi) ostaje u CSS-u. */}
        <div ref={okvirRef} className={styles.okvir} aria-hidden="true" />

        {/* --- gore-levo ------------------------------------------------- */}
        <div className={styles.naslovBlok}>
          <RevealFade className={styles.kicker} ready={ready} delay={120}>
            <span className={`gta ${styles.kickerBroj}`}>01</span>
            <span className={styles.kickerCrta} aria-hidden="true" />
            <span>premium microfiber · 1000 gsm</span>
          </RevealFade>
          <RevealLines
            as="h1"
            className={`gta ${styles.naslov}`}
            ready={ready}
            delay={220}
            lines={[
              <>
                Suvo je <em className={styles.zeleno}>pravilo.</em>
              </>,
            ]}
          />
        </div>

        {/* --- levo, sredina --------------------------------------------- */}
        <div className={styles.levo}>
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

        {/* --- desno, sredina: meni ---------------------------------------- */}
        <div className={styles.desno}>
          <RevealFade className={styles.opcije} ready={ready} delay={900}>
            <span className={styles.opcijeNaslov}>Izaberi stranu</span>
            {opcije.map((o) => {
              const aktivna = !o.sekcija && (strana || MAMBA) === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={[
                    styles.tile,
                    aktivna ? styles.tileOn : '',
                    o.zakljucana ? styles.tileLocked : '',
                    o.zvezde ? styles.tileGold : '',
                  ].join(' ')}
                  style={{ '--k': o.k }}
                  onClick={(e) => {
                    if (o.sekcija) naSekciju(e, MOST_WANTED);
                    else if (!o.zakljucana) onIzbor(o.id);
                  }}
                  aria-pressed={o.sekcija ? undefined : aktivna}
                  aria-disabled={o.zakljucana || undefined}
                  title={o.zakljucana ? 'PINK — ženska verzija, uskoro' : undefined}
                >
                  <span className={styles.thumb}>
                    {o.zvezde ? (
                      <span className={`gta ${styles.zvezde}`} aria-hidden="true">
                        ★★★★★
                      </span>
                    ) : (
                      <img src={o.slika} alt="" draggable={false} />
                    )}
                  </span>
                  <span className={styles.tileText}>
                    <span className={`gta ${styles.tileIme}`}>{o.ime}</span>
                    <span className={styles.tileSub}>{o.sub}</span>
                  </span>
                  <span className={styles.tileKraj} aria-hidden="true">
                    {o.zakljucana ? <Katanac /> : o.sekcija ? '→' : <span className={styles.tacka} />}
                  </span>
                </button>
              );
            })}
          </RevealFade>

          {/* Napomena o zaključanoj strani kao ISTAKNUTA informacija, ne kao
              tekst koji lebdi — ranije je stajala siva pored peškira i čitala
              se kao greška u prelomu. */}
          <RevealFade className={styles.info} ready={ready} delay={1150}>
            <span className={styles.infoTag}>Info</span>
            <span>
              PINK je ženska verzija i u izradi je. Otključava se čim bude spremna — bez datuma dok je nema.
            </span>
          </RevealFade>
        </div>

        {/* --- dole-desno ---------------------------------------------------- */}
        <RevealLines
          as="h2"
          className={`gta ${styles.naslov} ${styles.kraj}`}
          ready={ready}
          delay={420}
          lines={[
            <>
              Trag je <em className={styles.zlato}>greška.</em>
            </>,
          ]}
        />
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
