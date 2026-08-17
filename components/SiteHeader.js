import { useEffect, useState } from 'react';
import { STRANE } from '../lib/faction';
import styles from './SiteHeader.module.css';

// Gornja traka + navigacija.
//
// Konkurencija ovde ima devet stavki menija jer je Shopify template. Nama
// treba tačno onoliko koliko sajt ima mesta na koja se stiže — višak stavki
// samo razblažuje jedini potez koji nam je bitan.
//
// Poruke u traci su ISTINITE i proverive iz naših pravila:
// besplatna dostava od dva komada je stvarno pravilo u OrderSection,
// a tržišta su ona na koja stvarno šaljemo. Bez „100.000 prodatih".
const PORUKE = [
  'Besplatna dostava od 2 komada',
  'Slanje istog radnog dana za porudžbine do 14h',
  'Srbija · Bosna i Hercegovina · Crna Gora',
];

export default function SiteHeader({ strana, prozirna }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % PORUKE.length), 4200);
    return () => clearInterval(id);
  }, []);

  const f = strana ? STRANE[strana] : null;

  return (
    <header className={`${styles.host} ${prozirna ? styles.prozirna : ''}`}>
      <div className={styles.traka}>
        {/* aria-live da čitač ekrana pročita promenu, ali bez prekidanja */}
        <span key={i} className={styles.poruka} aria-live="polite">
          {PORUKE[i]}
        </span>
      </div>

      <nav className={styles.nav} aria-label="Glavna navigacija">
        <a href="#vrh" className={styles.logo}>
          DRYKULT<span className={styles.reg}>®</span>
        </a>

        <div className={styles.linkovi}>
          <a href="#dokaz">Dokaz</a>
          <a href="#poruci">Poruči</a>
        </div>

        <div className={styles.desno}>
          {f && (
            <span className={styles.znak} title={`Tvoja strana: ${f.ime}`}>
              <span className={styles.tacka} aria-hidden="true" />
              {f.ime}
            </span>
          )}
          <span className={styles.cena}>3.000 RSD</span>
        </div>
      </nav>
    </header>
  );
}
