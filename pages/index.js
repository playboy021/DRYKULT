import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Loader from '../components/Loader';
import SideChooser from '../components/SideChooser';
import SideSwitch from '../components/SideSwitch';
import WetTransition from '../components/WetTransition';
import OrderSection from '../components/OrderSection';
import { RevealLines, RevealWords } from '../components/Reveal';
import { detectTier, LOW } from '../lib/device';
import { ucitajStranu, upisiStranu, primeniStranu, STRANE } from '../lib/faction';
import styles from '../styles/Home.module.css';

export default function Home() {
  // Tier se čita tek na klijentu — na serveru nema ni ekrana ni mreže.
  // Dok je null ne crtamo hero, pa nema neslaganja SSR-a i hidracije.
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [strana, setStrana] = useState(null);
  const [prelaz, setPrelaz] = useState(null);

  useEffect(() => {
    setTier(detectTier());
    // Zapamćena strana se primenjuje ODMAH, pre loadera — da traka loadera
    // već bude u boji frakcije i sajt te prepozna pre prvog klika.
    const s = ucitajStranu();
    if (s) {
      setStrana(s);
      primeniStranu(s);
    }
  }, []);

  const izaberi = useCallback((id) => {
    setStrana(id);
    upisiStranu(id);
    primeniStranu(id);
  }, []);

  // Loader čeka podloge hero-a — obe, jer se obe vide pre izbora.
  const preload = useMemo(() => {
    if (!tier) return [];
    const r = tier === LOW ? 'low' : tier === 'mid' ? 'md' : 'hi';
    return [
      `/drykult/plate-pink-${r}.jpg`,
      `/drykult/plate-mamba-${r}.jpg`,
      '/drykult/pink-md.png',
      '/drykult/mamba-md.png',
    ];
  }, [tier]);

  const zavrsiPrelaz = useCallback(() => setPrelaz(null), []);

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

      <main className={styles.main}>
        {tier && (
          <SideChooser
            tier={tier}
            ready={ready}
            izabrana={strana}
            onIzbor={izaberi}
            onPoruci={setPrelaz}
          />
        )}

        <section id="sta-je" className={styles.next}>
          <p className={styles.nextKicker}>Šta je DRYKULT</p>
          <RevealLines
            lines={['Nije krpa.', 'Pravilo je.']}
            as="h2"
            className={styles.nextTitle}
            stagger={110}
          />
          <RevealWords
            className={styles.nextBody}
            text="Peškir od 850 grama po kvadratu, 90 sa 70 centimetara, sa dve strane tkanine. Twisted-loop strana kupi vodu iz prve, plišana polira ono što ostane. Jedan prelaz preko panela i nema ni kapi ni traga."
          />
          <RevealWords
            className={styles.nextBody}
            text="Nema countdown-a, nema izmišljenih recenzija. Dokaz je gore — obrisao si ga sam."
          />
        </section>

        <OrderSection strana={strana} />
      </main>

      <SideSwitch izabrana={strana} onIzbor={izaberi} />

      <WetTransition
        active={!!prelaz}
        origin={prelaz}
        targetId="poruci"
        tier={tier}
        side={strana}
        onDone={zavrsiPrelaz}
      />
    </>
  );
}
