// Logotip kao inline SVG.
//
// Geometrija je ISTA kao u logo/svg — fajl koji je otišao fabrici. Putanje su
// prepisane odatle, ne crtane ponovo: header, loader i etiketa na peškiru tako
// ne mogu da se raziđu. Inline (a ne <img>) zato što prima currentColor i boji
// se kao tekst oko sebe — bez posebne verzije za svaku podlogu.

const WORDMARK =
  'M21.26 0L81.26 0L97 20L84.25 80L60 100L0 100ZM42.58 22L62.58 22L68.88 30L60.38 70L50.68 78L30.68 78ZM112.58 0L170.58 0L186.33 20L180.8 46L162.55 66L171.33 100L143.33 100L134.55 66L124.55 66L117.33 100L91.33 100ZM133.91 22L153.91 22L160.21 30L158.93 36L149.23 44L129.23 44ZM190.58 0L220.58 0L222.21 30L230.21 30L244.58 0L272.58 0L232.68 56L223.33 100L197.33 100L206.68 56ZM281.58 0L307.58 0L299.51 38L337.58 0L367.58 0L329.08 40L318.95 50L348.33 100L316.33 100L302.4 62L292.28 72L286.33 100L260.33 100ZM376.08 0L402.08 0L388.05 66L393.5 78L403.5 78L414.05 66L428.08 0L454.08 0L437.08 80L412.83 100L374.83 100L359.08 80ZM467.25 0L493.25 0L476.67 78L516.67 78L511.99 100L445.99 100ZM516.25 0L596.25 0L591.14 24L564.14 24L547.99 100L521.99 100L538.14 24L511.14 24Z';

const MARK =
  'M52.8 0L79.14 62.02L81.71 89.96L72.15 106.35L8.83 43.02ZM76.95 121.14L76.05 122.69L50.46 134.2L22.94 128.7L3.74 108.23L0 80.41L12.53 56.72Z';

export function Wordmark({ className, title = 'DRYKULT' }) {
  return (
    <svg className={className} viewBox="0 0 596.25 100" role="img" aria-label={title}>
      <path fill="currentColor" fillRule="evenodd" d={WORDMARK} />
    </svg>
  );
}

// Znak: kap presečena pod 45° i razvaljena.
export function Mark({ className }) {
  return (
    <svg className={className} viewBox="0 0 81.71 134.2" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d={MARK} />
    </svg>
  );
}
