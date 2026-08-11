import { useEffect, useRef, useState } from 'react';
import styles from './HeroVideo.module.css';

// LOW tier (telefon). ZAKON 4.2 — mobilni browseri ne umeju pouzdano da
// premotavaju video na skrol, pa se ovde film SAM izvrti jednom, a onda
// stane i pokaže "Skroluj dalje ↓". Dekoduje ga hardver → CPU je slobodan.
export default function HeroVideo({ src, poster }) {
  const ref = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    // ZAKON 4.4 — src se postavlja OVDE, ne u JSX-u. Da stoji u markup-u,
    // telefon bi počeo da vuče fajl pre nego što JS uopšte odluči koji treba.
    v.src = src;

    // Rani buffer: kreni da učitavaš 400px pre nego što uđe u kadar,
    // da video ne "zapne" tačno u trenutku kad ga korisnik ugleda.
    const pre = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            v.load();
            pre.disconnect();
          }
        }
      },
      { rootMargin: '400px' }
    );
    pre.observe(v);

    // Puštanje tek kad je stvarno u kadru.
    const play = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // !v.ended — inače se film vrti u krug svaki put kad se sekcija
          // vrati u vidno polje, a poenta je da se odigra JEDNOM.
          if (e.isIntersecting && v.paused && !v.ended) {
            v.play().catch(() => {
              /* autoplay odbijen — poster ostaje, nije kraj sveta */
            });
          } else if (!e.isIntersecting && !v.paused) {
            v.pause();
          }
        }
      },
      { threshold: 0.35 }
    );
    play.observe(v);

    const onEnded = () => setDone(true);
    v.addEventListener('ended', onEnded);

    // ZAKON 4.6 — tab u pozadini pauzira.
    const onVis = () => {
      if (document.hidden) v.pause();
      else if (!v.ended) v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      pre.disconnect();
      play.disconnect();
      v.removeEventListener('ended', onEnded);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [src]);

  return (
    <div className={styles.host}>
      <video
        ref={ref}
        className={styles.video}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        aria-label="MEGAZ peškir prelazi preko mokre haube i suši je"
      />
      <div className={styles.grade} aria-hidden="true" />
      <div className={`${styles.next} ${done ? styles.nextOn : ''}`} aria-hidden={!done}>
        Skroluj dalje ↓
      </div>
    </div>
  );
}
