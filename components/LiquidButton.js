import { useEffect, useRef } from 'react';
import { createSpring2, createSpring, SPRINGS } from '../lib/spring';
import styles from './LiquidButton.module.css';

// Dugme sa fizičkim ponašanjem, ne sa CSS tranzicijom.
//
// Tri sloja iluzije dubine, svaki radi drugi posao:
//   1. rotateX/rotateY prati kursor  -> ploča se naginje u prostoru
//   2. specular mrlja prati kursor   -> svetlo klizi po površini
//   3. slojevita senka ispod          -> ekstruzija, dugme ima debljinu
// Sva tri idu preko CSS promenljivih koje pomera opruga na rAF-u, pa se
// pri brzom prelasku kursora ne "resetuju" kao tranzicija.
//
// Na dodiru se sve gasi: telefon nema kursor, a naginjanje bez pokazivača
// samo troši bateriju.
export default function LiquidButton({
  children,
  variant = 'solid',
  onClick,
  href,
  type = 'button',
  className = '',
  ariaLabel,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // tilt: gde je kursor u odnosu na centar (-1..1)
    const tilt = createSpring2(0, 0, { tension: 260, friction: 22 });
    // press: 0 otpušteno, 1 pritisnuto — tvrđa opruga, pritisak mora biti oštar
    const press = createSpring(0, { tension: 520, friction: 26 });
    // glow: jačina hover sjaja
    const glow = createSpring(0, SPRINGS.hover);

    let raf = 0;
    let running = false;
    let mx = 0.5;
    let my = 0.5;

    const tick = () => {
      const a = tilt.step();
      const b = press.step();
      const c = glow.step();

      const p = press.value;
      el.style.setProperty('--rx', (tilt.y * -7).toFixed(3));
      el.style.setProperty('--ry', (tilt.x * 10).toFixed(3));
      el.style.setProperty('--press', p.toFixed(4));
      el.style.setProperty('--glow', glow.value.toFixed(4));
      el.style.setProperty('--mx', `${(mx * 100).toFixed(2)}%`);
      el.style.setProperty('--my', `${(my * 100).toFixed(2)}%`);

      if (a || b || c) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };
    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top) / r.height;
      tilt.set(mx * 2 - 1, my * 2 - 1);
      kick();
    };
    const onEnter = () => {
      glow.set(1);
      kick();
    };
    const onLeave = () => {
      tilt.set(0, 0);
      glow.set(0);
      press.set(0);
      kick();
    };
    const onDown = () => {
      press.set(1);
      kick();
    };
    const onUp = () => {
      press.set(0);
      kick();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('focus', onEnter);
    el.addEventListener('blur', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('focus', onEnter);
      el.removeEventListener('blur', onLeave);
    };
  }, []);

  const cls = `${styles.btn} ${variant === 'solid' ? styles.solid : styles.ghost} ${className}`;

  const inner = (
    <>
      {/* Sjaj koji klizi za kursorom — daje utisak glatke, tvrde površine */}
      <span className={styles.spec} aria-hidden="true" />
      {/* Tečnost koja se diže pri hover-u — veza sa temom brenda */}
      <span className={styles.fill} aria-hidden="true" />
      <span className={styles.label}>{children}</span>
    </>
  );

  if (href) {
    return (
      <a ref={ref} className={cls} href={href} onClick={onClick} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} className={cls} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}
