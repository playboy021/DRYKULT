import { STRANE, HROM, MAMBA } from '../lib/faction';
import styles from './SideSwitch.module.css';

// Prekidač strane. Namerno diskretan i uvek prisutan — izbor je identitet,
// ali ne sme da bude ćorsokak. Ako se ne vidi izlaz, izbor postaje zamka
// i posetilac radije ne bira nikako.
export default function SideSwitch({ izabrana, onIzbor }) {
  if (!izabrana) return null;
  const druga = izabrana === HROM ? MAMBA : HROM;

  return (
    <div className={styles.wrap}>
      <span className={styles.aktivna}>{STRANE[izabrana].ime}</span>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onIzbor(druga)}
        aria-label={`Promeni stranu na ${STRANE[druga].ime}`}
      >
        <span className={styles.strelica} aria-hidden="true">
          ⇄
        </span>
        <span className={styles.druga}>{STRANE[druga].ime}</span>
      </button>
    </div>
  );
}
