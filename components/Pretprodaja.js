import { useState } from 'react';
import { RevealLines, RevealWords, RevealFade } from './Reveal';
import LiquidButton from './LiquidButton';
import { STRANE, MAMBA } from '../lib/faction';
import styles from './Pretprodaja.module.css';

// PRETPRODAJA — lista čekanja pre prve serije.
//
// Ovo NIJE naplata i ne sme da liči na nju: ne traži se kartica, ne traži se
// kapara, ne postoji polje u koje bi se broj kartice uopšte mogao upisati.
// Čovek ostavlja mejl, mi mu javimo kad krene i dobija popust.
//
// Šta se prikuplja i zašto (ZZPL / GDPR, načelo minimizacije):
//   ime    — obavezno, da se obraćamo čoveku a ne mejl adresi
//   mejl   — obavezno, jedini način da mu javimo
//   telefon, grad — NEOBAVEZNO, trebaju tek kad se šalje roba
//   godište, država — NE prikupljamo: ničemu ovde ne služe
//
// Pristanak je poseban potvrdni kvadratić i NIJE unapred čekiran — unapred
// čekiran pristanak po GDPR-u ne važi.

export default function Pretprodaja({ strana }) {
  const [polja, setPolja] = useState({ ime: '', mejl: '', telefon: '', grad: '', adresa: '' });
  const [pristanak, setPristanak] = useState(false);
  const [stanje, setStanje] = useState('mirno'); // mirno | salje | gotovo | greska
  const [poruka, setPoruka] = useState('');

  const f = STRANE[strana] || STRANE[MAMBA];
  const meni = (k) => (e) => setPolja((p) => ({ ...p, [k]: e.target.value }));

  const posalji = async (e) => {
    e.preventDefault();
    if (stanje === 'salje') return;
    setStanje('salje');
    setPoruka('');
    try {
      const o = await fetch('/api/lista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...polja, pristanak, strana: strana || MAMBA }),
      });
      const d = await o.json().catch(() => ({}));
      if (!o.ok) {
        setStanje('greska');
        setPoruka(d.greska || 'Nije prošlo. Pokušaj ponovo.');
        return;
      }
      setStanje('gotovo');
      setPoruka(d.nov ? 'Upisan si.' : 'Već si bio na listi — podaci su osveženi.');
    } catch {
      setStanje('greska');
      setPoruka('Nema veze sa internetom?');
    }
  };

  if (stanje === 'gotovo') {
    return (
      <section id="pretprodaja" className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.uspeh}>
            <span className={`gta ${styles.uspehNaslov}`}>Ti si u kultu.</span>
            <p className={styles.uspehTekst}>
              {poruka} Javljamo ti se na mejl čim prva serija krene — i popust te čeka. Ništa nisi platio i
              ništa ne duguješ.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pretprodaja" className={styles.wrap} aria-label="Pretprodaja — lista čekanja">
      <div className={styles.inner}>
        <div className={styles.levo}>
          <RevealFade className={styles.kicker}>
            <span className={`gta ${styles.kickerBroj}`}>03</span>
            <span className={styles.kickerCrta} aria-hidden="true" />
            <span>pretprodaja</span>
          </RevealFade>

          <RevealLines
            as="h2"
            className={`gta ${styles.naslov}`}
            delay={160}
            lines={['Prva serija', <em key="k" className={styles.neon}>ide članovima.</em>]}
          />

          <RevealWords
            className={styles.lede}
            text="Ostavi mejl i javljamo ti se čim krene. Dobijaš popust zato što si bio tu pre svih. Ne plaćaš ništa sada i ne obavezuješ se ni na šta."
            delay={360}
          />

          <ul className={styles.tacke}>
            <li>Nema kapare i nema kartice — samo mejl.</li>
            <li>Javljamo se jednom, kad roba stigne.</li>
            <li>Ispišeš se jednim klikom, podaci se brišu.</li>
          </ul>
        </div>

        <form className={styles.forma} onSubmit={posalji} noValidate>
          <div className={styles.red}>
            <label className={styles.polje}>
              <span className={styles.oznaka}>Ime i prezime *</span>
              <input
                className={styles.unos}
                value={polja.ime}
                onChange={meni('ime')}
                autoComplete="name"
                required
                maxLength={80}
              />
            </label>
            <label className={styles.polje}>
              <span className={styles.oznaka}>Mejl *</span>
              <input
                className={styles.unos}
                type="email"
                inputMode="email"
                value={polja.mejl}
                onChange={meni('mejl')}
                autoComplete="email"
                required
                maxLength={160}
              />
            </label>
          </div>

          <div className={styles.red}>
            <label className={styles.polje}>
              <span className={styles.oznaka}>Telefon</span>
              <input
                className={styles.unos}
                type="tel"
                inputMode="tel"
                value={polja.telefon}
                onChange={meni('telefon')}
                autoComplete="tel"
                maxLength={40}
              />
            </label>
            <label className={styles.polje}>
              <span className={styles.oznaka}>Grad</span>
              <input
                className={styles.unos}
                value={polja.grad}
                onChange={meni('grad')}
                autoComplete="address-level2"
                maxLength={80}
              />
            </label>
          </div>

          {/* Med za botove — sakriveno od ljudi i od čitača ekrana. */}
          <input
            className={styles.med}
            value={polja.adresa}
            onChange={meni('adresa')}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <label className={styles.pristanak}>
            <input type="checkbox" checked={pristanak} onChange={(e) => setPristanak(e.target.checked)} />
            <span>
              Saglasan sam da DRYKULT čuva moje ime i mejl da bi mi javio kad prva serija krene. Podatke ne
              dajemo nikome i brišemo ih na zahtev.
            </span>
          </label>

          <div className={styles.dno}>
            <LiquidButton variant="solid" type="submit" disabled={stanje === 'salje'}>
              {stanje === 'salje' ? 'Šaljem…' : 'Uđi u kult'}
            </LiquidButton>
            <span className={styles.strana} style={{ color: f.core }}>
              {f.ime}
            </span>
          </div>

          {stanje === 'greska' && (
            <p className={styles.greska} role="alert">
              {poruka}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
