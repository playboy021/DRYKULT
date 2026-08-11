import { useEffect, useRef } from 'react';

// Otkrivanje se pušta JEDNOM. Osmatrač se odjavljuje čim okine —
// da tekst ne "trepće" kad korisnik skroluje gore-dole.
//
// `ready` je brava loadera: dok loader stoji, hero je iza njega i ne sme
// da potroši svoju animaciju. Zato osmatrač i ne kreće dok ready nije true.
function useRevealOnce(ref, ready, rootMargin = '-12% 0px') {
  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('rvOn');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, ready, rootMargin]);
}

// Po REDOVIMA — za naslove. Svaki red je maska, unutrašnji span dolazi odozdo.
export function RevealLines({ lines, as: Tag = 'h1', className, ready = true, stagger = 120, delay = 0 }) {
  const ref = useRef(null);
  useRevealOnce(ref, ready);
  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span className="rvLine" key={`${line}-${i}`}>
          <span style={{ '--d': `${delay + i * stagger}ms` }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

// Po REČIMA — za podnaslove i kraće blokove. Kraći put, brži stagger.
export function RevealWords({ text, as: Tag = 'p', className, ready = true, stagger = 35, delay = 0 }) {
  const ref = useRef(null);
  useRevealOnce(ref, ready);
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          <span className="rvWord" style={{ '--d': `${delay + i * stagger}ms` }}>
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}

// Za sve ostalo — jedan blok koji uđe kao celina.
export function RevealBlock({ children, className, ready = true, delay = 0 }) {
  const ref = useRef(null);
  useRevealOnce(ref, ready);
  return (
    <div ref={ref} className={className}>
      <span className="rvLine">
        <span style={{ '--d': `${delay}ms` }}>{children}</span>
      </span>
    </div>
  );
}
