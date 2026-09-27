import { useEffect } from 'react';
import { Archivo, Inter, Passion_One } from 'next/font/google';
import SmoothScroll from '../components/SmoothScroll';
import { watchRemScale } from '../lib/remScale';
import '../styles/globals.css';

// Archivo je VARIJABILAN font sa osom širine. Učitavamo osu 'wdth' i
// "Expanded" dobijamo kroz font-variation-settings: 'wdth' 125 u CSS-u.
// Zato ovde nema weight niza — varijabilna verzija pokriva ceo raspon.
const display = Archivo({
  subsets: ['latin', 'latin-ext'], // latin-ext nosi š đ č ć ž
  axes: ['wdth'],
  display: 'swap',
  variable: '--f-display',
});

// Napomena: navođenje weight: ['400','600'] ovde NE smanjuje fajl — Google
// za Inter danas servira samo varijabilnu verziju, pa se emituje isti bajt.
// Izmereno: latin 83.3 KB + latin-ext 47.3 KB. Vidi CLAUDE.md za pravi rez.
const body = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--f-body',
});

// GTA registar (duh Pricedown-a) za velike naslove. Bowlby One je bliži
// originalu, ali NEMA latin-ext — provereno na Google Fonts CSS-u 27. 9:
// Š Č Ć Ž Đ bi ispadali iz drugog fonta i "GREŠKA" bi se raspala na dva pisma.
// Passion One 900 ima latin-ext i istu težinu.
const gta = Passion_One({
  weight: '900',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--f-gta',
});

export default function App({ Component, pageProps }) {
  // Iznad 1920px CSS media query više ne radi — JS preuzima skaliranje.
  useEffect(() => watchRemScale(), []);

  // Klasa `app` je OBAVEZNA. next/font stavlja promenljive --f-display/--f-body
  // na OVAJ div, a globals.css ih tek u `.app` pretvara u --font-*. Dok su
  // --font-* bile definisane na :root, tamo var(--f-display) nije postojao,
  // cela deklaracija je bila nevažeća i CEO SAJT se crtao u Times New Roman-u.
  // Niko nije primetio jer panel pregleda nikad nije radio; otkriveno tek na
  // Stefanovom screenshotu 27. 9.
  return (
    <div className={`app ${display.variable} ${body.variable} ${gta.variable}`}>
      <SmoothScroll>
        <Component {...pageProps} />
      </SmoothScroll>
    </div>
  );
}
