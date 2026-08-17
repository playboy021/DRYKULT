import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Loader from '../components/Loader';
import SiteHeader from '../components/SiteHeader';
import SideChooser from '../components/SideChooser';
import ProofSection from '../components/ProofSection';
import FactionView from '../components/FactionView';
import OrderSection from '../components/OrderSection';
import ShatterTransition from '../components/ShatterTransition';
import WetTransition from '../components/WetTransition';
import { detectTier, LOW } from '../lib/device';
import {
  ucitajStranu,
  upisiStranu,
  obrisiStranu,
  primeniStranu,
  peskirSlika,
  podlogaSlika,
  HROM,
  MAMBA,
} from '../lib/faction';
import styles from '../styles/Home.module.css';

// Tri faze, i samo jedna je na ekranu u datom trenutku:
//   biranje  — podeljen hero, dve strane
//   lom      — ekran puca, iza njega se pojavljuje proizvod
//   prodaja  — samo izabrana strana, sa povratkom na izbor
const BIRANJE = 'biranje';
const LOM = 'lom';
const PRODAJA = 'prodaja';

export default function Home() {
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

  // Zajedničko za klik i za napunjen naboj — jedina razlika je odakle puca.
  const potvrdi = useCallback((id, tacka) => {
    setStrana(id);
    upisiStranu(id);
    primeniStranu(id);
    setUdar(tacka);
    setFaza(LOM);
  }, []);

  const nazad = useCallback(() => {
    setFaza(BIRANJE);
    setStrana(null);
    setUdar(null);
    primeniStranu(null);
    obrisiStranu();
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, []);

  const lomGotov = useCallback(() => {
    setFaza(PRODAJA);
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, []);

  // Loader čeka podloge hero-a i oba peškira — sve četiri se vide pre izbora,
  // pa nema smisla otkriti hero dok bilo šta od toga nije tu.
  const preload = useMemo(() => {
    if (!tier) return [];
    const v = tier === LOW ? 'sm' : 'md';
    return [
      podlogaSlika(HROM, tier),
      podlogaSlika(MAMBA, tier),
      peskirSlika(HROM, tier, v),
      peskirSlika(MAMBA, tier, v),
    ];
  }, [tier]);

  return (
    <>
      <Head>
        <title>DRYKULT — premium microfiber peškir za auto</title>
        <meta
          name="description"
          content="DRYKULT premium microfiber peškir za sušenje automobila. 90×70 cm, 850 GSM, twisted-loop. Dve strane: HROM i MAMBA. Srbija, BiH, Crna Gora."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#07080A" />
      </Head>

      {tier && <Loader assets={preload} onDone={() => setReady(true)} />}

      {/* Traka je providna preko hero-a da sudar boja ide do vrha ekrana,
          a puna čim se pređe u prodaju. */}
      <SiteHeader strana={strana} prozirna={faza !== PRODAJA} />

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
            <FactionView strana={strana} onNazad={nazad} onPoruci={setPrelaz} />
            <ProofSection tier={tier} strana={strana} />
            <OrderSection strana={strana} />
          </>
        )}
      </main>

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
