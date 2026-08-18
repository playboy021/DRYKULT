import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Loader from '../components/Loader';
import SiteHeader from '../components/SiteHeader';
import HeroB from '../components/HeroB';
import ProofSection from '../components/ProofSection';
import FactionView from '../components/FactionView';
import OrderSection from '../components/OrderSection';
import ShatterTransition from '../components/ShatterTransition';
import VersionSwitch from '../components/VersionSwitch';
import WetTransition from '../components/WetTransition';
import { detectTier, LOW } from '../lib/device';
import { upisiStranu, obrisiStranu, primeniStranu, peskirSlika, HROM, MAMBA } from '../lib/faction';
import styles from '../styles/Home.module.css';

// VERZIJA B — druga ponuda hero-a, za poređenje sa `/`.
//
// Razlika je namerna i tiče se toga KAKO se bira strana:
//   A (`/`)  — izbor je potvrda: naboj se puni držanjem, pa lom
//   B (`/b`) — kartice samo PRIKAZUJU stranu u 3D, potvrđuje se dugmetom
//
// Sve ispod hero-a je isto u obe: dokaz, sekcija za poručivanje, lom i
// mokri prelaz. Menja se samo prvi ekran, jer se samo on i poredi.
//
// Strana se ovde NE pamti u localStorage dok se ne potvrdi — prelistavanje
// kartica ne sme da promeni ono što verzija A pamti kao tvoj izbor.

const BIRANJE = 'biranje';
const LOM = 'lom';
const PRODAJA = 'prodaja';

export default function VerzijaB() {
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [faza, setFaza] = useState(BIRANJE);
  const [prikaz, setPrikaz] = useState(HROM); // strana koja se PRIKAZUJE
  const [strana, setStrana] = useState(null); // strana koja je POTVRĐENA
  const [udar, setUdar] = useState(null);
  const [prelaz, setPrelaz] = useState(null);

  useEffect(() => {
    setTier(detectTier());
    primeniStranu(HROM);
  }, []);

  const prikazi = useCallback((id) => {
    setPrikaz(id);
    primeniStranu(id);
  }, []);

  const naVrh = () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  };

  const potvrdi = useCallback(
    (tacka) => {
      setStrana(prikaz);
      upisiStranu(prikaz);
      primeniStranu(prikaz);
      setUdar(tacka);
      setFaza(LOM);
      try {
        window.history.pushState({ drykult: 'prodaja' }, '');
      } catch {
        /* nije kritično */
      }
    },
    [prikaz]
  );

  const nazad = useCallback(() => {
    setFaza(BIRANJE);
    setStrana(null);
    setUdar(null);
    setPrelaz(null);
    obrisiStranu();
    naVrh();
  }, []);

  useEffect(() => {
    const onPop = () => {
      setFaza((f) => {
        if (f === BIRANJE) return f;
        setStrana(null);
        setUdar(null);
        setPrelaz(null);
        obrisiStranu();
        naVrh();
        return BIRANJE;
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 3D scena obučava peškir teksturom pune rezolucije, pa loader mora da je
  // sačeka — inače se peškir pojavi kao prazna ravan pa tek onda dobije sliku.
  const preload = useMemo(() => {
    if (!tier) return [];
    return [peskirSlika(HROM, tier, 'hi'), peskirSlika(MAMBA, tier, 'hi')];
  }, [tier]);

  return (
    <>
      <Head>
        <title>DRYKULT — verzija B</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#07080A" />
      </Head>

      {tier && <Loader assets={preload} onDone={() => setReady(true)} />}

      <SiteHeader
        strana={faza === PRODAJA ? strana : null}
        prozirna={faza !== PRODAJA}
        onPocetna={nazad}
        onPromeni={nazad}
      />

      <main className={styles.main}>
        {tier && faza !== PRODAJA && (
          <>
            <HeroB
              tier={tier}
              ready={ready}
              strana={prikaz}
              izabrana={faza === LOM ? prikaz : null}
              onIzbor={prikazi}
              onPoruci={potvrdi}
            />
            <ProofSection tier={tier} strana={prikaz} />
          </>
        )}

        {tier && faza === PRODAJA && (
          <>
            <FactionView strana={strana} onPoruci={setPrelaz} />
            <ProofSection tier={tier} strana={strana} />
            <OrderSection strana={strana} />
          </>
        )}
      </main>

      {/* Alat za poređenje — skida se pre nego što sajt ide pred kupce. */}
      <VersionSwitch aktivna="b" />

      <ShatterTransition
        active={faza === LOM}
        origin={udar}
        side={prikaz}
        tier={tier}
        onDone={() => {
          setFaza(PRODAJA);
          naVrh();
        }}
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
