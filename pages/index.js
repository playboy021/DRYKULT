import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Loader from '../components/Loader';
import SiteHeader from '../components/SiteHeader';
import HeroB from '../components/HeroB';
import ProofSection from '../components/ProofSection';
import FactionView from '../components/FactionView';
import OrderSection from '../components/OrderSection';
import ShatterTransition from '../components/ShatterTransition';
import WetTransition from '../components/WetTransition';
import { detectTier, LOW } from '../lib/device';
import {
  upisiStranu,
  obrisiStranu,
  primeniStranu,
  peskirSlika,
  STRANE,
  PINK,
  MAMBA,
} from '../lib/faction';
import styles from '../styles/Home.module.css';

// GLAVNA STRANA.
//
// Hero je 3D peškir koji prati kursor (`HeroB` + `TowelStage`). Kartice sa
// strane samo PRIKAZUJU stranu — peškir se obrne 720° i zameni teksturu na
// vrhu obrta — a potvrđuje se dugmetom „Poruči". Potvrda pokreće lom ekrana
// i vodi na prodaju izabrane strane.
//
// Prethodni hero (podeljen ekran sa nabojem koji se puni držanjem) živi kao
// arhiva na `/a`. Nije obrisan jer se iz njega može vratiti mehanika naboja
// ako zatreba; ne indeksira se.
//
// Strana se NE pamti u localStorage dok se ne potvrdi — prelistavanje kartica
// nije izbor.

const BIRANJE = 'biranje';
const LOM = 'lom';
const PRODAJA = 'prodaja';

export default function Home() {
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [faza, setFaza] = useState(BIRANJE);
  // MAMBA se prikazuje prva. Neka od dve mora da stoji na ekranu pre izbora, a
  // neon nosi brend jače od koralne — kartice u HeroB idu istim redom.
  const [prikaz, setPrikaz] = useState(MAMBA); // strana koja se PRIKAZUJE
  const [strana, setStrana] = useState(null); // strana koja je POTVRĐENA
  const [udar, setUdar] = useState(null);
  const [prelaz, setPrelaz] = useState(null);

  useEffect(() => {
    setTier(detectTier());
    primeniStranu(PINK);
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
    return [peskirSlika(PINK, tier, 'hi'), peskirSlika(MAMBA, tier, 'hi')];
  }, [tier]);

  return (
    <>
      <Head>
        <title>DRYKULT — premium microfiber peškir za auto</title>
        <meta
          name="description"
          content="DRYKULT premium microfiber peškir za sušenje automobila. 90×70 cm, 850 GSM, twisted-loop. Dve strane: PINK i MAMBA. Srbija, BiH, Crna Gora."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Prati frakciju: na telefonu ovo boji traku browsera, pa bi fiksna
            vrednost pravila vidljiv šav na vrhu ekrana kad se podloga tonira. */}
        <meta name="theme-color" content={strana ? STRANE[strana].bg : '#07080A'} />
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
