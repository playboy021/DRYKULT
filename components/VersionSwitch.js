import styles from './VersionSwitch.module.css';

// Prekidač verzija hero-a. ALAT ZA POREĐENJE, ne deo proizvoda —
// skida se pre nego što sajt ide pred kupce (vidi CLAUDE.md).
//
// Postoji jer je verzija B na putanji `/b`, a ne na zasebnom domenu, pa se
// u Vercel listi domena ne vidi i ne može se naći bez kucanja adrese.
export default function VersionSwitch({ aktivna }) {
  return (
    <div className={styles.wrap} role="navigation" aria-label="Verzija hero-a">
      <span className={styles.oznaka}>hero</span>
      <a href="/" className={`${styles.dugme} ${aktivna === 'a' ? styles.on : ''}`} aria-current={aktivna === 'a'}>
        A
      </a>
      <a href="/b" className={`${styles.dugme} ${aktivna === 'b' ? styles.on : ''}`} aria-current={aktivna === 'b'}>
        B
      </a>
    </div>
  );
}
