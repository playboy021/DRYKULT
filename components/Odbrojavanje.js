import { useEffect, useState } from 'react';
import styles from './Odbrojavanje.module.css';

// ODBROJAVANJE do otvaranja kulta.
//
// Pravilo poštenja (CLAUDE.md) zabranjuje odbrojavanja — ali ono što zabranjuje
// je LAŽNO odbrojavanje: ono koje odbrojava do datuma koji ne postoji, koje se
// resetuje kad istekne, ili koje pravi pritisak izmišljenom oskudicom. Ovo
// odbrojava do STVARNOG dana koji je Stefan zakazao, i kad istekne — prestane i
// kaže da je kult otvoren. Ne vraća se na početak.
//
// Iz toga slede dva pravila koja se ne pregovaraju:
//   1. Ako se datum pomeri, PROMENI GA OVDE pre nego što istekne. Odbrojavanje
//      koje dođe do nule a ništa se ne desi je tačno ono što pravilo zabranjuje.
//   2. Nikad ne dodavati „ostalo još samo X komada" ni slične brojke uz njega.

// Datum se drži kao JEDAN trenutak sa upisanom zonom, ne kao lokalno vreme.
// „18. oktobar u 10h" znači 10h u Beogradu i za posetioca iz Beča i iz Čikaga —
// bez `+02:00` bi svako odbrojavao do svojih 10h, pa bi se sajt razlikovao od
// objave na Instagramu. Oktobar je u Srbiji još letnje računanje (CEST, UTC+2);
// prelazak je poslednje nedelje oktobra, dakle POSLE ovog datuma.
export const POCETAK = new Date('2026-10-18T10:00:00+02:00');

const preostalo = (cilj) => {
  const ms = cilj.getTime() - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    dana: Math.floor(s / 86400),
    sati: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    sek: s % 60,
  };
};

const dva = (n) => String(n).padStart(2, '0');

export default function Odbrojavanje({ cilj = POCETAK, className = '' }) {
  // `null` je i „još nije izračunato" i „isteklo je"; razdvaja ih `krenuo`.
  // Server ne sme da računa vreme: HTML bi se razlikovao od onog što klijent
  // nacrta sekundu kasnije i hidracija bi pukla. Zato se prvi račun radi tek
  // u useEffect-u, posle montiranja.
  const [ostalo, setOstalo] = useState(null);
  const [krenuo, setKrenuo] = useState(false);

  useEffect(() => {
    setKrenuo(true);
    const osveži = () => setOstalo(preostalo(cilj));
    osveži();

    let id = setInterval(osveži, 1000);
    // ZAKON 4.6 — tab u pozadini ne troši ništa. Pri povratku se odmah
    // preračuna, da se ne vidi zaostali broj iz trenutka kad je tab skriven.
    const naVidljivost = () => {
      clearInterval(id);
      if (!document.hidden) {
        osveži();
        id = setInterval(osveži, 1000);
      }
    };
    document.addEventListener('visibilitychange', naVidljivost);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', naVidljivost);
    };
  }, [cilj]);

  // `toLocaleDateString` daje NOMINATIV („18. oktobar"), pa rečenica ispod
  // ispadne „kreće 18. oktobar". Srpski tu traži genitiv, a Intl ga ne nudi —
  // zato mesec ide iz spiska. Dan se i dalje čita iz datuma u beogradskoj zoni,
  // da se ne desi da posetiocu iz druge zone piše jedan dan a odbrojava drugi.
  const MESECI = [
    'januara', 'februara', 'marta', 'aprila', 'maja', 'juna',
    'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra',
  ];
  const uBeogradu = new Date(cilj.toLocaleString('en-US', { timeZone: 'Europe/Belgrade' }));
  const datum = `${uBeogradu.getDate()}. ${MESECI[uBeogradu.getMonth()]}`;

  // Dok se ne montira, stoji isti okvir sa praznim mestom — bez toga bi
  // raspored poskočio u trenutku kad brojevi stignu.
  if (!krenuo) return <div className={`${styles.host} ${styles.tih} ${className}`} aria-hidden="true" />;

  if (!ostalo) {
    return (
      <div className={`${styles.host} ${styles.otvoren} ${className}`}>
        <span className={styles.tag}>
          <i className={styles.tacka} aria-hidden="true" />
          Kult je otvoren
        </span>
        <span className={`gta ${styles.otvorenTekst}`}>Uđi u kult.</span>
      </div>
    );
  }

  const polja = [
    ['dana', ostalo.dana],
    ['sati', dva(ostalo.sati)],
    ['min', dva(ostalo.min)],
    ['sek', dva(ostalo.sek)],
  ];

  return (
    <div className={`${styles.host} ${className}`}>
      <span className={styles.tag}>
        <i className={styles.tacka} aria-hidden="true" />
        Kult se otvara
      </span>

      {/* Brojevi se menjaju svake sekunde: čitaču ekrana se NE daju, jer bi ih
          izgovarao u nedogled. Njemu ide jedna rečenica ispod, u tekstu. */}
      <div className={styles.sat} aria-hidden="true">
        {polja.map(([ime, vrednost], i) => (
          <span className={styles.polje} key={ime}>
            <span className={styles.broj}>{vrednost}</span>
            <span className={styles.jedinica}>{ime}</span>
            {i < polja.length - 1 && <span className={styles.dvotacka}>:</span>}
          </span>
        ))}
      </div>

      {/* Moto ide u svoj red i u punoj veličini. Dok je stajao kao sitan
          dodatak uz datum, gubio se — a to je jedina rečenica koju treba da
          zapamte. Datum mu je podnaslov, ne obrnuto. */}
      <span className={`gta ${styles.poziv}`}>Uđi u kult.</span>
      <span className={styles.datum}>{datum} · prva serija</span>

      <span className={styles.citac}>
        Prva serija kreće {datum}. Ostalo je {ostalo.dana} dana.
      </span>
    </div>
  );
}
