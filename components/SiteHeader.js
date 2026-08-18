import { useEffect, useState } from 'react';
import { STRANE } from '../lib/faction';
import styles from './SiteHeader.module.css';

// Gornja traka + navigacija.
//
// Konkurencija ovde ima devet stavki menija jer je Shopify template. Nama
// treba tačno onoliko koliko sajt ima mesta na koja se stiže — višak stavki
// samo razblažuje jedini potez koji nam je bitan.
//
// Poruke u traci su ISTINITE i proverive iz naših pravila. Bez „100.000 prodatih".
const PORUKE = [
  'Besplatna dostava od 2 komada',
  'Slanje istog radnog dana za porudžbine do 14h',
  'Srbija · Bosna i Hercegovina · Crna Gora',
];

export default function SiteHeader({ strana, prozirna, onPocetna, onPromeni }) {
  const [i, setI] = useState(0);
  const [naVrhu, setNaVrhu] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % PORUKE.length), 4200);
    return () => clearInterval(id);
  }, []);

  // Providna sme da bude SAMO na vrhu hero-a. Čim se skroluje na sekciju
  // ispod, tekst iza trake prolazi kroz nju i ništa se ne čita.
  useEffect(() => {
    const proveri = () => setNaVrhu(window.scrollY < 24);
    proveri();
    window.addEventListener('scroll', proveri, { passive: true });
    return () => window.removeEventListener('scroll', proveri);
  }, []);

  const f = strana ? STRANE[strana] : null;

  // Skrol ka sidru ide kroz Lenis ako postoji — inače se glatki skrol i
  // native skok tuku i strana "trzne" umesto da otklizi.
  const naSekciju = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`${styles.host} ${prozirna && naVrhu ? styles.prozirna : ''}`}>
      <div className={styles.traka}>
        <span key={i} className={styles.poruka} aria-live="polite">
          {PORUKE[i]}
        </span>
      </div>

      <nav className={styles.nav} aria-label="Glavna navigacija">
        {/* Logo je DUGME, ne sidro. Ranije je vodio na #vrh, što samo skroluje
            na vrh iste strane — a u fazi prodaje „početna" znači povratak na
            izbor strane, dakle reset stanja. Sidro to nikad nije moglo. */}
        <button type="button" className={styles.logo} onClick={onPocetna}>
          DRYKULT<span className={styles.reg}>®</span>
        </button>

        <div className={styles.linkovi}>
          <a href="#dokaz" onClick={(e) => naSekciju(e, 'dokaz')}>
            Dokaz
          </a>
          {/* "Poruči" postoji tek kad postoji i sekcija. U fazi izbora bi to
              bio link u prazno — a mrtav link je gori od nepostojećeg. */}
          {strana && (
            <a href="#poruci" onClick={(e) => naSekciju(e, 'poruci')}>
              Poruči
            </a>
          )}
        </div>

        <div className={styles.desno}>
          {f && (
            <button type="button" className={styles.znak} onClick={onPromeni}>
              <span className={styles.tacka} aria-hidden="true" />
              {f.ime}
              <span className={styles.promeni}>promeni</span>
            </button>
          )}
          <span className={styles.cena}>3.000 RSD</span>
        </div>
      </nav>
    </header>
  );
}
