import { useEffect, useRef, useState } from 'react';
import LiquidButton from './LiquidButton';
import { RevealLines, RevealWords } from './Reveal';
import styles from './OrderSection.module.css';

// !!! POSTAVI PRAVU CENU !!!
// Placeholder — stoji na javnom sajtu dok se ne zameni.
const CENA_RSD = 2490;
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

export default function OrderSection() {
  const videoRef = useRef(null);
  const [kolicina, setKolicina] = useState(1);
  const [placanje, setPlacanje] = useState('kartica');
  const [poslato, setPoslato] = useState(false);

  const roba = CENA_RSD * kolicina;
  const dostava = kolicina >= PRAG_BESPLATNE_DOSTAVE ? 0 : DOSTAVA_RSD;
  const ukupno = roba + dostava;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // ZAKON 4.4 — src u JS-u, ne u JSX-u. U markup-u stoji samo poster,
    // pa telefon ne počne da vuče fajl pre nego što ovo odluči.
    v.src = '/megaz/order-hook.mp4';

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(v);

    const onVis = () => {
      if (document.hidden) v.pause();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const posalji = (e) => {
    e.preventDefault();
    // Namerno se NIŠTA ne šalje. Vidi napomenu ispod forme i CLAUDE.md.
    setPoslato(true);
  };

  return (
    <section id="poruci" className={styles.wrap}>
      <div className={styles.inner}>
        {/* Levo: drugi hook. Ruke brišu retrovizor, pa ostane čisto staklo.
            Poenta je da posle prelaza korisnik JOŠ JEDNOM vidi proizvod
            na delu, pre nego što ga forma pita za podatke. */}
        <div className={styles.media}>
          <video
            ref={videoRef}
            className={styles.video}
            poster="/megaz/order-hook-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="MEGAZ peškir briše retrovizor i ostavlja čisto staklo"
          />
          <div className={styles.mediaGrade} aria-hidden="true" />
          <div className={styles.mediaTag}>
            <span className={styles.mediaDot} aria-hidden="true" />
            bez tragova, iz prve
          </div>
        </div>

        {/* Desno: prodaja */}
        <div className={styles.panel}>
          <p className={styles.kicker}>Poruči</p>
          <RevealLines
            lines={['MEGAZ', 'peškir']}
            as="h2"
            className={styles.title}
            stagger={110}
          />
          <RevealWords
            text="Dostupno u Srbiji, Bosni i Hercegovini i Crnoj Gori. Slanje istog radnog dana za porudžbine do 14h."
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
                  Peškir × {kolicina}
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
