import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Admin.module.css';

// ADMIN — pregled liste čekanja.
//
// Namerno van glavnog toka sajta: nema navigacije, nema animacija, nema 3D.
// Ovo je alat, ne izlog. Lozinka stoji u `sessionStorage` da se ne kuca pri
// svakom osvežavanju, ali NE u `localStorage` — zatvaranje taba je briše.
//
// `noindex` je obavezan: strana sa podacima kupaca ne sme da završi u pretrazi.

export default function Admin() {
  const [lozinka, setLozinka] = useState('');
  const [podaci, setPodaci] = useState(null);
  const [greska, setGreska] = useState('');
  const [ucitava, setUcitava] = useState(false);

  const ucitaj = async (lz) => {
    setUcitava(true);
    setGreska('');
    try {
      const o = await fetch('/api/admin', { headers: { 'x-admin-lozinka': lz } });
      const d = await o.json();
      if (!o.ok) {
        setGreska(d.greska || 'Nije prošlo.');
        setPodaci(null);
        sessionStorage.removeItem('drykult:admin');
        return;
      }
      sessionStorage.setItem('drykult:admin', lz);
      setPodaci(d);
    } catch {
      setGreska('Nema veze sa serverom.');
    } finally {
      setUcitava(false);
    }
  };

  useEffect(() => {
    const sacuvana = sessionStorage.getItem('drykult:admin');
    if (sacuvana) {
      setLozinka(sacuvana);
      ucitaj(sacuvana);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const datum = (s) =>
    new Date(s).toLocaleString('sr-Latn-RS', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Head>
        <title>DRYKULT — admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className={styles.wrap}>
        <h1 className={styles.naslov}>DRYKULT — lista čekanja</h1>

        {!podaci && (
          <form
            className={styles.prijava}
            onSubmit={(e) => {
              e.preventDefault();
              ucitaj(lozinka);
            }}
          >
            <input
              className={styles.unos}
              type="password"
              value={lozinka}
              onChange={(e) => setLozinka(e.target.value)}
              placeholder="lozinka"
              autoFocus
            />
            <button className={styles.dugme} type="submit" disabled={ucitava}>
              {ucitava ? '…' : 'Uđi'}
            </button>
            {greska && <p className={styles.greska}>{greska}</p>}
          </form>
        )}

        {podaci && (
          <>
            <div className={styles.brojke}>
              {[
                ['ukupno', podaci.stat.ukupno],
                ['danas', podaci.stat.danas],
                ['ove nedelje', podaci.stat.nedelja],
              ].map(([ime, br]) => (
                <div className={styles.kartica} key={ime}>
                  <span className={styles.broj}>{br}</span>
                  <span className={styles.oznaka}>{ime}</span>
                </div>
              ))}
            </div>

            <p className={styles.izvor}>
              izvor: {podaci.stat.izvorPodataka}
              {podaci.stat.izvorPodataka.includes('fajl') && ' — na Vercelu se OVO NE ČUVA, vidi lib/lista.js'}
            </p>

            <div className={styles.podela}>
              {[
                ['po strani', podaci.stat.poStrani],
                ['po gradu', podaci.stat.poGradu],
              ].map(([ime, mapa]) => (
                <div key={ime}>
                  <h2 className={styles.pod}>{ime}</h2>
                  <ul className={styles.spisak}>
                    {Object.entries(mapa)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([k, v]) => (
                        <li key={k}>
                          <span>{k}</span>
                          <b>{v}</b>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>

            <h2 className={styles.pod}>prijave</h2>
            <div className={styles.tabelaOkvir}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th>ime</th>
                    <th>mejl</th>
                    <th>telefon</th>
                    <th>grad</th>
                    <th>strana</th>
                    <th>kad</th>
                  </tr>
                </thead>
                <tbody>
                  {podaci.redovi.map((r) => (
                    <tr key={r.mejl}>
                      <td>{r.ime}</td>
                      <td>{r.mejl}</td>
                      <td>{r.telefon || '—'}</td>
                      <td>{r.grad || '—'}</td>
                      <td>{r.strana || '—'}</td>
                      <td>{datum(r.upisan)}</td>
                    </tr>
                  ))}
                  {!podaci.redovi.length && (
                    <tr>
                      <td colSpan={6} className={styles.prazno}>
                        Još nema nijedne prijave.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
