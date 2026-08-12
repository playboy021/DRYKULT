import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Loader from '../components/Loader';
import Hero from '../components/Hero';
import WetTransition from '../components/WetTransition';
import OrderSection from '../components/OrderSection';
import { detectTier, heroAssets } from '../lib/device';
import styles from '../styles/Home.module.css';

export default function Home() {
  // Tier se čita tek na klijentu — na serveru nema ni ekrana ni mreže.
  // Dok je null ne crtamo hero, pa nema neslaganja između SSR-a i hidracije
  // (a i ne bismo hteli da skinemo desktop slike pa ih zamenimo mobilnim).
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [prelaz, setPrelaz] = useState(null); // {x, y} tačka klika, ili null

  useEffect(() => {
    setTier(detectTier());
  }, []);

  // Loader čeka BAŠ ono što hero prvo pokaže — ni manje ni više.
  const preload = useMemo(() => {
    if (!tier) return [];
    const a = heroAssets(tier);
    return a.mode === 'video' ? [a.poster] : [a.wet, a.dry];
  }, [tier]);

  const zavrsiPrelaz = useCallback(() => setPrelaz(null), []);

  return (
    <>
      <Head>
        <title>MEGAZ — Premium Microfiber peškir za auto</title>
        <meta
          name="description"
          content="MEGAZ premium microfiber peškir. Jedan prelaz, bez tragova i bez ogrebotina. Dostupno u Srbiji, BiH i Crnoj Gori."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {tier && <Loader assets={preload} onDone={() => setReady(true)} />}

      <main className={styles.main}>
        {tier && <Hero tier={tier} ready={ready} onOrder={setPrelaz} />}

        {/* Privremeno odredište za "Vidi na delu" — sledeća sekcija po MAŠINI. */}
        <section id="demo" className={styles.next}>
          <p className={styles.nextKicker}>Sledeće</p>
          <h2 className={styles.nextTitle}>Šta je ovo</h2>
          <p className={styles.nextBody}>
            Ovde ide sekcija „šta je ovo" — dve-tri rečenice, pa proizvod. Hero je zaključan, ostalo se gradi
            sekciju po sekciju.
          </p>
        </section>

        <OrderSection />
      </main>

      <WetTransition
        active={!!prelaz}
        origin={prelaz}
        targetId="poruci"
        tier={tier}
        onDone={zavrsiPrelaz}
      />
    </>
  );
}
