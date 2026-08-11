import { useEffect } from 'react';
import { Archivo, Inter } from 'next/font/google';
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

export default function App({ Component, pageProps }) {
  // Iznad 1920px CSS media query više ne radi — JS preuzima skaliranje.
  useEffect(() => watchRemScale(), []);

  return (
    <div className={`${display.variable} ${body.variable}`}>
      <SmoothScroll>
        <Component {...pageProps} />
      </SmoothScroll>
    </div>
  );
}
