import { RevealLines, RevealWords, RevealFade } from './Reveal';
import styles from './MostWanted.module.css';

// MOST WANTED — najava opreme.
//
// Preuređeno 30. 9. po Stefanovom izboru: dve kategorije umesto tri.
//
// Šta NIJE ušlo i zašto (da se ne vraća u opticaj bez odluke):
//   • Uređaj za zatamnjivanje tablice — u Srbiji je prekriven ili nečitljiv
//     registarski broj PREKRŠAJ (10.000 RSD, u predlogu izmena 50.000 uz
//     mogućnost oduzimanja vozila). Brend koji prodaje opremu za auto ne sme
//     da prodaje spravu čija je jedina svrha kršenje tog propisa.
//   • Amblemi sa znakom BMW / Audi / Mercedes — tuđ žig. Imena smeju kao
//     kompatibilnost („za BMW"), znak na proizvodu ne sme bez licence.
//   • Patosnice sa likovima (Hulk, Joker, Rick & Morty) — tuđe autorsko pravo.
//     Naš crtež sme, njihov ne.
//
// Sve što ovde stoji je u izradi: bez cena, bez datuma, bez odbrojavanja.
// Odbrojavanje na sajtu važi za PEŠKIR, ne za ovu opremu.

function IkonaPatosnica() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.2 3.5h11.6l1.7 17H4.5z" />
      <path d="M8 8h8M7.4 12h9.2M6.8 16h10.4" />
    </svg>
  );
}

function IkonaDodaci() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.8l7.8 4.5v9.4L12 21.2l-7.8-4.5V7.3z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

// Dve kategorije, svaka sa svojim spiskom. Spisak je konkretan jer „gedžeti"
// nikome ništa ne znače — a „viseća ručka" i „marker za gume" znače.
const KATEGORIJE = [
  {
    id: 'pojasevi-patosnice',
    ime: 'Pojasevi i patosnice',
    Ikona: IkonaPatosnica,
    opis: 'Ono što se vidi čim otvoriš vrata.',
    stavke: [
      { ime: 'Patosnice', nota: 'naš crtež, ne tuđi lik' },
      { ime: 'Pojasevi u boji', nota: 'samo sa homologacijom' },
    ],
  },
  {
    id: 'dodaci',
    ime: 'Dodaci',
    Ikona: IkonaDodaci,
    opis: 'Sitno, ali se primeti iz prvog pogleda.',
    stavke: [
      { ime: 'Viseća ručka', nota: 'tsurikawa sa našim znakom' },
      { ime: 'Ambijentalno svetlo za noge', nota: 'bežično, puna boja' },
      { ime: 'Marker za gume', nota: 'bela slova na gumi' },
    ],
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
          {KATEGORIJE.map(({ id, ime, opis, Ikona, stavke }, i) => (
            <li key={id}>
              <RevealFade className={styles.stavka} delay={i * 110}>
                <span className={styles.ikona}>
                  <Ikona />
                </span>
                <span className={styles.stavkaTekst}>
                  <span className={`gta ${styles.stavkaIme}`}>{ime}</span>
                  <span className={styles.stavkaOpis}>{opis}</span>
                </span>

                <ul className={styles.spisak}>
                  {stavke.map((s) => (
                    <li key={s.ime} className={styles.red}>
                      <span className={styles.crtica} aria-hidden="true" />
                      <span className={styles.redIme}>{s.ime}</span>
                      <span className={styles.redNota}>{s.nota}</span>
                    </li>
                  ))}
                </ul>

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
