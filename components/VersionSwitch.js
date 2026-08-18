import styles from './VersionSwitch.module.css';

// Povratak sa arhivirane verzije na glavnu.
//
// Stoji SAMO na `/a`. Glavna strana je čista — na njoj nema nikakvog alata
// za poređenje, jer to kupac ne treba da vidi.
export default function VersionSwitch() {
  return (
    <div className={styles.wrap} role="navigation" aria-label="Verzije">
      <span className={styles.oznaka}>arhiva</span>
      <a href="/" className={styles.dugme}>
        na glavnu ↗
      </a>
    </div>
  );
}
