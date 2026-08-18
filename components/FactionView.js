import LiquidButton from './LiquidButton';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import { STRANE, peskirSlika } from '../lib/faction';
import styles from './FactionView.module.css';

// Ono što ostane posle loma: SAMO izabrana strana. Nema više dve ponude,
// nema poređenja, nema vraćanja na izbor osim ako korisnik to sam traži.
//
// Dugme „nazad" je obavezno i mora biti vidljivo. Izbor koji se ne može
// poništiti nije izbor nego zamka — a posetilac koji oseti zamku ne kupuje.
export default function FactionView({ strana, onPoruci }) {
  const f = STRANE[strana];
  if (!f) return null;

  // Povratak na izbor je u gornjoj traci (SiteHeader), ne ovde. Kad je stajao
  // ovde kao plutajuće dugme na top:1.5rem, fiksna traka ga je pokrivala i
  // klik prosto nije stizao do njega.
  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.media}>
          <img
            className={styles.towel}
            src={peskirSlika(strana, null, 'hi')}
            alt={`DRYKULT peškir — strana ${f.ime}`}
            draggable={false}
          />
        </div>

        <div className={styles.info}>
          <RevealFade className={styles.kicker} delay={80}>
            <span className={styles.mark}>DRYKULT®</span>
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            tvoja strana
          </RevealFade>

          <RevealLines lines={['Ti si', f.ime]} as="h1" className={styles.ime} stagger={110} delay={180} />

          <RevealWords
            className={styles.opis}
            text={
              strana === 'hrom'
                ? 'Glatko i precizno. Twisted-loop strana kupi vodu iz prve, plišana polira ono što ostane — bez ijednog traga u laku.'
                : 'Brzo i oštro. Twisted-loop strana kupi vodu iz prve, plišana polira ono što ostane — bez ijednog traga u laku.'
            }
            delay={600}
          />

          <RevealFade className={styles.spec} delay={820}>
            <span>90 × 70 cm</span>
            <span className={styles.sep} aria-hidden="true" />
            <span>850 GSM</span>
            <span className={styles.sep} aria-hidden="true" />
            <span>twisted-loop</span>
          </RevealFade>

          <RevealFade className={styles.cta} delay={980}>
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
        </div>
      </section>
    </div>
  );
}
