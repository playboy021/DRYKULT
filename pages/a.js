import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Loader from '../components/Loader';
import SiteHeader from '../components/SiteHeader';
import SideChooser from '../components/SideChooser';
import ProofSection from '../components/ProofSection';
import FactionView from '../components/FactionView';
import OrderSection from '../components/OrderSection';
import ShatterTransition from '../components/ShatterTransition';
import VersionSwitch from '../components/VersionSwitch';
import WetTransition from '../components/WetTransition';
import { detectTier, LOW } from '../lib/device';
import {
  ucitajStranu,
  upisiStranu,
  obrisiStranu,
  primeniStranu,
  peskirSlika,
  PINK,
  MAMBA,
} from '../lib/faction';
import styles from '../styles/Home.module.css';

// ARHIVA — prvi hero, podeljen ekran sa nabojem koji se puni držanjem.
//
// Glavna strana je od 18.08.2026. hero sa 3D peškirom (`/`). Ovaj se ne briše
// jer nosi mehaniku koja može zatrebati: naboj se puni što se duže držiš jedne
// strane i na 100% sam okida lom, bez klika. Ako se ta mehanika ikad vrati,
// vraća se odavde.
//
// Ne indeksira se. Prekidač dole desno vodi nazad na glavnu.
//
// Tri faze, i samo jedna je na ekranu u datom trenutku:
//   biranje  — podeljen hero, dve strane
//   lom      — ekran puca, iza njega se pojavljuje proizvod
//   prodaja  — samo izabrana strana, sa povratkom na izbor
const BIRANJE = 'biranje';
const LOM = 'lom';
const PRODAJA = 'prodaja';

export default function VerzijaA() {
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [faza, setFaza] = useState(BIRANJE);
  const [strana, setStrana] = useState(null);
  const [udar, setUdar] = useState(null); // tačka iz koje ekran puca
  const [prelaz, setPrelaz] = useState(null); // mokri prelaz na "Poruči"

  useEffect(() => {
    setTier(detectTier());
    // Zapamćena strana vodi pravo na prodaju — ko je već izabrao ne bira
    // ponovo pri svakoj poseti. Prekidač „promeni stranu" i dalje stoji.
    const s = ucitajStranu();
    if (s) {
      setStrana(s);
      primeniStranu(s);
      setFaza(PRODAJA);
    }
  }, []);

  const naVrh = () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  };

  // Zajedničko za klik i za napunjen naboj — jedina razlika je odakle puca.
  const potvrdi = useCallback((id, tacka) => {
    setStrana(id);
    upisiStranu(id);
    primeniStranu(id);
    setUdar(tacka);
    setFaza(LOM);
    // Unos u istoriju da BROWSER dugme „nazad" vraća na izbor umesto da
    // izbaci sa sajta. Bez ovoga je jedna strana bila ćorsokak za navigaciju.
    try {
      window.history.pushState({ drykult: 'prodaja' }, '');
    } catch {
      /* nije kritično */
    }
  }, []);

  const nazad = useCallback(() => {
    setFaza(BIRANJE);
    setStrana(null);
    setUdar(null);
    setPrelaz(null);
    primeniStranu(null);
    obrisiStranu();
    naVrh();
  }, []);

  // Browser „nazad" iz prodaje vraća na izbor, ne sa sajta.
  useEffect(() => {
    const onPop = () => {
      setFaza((f) => {
        if (f === BIRANJE) return f;
        setStrana(null);
        setUdar(null);
        setPrelaz(null);
        primeniStranu(null);
        obrisiStranu();
        naVrh();
        return BIRANJE;
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const lomGotov = useCallback(() => {
    setFaza(PRODAJA);
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, []);

  // Loader čeka SAMO ono što se stvarno prikaže: dva peškira. Podloge su
  // ispale kad je pozadina postala crna — preloadovale su se (597 KB na
  // desktopu) za sliku koja se više nigde ne pojavljuje.
  const preload = useMemo(() => {
    if (!tier) return [];
    const v = tier === LOW ? 'sm' : 'md';
    return [peskirSlika(PINK, tier, v), peskirSlika(MAMBA, tier, v)];
  }, [tier]);

  return (
    <>
      <Head>
        <title>DRYKULT — arhiva, prvi hero</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#07080A" />
      </Head>

      {tier && <Loader assets={preload} onDone={() => setReady(true)} />}

      {/* Traka je providna preko hero-a da sudar boja ide do vrha ekrana,
          a puna čim se pređe u prodaju. */}
      <SiteHeader
        strana={faza === PRODAJA ? strana : null}
        prozirna={faza !== PRODAJA}
        onPocetna={nazad}
        onPromeni={nazad}
      />

      <main id="vrh" className={styles.main}>
        {tier && faza !== PRODAJA && (
          <>
            <SideChooser
              tier={tier}
              ready={ready}
              izabrana={faza === LOM ? strana : null}
              onIzbor={potvrdi}
              onNaboj={potvrdi}
            />
            <ProofSection tier={tier} strana={strana} />
          </>
        )}

        {/* Redosled je namerno ovakav: proizvod, pa DOKAZ, pa tek onda forma.
            Forma pre dokaza traži poverenje koje još nije zarađeno. */}
        {tier && faza === PRODAJA && (
          <>
            <FactionView strana={strana} onPoruci={setPrelaz} />
            <ProofSection tier={tier} strana={strana} />
            <OrderSection strana={strana} />
          </>
        )}
      </main>

      {/* Alat za poređenje — skida se pre nego što sajt ide pred kupce. */}
      <VersionSwitch aktivna="a" />

      <ShatterTransition
        active={faza === LOM}
        origin={udar}
        side={strana}
        tier={tier}
        onDone={lomGotov}
      />

      <WetTransition
        active={!!prelaz}
        origin={prelaz}
        targetId="poruci"
        tier={tier}
        side={strana}
        onDone={() => setPrelaz(null)}
      />
    </>
  );
}
