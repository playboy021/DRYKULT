import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="sr">
      <Head>
        {/* Ikonice iz scripts/gen-ikone.mjs. Bez njih browser u tabu crta
            globus, a sajt dodat na početni ekran telefona dobije snimak ekrana
            umesto znaka. `sizes="any"` je za .ico koji nosi 16/32/48 odjednom. */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* theme-color NAMERNO nije ovde: postavlja ga `pages/index.js` po
            izabranoj strani. Dok je stajao i ovde — i to na #05070D, boji koja
            nije ni naša — na telefonu su postojala dva oprečna meta tag-a. */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
