import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STRANE, HROM, MAMBA, peskirSlika } from '../lib/faction';
import { LOW, MID } from '../lib/device';
import styles from './TowelStage.module.css';

// 3D scena hero-a (verzija B).
//
// Referenca (thewatch / soda) koristi <model-viewer> i .glb, jer je njihov
// proizvod KRUT — limenka i sat se samo okreću. Peškir je TKANINA: kruti model
// bi bio ravna ploča koja rotira, i to bi ga prikazalo kao karton.
//
// Zato je ovde ravan sa podelom čiji vertex shader talasa mrežu, obučena
// NAŠOM PRAVOM teksturom proizvoda. Isti utisak (proizvod lebdi i prati kursor),
// ali tačniji za ono što prodajemo — i bez ijednog izmišljenog poligona.
//
// Oko peškira lebde zmije (MAMBA) ili srca (HROM), sa parallaxom i odbijanjem
// od pokazivača. Slike su generisane NA ČISTOJ CRNOJ i idu kroz aditivno
// mešanje — crno tako samo nestane, bez ijednog izrezivanja.

const SATELITA = { [LOW]: 5, [MID]: 8, high: 12 };

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uTalas;
  varying vec2 vUv;
  varying float vNagib;
  void main() {
    vUv = uv;
    vec3 p = position;
    // Tri sinusa različitih frekvencija — jedan izgleda kao zastava iz
    // udžbenika, tri daju nepravilnost tkanine.
    float w = sin(p.x * 2.2 + uTime * 1.6) * 0.15
            + sin(p.y * 1.7 - uTime * 1.1) * 0.11
            + sin((p.x + p.y) * 3.1 + uTime * 2.2) * 0.055;
    p.z += w * uTalas;
    // Nagib površine se prosleđuje da fragment može da dodá odsjaj na
    // prelomima — bez toga je talasanje geometrijski tu, a oku nevidljivo.
    vNagib = w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uMapA;
  uniform sampler2D uMapB;
  uniform float uMix;
  uniform float uSjaj;
  varying vec2 vUv;
  varying float vNagib;
  void main() {
    vec4 a = texture2D(uMapA, vUv);
    vec4 b = texture2D(uMapB, vUv);
    vec4 c = mix(a, b, uMix);
    if (c.a < 0.02) discard;
    // Prelomi tkanine hvataju svetlo: gde je talas najizraženiji, tu je i
    // odsjaj. To je ono što ravnu sliku pretvara u krpu.
    c.rgb += vNagib * uSjaj;
    gl_FragColor = c;
  }
`;

export default function TowelStage({ tier, strana, izabrana, onTilt, satelitSlike }) {
  const hostRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scena = new THREE.Scene();
    const kamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    kamera.position.z = 6;

    const render = new THREE.WebGLRenderer({ alpha: true, antialias: tier !== LOW });
    render.setPixelRatio(Math.min(window.devicePixelRatio, tier === LOW ? 1.5 : 2));
    host.appendChild(render.domElement);

    const ucitaj = new THREE.TextureLoader();
    const texA = ucitaj.load(peskirSlika(HROM, tier, 'hi'));
    const texB = ucitaj.load(peskirSlika(MAMBA, tier, 'hi'));
    for (const t of [texA, texB]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    }

    // Peškir je 1000×1286 — odnos se mora poštovati, inače se logo izduži.
    const ODNOS = 1000 / 1286;
    const VIS = 3.1;
    const geo = new THREE.PlaneGeometry(VIS * ODNOS, VIS, 40, 48);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTalas: { value: 1 },
        uMapA: { value: texA },
        uMapB: { value: texB },
        uMix: { value: strana === MAMBA ? 1 : 0 },
        uSjaj: { value: 0.35 },
      },
    });
    const peskir = new THREE.Mesh(geo, mat);
    const grupa = new THREE.Group();
    grupa.add(peskir);
    scena.add(grupa);

    // --- sateliti (zmije / srca) ---------------------------------------------
    // Opciono. Prosleđuje se par slika { hrom, mamba }; bez njih scena je
    // samo peškir. Slike se očekuju NA ČISTOJ CRNOJ jer idu kroz aditivno
    // mešanje — crno tako samo nestane, bez ijednog izrezivanja.
    const satTexH = satelitSlike?.hrom ? ucitaj.load(satelitSlike.hrom) : null;
    const satTexM = satelitSlike?.mamba ? ucitaj.load(satelitSlike.mamba) : null;
    for (const t of [satTexH, satTexM]) if (t) t.colorSpace = THREE.SRGBColorSpace;

    const brojSat = satTexH || satTexM ? SATELITA[tier] || SATELITA.high : 0;
    const sateliti = [];
    for (let i = 0; i < brojSat; i++) {
      const m = new THREE.SpriteMaterial({
        map: strana === MAMBA ? satTexM || satTexH : satTexH || satTexM,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.85,
      });
      const s = new THREE.Sprite(m);
      const ugao = (i / brojSat) * Math.PI * 2 + Math.random() * 0.5;
      const r = 2.1 + Math.random() * 1.5;
      s.userData = {
        ugao,
        r,
        y: (Math.random() - 0.5) * 3.4,
        z: (Math.random() - 0.5) * 2.6,
        brzina: 0.1 + Math.random() * 0.25,
        vel: 0.42 + Math.random() * 0.5,
        faza: Math.random() * Math.PI * 2,
        ox: 0,
        oy: 0, // odbijanje od pokazivača
      };
      s.scale.setScalar(s.userData.vel);
      scena.add(s);
      sateliti.push(s);
    }

    // --- veličina -------------------------------------------------------------
    const razmeri = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      render.setSize(w, h, false);
      kamera.aspect = w / h;
      // Na uskom ekranu se kamera odmiče da peškir ne izađe iz kadra.
      kamera.position.z = w / h < 0.9 ? 8.4 : 6;
      kamera.updateProjectionMatrix();
    };
    razmeri();
    const ro = new ResizeObserver(razmeri);
    ro.observe(host);

    // --- kursor ---------------------------------------------------------------
    const mis = { x: 0, y: 0 };
    const glatko = { x: 0, y: 0 };
    const misPx = new THREE.Vector2(-9999, -9999);
    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      mis.x = (e.clientX - r.left) / r.width - 0.5;
      mis.y = (e.clientY - r.top) / r.height - 0.5;
      misPx.set(e.clientX - r.left, e.clientY - r.top);
      onTilt?.(mis.x + 0.5);
    };
    const onLeave = () => {
      mis.x = 0;
      mis.y = 0;
      misPx.set(-9999, -9999);
    };
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });

    // --- prebacivanje strane --------------------------------------------------
    let obrt = 0; // dodatni obrt tokom zamene
    let ciljMix = strana === MAMBA ? 1 : 0;
    let zamena = null;

    apiRef.current = {
      prebaci(nova) {
        if (zamena) return;
        const kraj = nova === MAMBA ? 1 : 0;
        if (kraj === ciljMix) return;
        zamena = { t: 0, kraj, zamenjeno: false, nova };
      },
    };

    // --- petlja ----------------------------------------------------------------
    let t = 0;
    let prosli = performance.now();
    let raf = 0;

    const frejm = (sada) => {
      const dt = Math.min(0.05, (sada - prosli) / 1000);
      prosli = sada;
      if (!reduced) t += dt;

      glatko.x += (mis.x - glatko.x) * (1 - Math.pow(0.0001, dt));
      glatko.y += (mis.y - glatko.y) * (1 - Math.pow(0.0001, dt));

      if (zamena) {
        zamena.t += dt;
        const p = Math.min(1, zamena.t / 1.5);
        // Obrt od 720 stepeni; tekstura se menja na VRHU, kad je peškir
        // bočno okrenut i praktično nevidljiv — zamena se tako ne vidi.
        obrt = p * Math.PI * 4;
        if (!zamena.zamenjeno && p > 0.5) {
          zamena.zamenjeno = true;
          ciljMix = zamena.kraj;
          const nt = zamena.nova === MAMBA ? satTexM || satTexH : satTexH || satTexM;
          if (nt) for (const s of sateliti) s.material.map = nt;
        }
        if (p >= 1) {
          obrt = 0;
          zamena = null;
        }
      }

      mat.uniforms.uTime.value = t;
      mat.uniforms.uMix.value += (ciljMix - mat.uniforms.uMix.value) * Math.min(1, dt * 6);

      // Peškir prati kursor, ali sa ograničenim uglom — preko toga se vidi
      // da je ravan, a ne tkanina.
      grupa.rotation.y = glatko.x * 0.9 + obrt;
      grupa.rotation.x = glatko.y * 0.5;
      grupa.position.y = Math.sin(t * 0.8) * 0.12;

      // Izabrana strana: peškir se primakne i smiri.
      const cilj = izabrana ? 1.12 : 1;
      grupa.scale.x += (cilj - grupa.scale.x) * Math.min(1, dt * 3);
      grupa.scale.y = grupa.scale.z = grupa.scale.x;

      for (const s of sateliti) {
        const u = s.userData;
        u.ugao += u.brzina * dt;
        const x = Math.cos(u.ugao) * u.r;
        const z = Math.sin(u.ugao) * u.r + u.z;
        const y = u.y + Math.sin(t * 0.7 + u.faza) * 0.28;

        // Odbijanje od pokazivača: satelit se projektuje u ekran i beži
        // od kursora. Isto što rade sa trešnjama u referenci.
        s.position.set(x + u.ox, y + u.oy, z);
        const p = s.position.clone().project(kamera);
        const r = host.getBoundingClientRect();
        const ex = (p.x * 0.5 + 0.5) * r.width;
        const ey = (-p.y * 0.5 + 0.5) * r.height;
        const dx = ex - misPx.x;
        const dy = ey - misPx.y;
        const d = Math.hypot(dx, dy);
        let cx = 0;
        let cy = 0;
        if (d < 320 && d > 0.001) {
          const sila = (320 - d) / 320;
          cx = (dx / d) * sila * 1.1;
          cy = (-dy / d) * sila * 1.1;
        }
        u.ox += (cx - u.ox) * Math.min(1, dt * 5);
        u.oy += (cy - u.oy) * Math.min(1, dt * 5);

        // Sателiti iza peškira su prigušeni, da ne prave šum preko proizvoda.
        s.material.opacity = z < 0 ? 0.4 : 0.85;
      }

      render.render(scena, kamera);
      raf = requestAnimationFrame(frejm);
    };
    raf = requestAnimationFrame(frejm);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        prosli = performance.now();
        raf = requestAnimationFrame(frejm);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      geo.dispose();
      mat.dispose();
      texA.dispose();
      texB.dispose();
      satTexH?.dispose();
      satTexM?.dispose();
      for (const s of sateliti) s.material.dispose();
      render.dispose();
      if (render.domElement.parentNode) render.domElement.parentNode.removeChild(render.domElement);
    };
    // `strana` namerno NIJE u zavisnostima — promena strane ide kroz
    // apiRef.prebaci() da bi se odigrala animacija umesto ponovnog montiranja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, izabrana]);

  useEffect(() => {
    apiRef.current?.prebaci(strana || HROM);
  }, [strana]);

  return <div ref={hostRef} className={styles.host} aria-hidden="true" />;
}
