import LiquidReveal from './LiquidReveal';
import HeroVideo from './HeroVideo';
import LiquidButton from './LiquidButton';
import { RevealLines, RevealWords, RevealBlock, RevealFade } from './Reveal';
import { heroAssets, headlineLines, LOW } from '../lib/device';
import styles from './Hero.module.css';

const SUB =
  'Jedan potez pokupi vodu koju običan peškir samo razmaže — bez vrtloga u laku i bez vlakana koja ostaju iza.';

export default function Hero({ tier, ready, onOrder }) {
  const a = heroAssets(tier);
  const lines = headlineLines(tier);

  const toDemo = (e) => {
    e.preventDefault();
    const el = document.getElementById('demo');
    if (!el) return;
    // Kroz Lenis ako postoji, da skrol ostane isti onaj glatki.
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: 0 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.hero}>
      {a.mode === 'video' ? (
        <HeroVideo src={a.video} poster={a.poster} />
      ) : (
        <LiquidReveal wet={a.wet} dry={a.dry} tier={tier} />
      )}

      {/* pointer-events:none na omotaču je OBAVEZNO — inače tekst hvata
          pointermove i četka prestane da farba čim kursor pređe preko naslova.
          Dugmad ga vraćaju na auto. */}
      <div className={styles.content}>
        <RevealBlock className={styles.kicker} ready={ready} delay={120}>
          <span className={styles.mark}>MEGAZ®</span>
          <span className={styles.dot} aria-hidden="true">
            ·
          </span>
          Premium Microfiber
        </RevealBlock>

        <RevealLines lines={lines} className={styles.title} ready={ready} stagger={120} delay={260} />

        <RevealWords text={SUB} className={styles.sub} ready={ready} stagger={35} delay={820} />

        <RevealFade className={styles.ctas} ready={ready} delay={1080}>
          <LiquidButton
            variant="solid"
            href="#poruci"
            onClick={(e) => {
              e.preventDefault();
              // Pozicija klika je izvor iz kog kapljice niču u prelazu.
              onOrder?.({ x: e.clientX, y: e.clientY });
            }}
          >
            Poruči
          </LiquidButton>
          <LiquidButton variant="ghost" href="#demo" onClick={toDemo}>
            Vidi na delu
          </LiquidButton>
        </RevealFade>

        <RevealBlock className={styles.trust} ready={ready} delay={1240}>
          <span className={styles.markets}>RS · BA · ME</span>
          <span className={styles.sep} aria-hidden="true" />
          <span>broj 1 u kvalitetu na našem tržištu</span>
        </RevealBlock>
      </div>

      {tier !== LOW && (
        <div className={styles.hint} aria-hidden="true">
          pomeri kursor preko auta
        </div>
      )}
    </section>
  );
}
