import { useState } from 'react';
import LiquidButton from './LiquidButton';
import { RevealLines, RevealWords } from './Reveal';
import { STRANE, HROM } from '../lib/faction';
import styles from './OrderSection.module.css';

const CENA_RSD = 3000;
const DOSTAVA_RSD = 390;
const PRAG_BESPLATNE_DOSTAVE = 2;

const POLJA = [
  { id: 'ime', label: 'Ime i prezime', type: 'text', auto: 'name', span: 2 },
  { id: 'email', label: 'Email', type: 'email', auto: 'email', span: 1 },
  { id: 'telefon', label: 'Telefon', type: 'tel', auto: 'tel', span: 1 },
  { id: 'adresa', label: 'Adresa i broj', type: 'text', auto: 'street-address', span: 2 },
  { id: 'grad', label: 'Grad', type: 'text', auto: 'address-level2', span: 1 },
  { id: 'posta', label: 'Poštanski broj', type: 'text', auto: 'postal-code', span: 1 },
];

const format = (n) => n.toLocaleString('sr-RS');

export default function OrderSection({ strana }) {
  const [kolicina, setKolicina] = useState(1);
  const [placanje, setPlacanje] = useState('kartica');
  const [poslato, setPoslato] = useState(false);

  // Pre izbora strane prikazujemo HROM — ali samo kao sliku, dok tekst
  // ostaje neutralan. Nijedna frakcija ne sme da izgleda kao podrazumevana.
  const f = STRANE[strana || HROM];

  const roba = CENA_RSD * kolicina;
  const dostava = kolicina >= PRAG_BESPLATNE_DOSTAVE ? 0 : DOSTAVA_RSD;
  const ukupno = roba + dostava;

  const posalji = (e) => {
    e.preventDefault();
    // Namerno se NIŠTA ne šalje. Vidi napomenu ispod forme i CLAUDE.md.
    setPoslato(true);
  };

  return (
    <section id="poruci" className={styles.wrap}>
      <div className={styles.inner}>
        {/* Levo: proizvod izabrane strane. Ranije je ovde stajao snimak
            brisanja, ali on prikazuje PLAV peškir starog brenda — na
            DRYKULT sajtu bi to bio tuđi proizvod. Vraća se čim se snimi
            materijal sa pravim peškirom. */}
        <div className={styles.media}>
          <img
            className={styles.foto}
            src={`/drykult/${f.peskir}-hi.png`}
            alt={`DRYKULT peškir — strana ${f.ime}`}
            draggable={false}
          />
          <div className={styles.mediaTag}>
            <span className={styles.mediaDot} aria-hidden="true" />
            {f.ime} · {f.boja}
          </div>
        </div>

        {/* Desno: prodaja */}
        <div className={styles.panel}>
          <p className={styles.kicker}>Poruči</p>
          <RevealLines lines={['Uzmi', 'svoju stranu']} as="h2" className={styles.title} stagger={110} />
          <RevealWords
            text="90 × 70 cm, 850 GSM, twisted-loop. Srbija, Bosna i Hercegovina, Crna Gora. Slanje istog radnog dana za porudžbine do 14h."
            className={styles.lede}
          />

          <form className={styles.form} onSubmit={posalji}>
            <fieldset className={styles.qty}>
              <legend className={styles.legend}>Količina</legend>
              <div className={styles.qtyRow}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setKolicina((n) => Math.max(1, n - 1))}
                  aria-label="Smanji količinu"
                >
                  −
                </button>
                <span className={styles.qtyVal} aria-live="polite">
                  {kolicina}
                </span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setKolicina((n) => Math.min(10, n + 1))}
                  aria-label="Povećaj količinu"
                >
                  +
                </button>
                <span className={styles.qtyHint}>
                  {dostava === 0 ? 'dostava gratis' : `još ${PRAG_BESPLATNE_DOSTAVE - kolicina} do besplatne dostave`}
                </span>
              </div>
            </fieldset>

            <div className={styles.grid}>
              {POLJA.map((f) => (
                <label
                  key={f.id}
                  className={`${styles.field} ${f.span === 2 ? styles.wide : ''}`}
                  htmlFor={f.id}
                >
                  <span className={styles.labelText}>{f.label}</span>
                  <input
                    id={f.id}
                    name={f.id}
                    type={f.type}
                    autoComplete={f.auto}
                    required
                    className={styles.input}
                  />
                </label>
              ))}
            </div>

            <fieldset className={styles.pay}>
              <legend className={styles.legend}>Način plaćanja</legend>
              <div className={styles.payRow}>
                {[
                  { id: 'kartica', naziv: 'Kartica', opis: 'Visa · Mastercard' },
                  { id: 'kripto', naziv: 'Kripto', opis: 'BTC · ETH · USDT' },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`${styles.payOpt} ${placanje === m.id ? styles.payOn : ''}`}
                  >
                    <input
                      type="radio"
                      name="placanje"
                      value={m.id}
                      checked={placanje === m.id}
                      onChange={() => setPlacanje(m.id)}
                      className={styles.payInput}
                    />
                    <span className={styles.payNaziv}>{m.naziv}</span>
                    <span className={styles.payOpis}>{m.opis}</span>
                  </label>
                ))}
              </div>

              {/* Ovde ide hostovano polje provajdera (Stripe Elements ili
                  slično). Broj kartice NAMERNO nema svoj <input> u našem
                  DOM-u — čim bi ga imao, podaci kartice prolaze kroz naš kod
                  i to je PCI prekršaj u trenutku kad se poveže uživo. */}
              <div className={styles.payMount} data-mount={placanje}>
                {placanje === 'kartica'
                  ? 'Polje za karticu učitava provajder plaćanja pri potvrdi porudžbine.'
                  : 'Adresa novčanika i iznos se prikazuju na sledećem koraku.'}
              </div>
            </fieldset>

            <div className={styles.total}>
              <div className={styles.totalRow}>
                <span>
                  {f.ime} × {kolicina}
                </span>
                <span>{format(roba)} RSD</span>
              </div>
              <div className={styles.totalRow}>
                <span>Dostava</span>
                <span>{dostava === 0 ? 'gratis' : `${format(dostava)} RSD`}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalSum}`}>
                <span>Ukupno</span>
                <span>{format(ukupno)} RSD</span>
              </div>
            </div>

            <LiquidButton type="submit" variant="solid" className={styles.submit}>
              {poslato ? 'Primljeno ✓' : `Poruči — ${format(ukupno)} RSD`}
            </LiquidButton>

            <p className={styles.note} role={poslato ? 'status' : undefined}>
              {poslato
                ? 'Forma radi, ali naplata još nije povezana — nijedan podatak nije poslat nikuda.'
                : 'Plaćanje pouzećem takođe moguće — javi u napomeni pri kontaktu.'}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
