import { RevealLines, RevealWords, RevealFade } from './Reveal';
import styles from './MostWanted.module.css';

// MOST WANTED — najava opreme.
//
// Stefan (27. 9.): „još jedan odeljak, most wanted — patosnice, amblemi za
// tablu (Audi, BMW, Mercedes), gedžeti; za sada samo odeljak, bez proizvoda."
//
// GTA registar: zvezdice traženosti, ZLATO kao jedini drugi akcenat na sajtu
// (zlato = wanted, neon = proizvod). Pravilo poštenja važi i ovde: nema cena,
// nema datuma, nema odbrojavanja, nema „uskoro u prodaji" sa rokom. Stoji
// samo ono što je istina — da se ovo pravi i da će ovde da se otključa.
//
// Imena marki su navedena kao KOMPATIBILNOST („za Audi · BMW · Mercedes"),
// ne kao naši proizvodi — njihovi znakovi su tuđi žigovi (beleška u plan/).

function IkonaPatosnica() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.2 3.5h11.6l1.7 17H4.5z" />
      <path d="M8 8h8M7.4 12h9.2M6.8 16h10.4" />
    </svg>
  );
}

function IkonaAmblem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 2.6v5.6c0 4.4-2.9 7.6-7 9.3-4.1-1.7-7-4.9-7-9.3V5.6z" />
      <path d="M12 8.2l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" />
    </svg>
  );
}

function IkonaGedzet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.8l7.8 4.5v9.4L12 21.2l-7.8-4.5V7.3z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

const STAVKE = [
  {
    id: 'patosnice',
    ime: 'Patosnice',
    opis: 'Za kabinu koja ostane čista i kad napolju nije.',
    Ikona: IkonaPatosnica,
  },
  {
    id: 'amblemi',
    ime: 'Amblemi za tablu',
    opis: 'Za Audi · BMW · Mercedes. Na instrument tablu, ne na branik.',
    Ikona: IkonaAmblem,
  },
  {
    id: 'gedzeti',
    ime: 'Gedžeti',
    opis: 'Sitnice za kabinu i prtljažnik. Male, ali se primete.',
    Ikona: IkonaGedzet,
  },
];

export default function MostWanted() {
  return (
    <section id="most-wanted" className={styles.wrap} aria-label="Most Wanted — najava opreme">
      <div className={styles.inner}>
        <div className={styles.glava}>
          {/* Pet zvezdica: nivo traženosti iz GTA. Ulaze jedna po jedna,
              svaka „udari" u ekran — to je jedina animacija u sekciji. */}
          <RevealFade className={styles.zvezde}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`gta ${styles.zvezda}`} style={{ '--d': `${i * 90}ms` }} aria-hidden="true">
                ★
              </span>
            ))}
          </RevealFade>

          <RevealFade className={styles.kicker} delay={120}>
            <span className={`gta ${styles.kickerBroj}`}>02</span>
            <span className={styles.kickerCrta} aria-hidden="true" />
            <span>najtraženija oprema</span>
          </RevealFade>

          <RevealLines
            as="h2"
            className={`gta ${styles.naslov}`}
            delay={200}
            lines={[
              'Most',
              <em key="wanted" className={styles.zlato}>
                Wanted.
              </em>,
            ]}
          />

          <RevealWords
            className={styles.lede}
            text="Oprema koja ne prolazi neprimećeno. Nije zabranjena — samo tako izgleda. Prvi komadi su u izradi; kad budu spremni, ovde se otključavaju."
            delay={420}
          />
        </div>

        <ul className={styles.stavke}>
          {STAVKE.map(({ id, ime, opis, Ikona }, i) => (
            <li key={id}>
              <RevealFade className={styles.stavka} delay={i * 110}>
                <span className={styles.ikona}>
                  <Ikona />
                </span>
                <span className={styles.stavkaTekst}>
                  <span className={`gta ${styles.stavkaIme}`}>{ime}</span>
                  <span className={styles.stavkaOpis}>{opis}</span>
                </span>
                <span className={styles.tag}>u izradi</span>
              </RevealFade>
            </li>
          ))}
        </ul>

        <p className={styles.napomena}>Bez datuma i bez odbrojavanja — kad bude spremno, ovde se otključava.</p>
      </div>
    </section>
  );
}
