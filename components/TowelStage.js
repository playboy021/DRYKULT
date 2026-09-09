import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MAMBA, STRANE, peskirSlika } from '../lib/faction';
import { LOW, MID, imaPokazivac } from '../lib/device';
import styles from './TowelStage.module.css';

// 3D scena hero-a.
//
// Referenca (thewatch / soda) koristi <model-viewer> i .glb, jer je njihov
// proizvod KRUT — limenka i sat se samo okreću. Peškir je TKANINA: kruti model
// bi bio ravna ploča koja rotira, i to bi ga prikazalo kao karton.
//
// Zato je ovde ravan sa podelom čiji vertex shader talasa mrežu, obučena
// NAŠOM PRAVOM teksturom proizvoda — od 9. 9. 2026. to je fabrički render
// zelenog peškira sa crnom štampom, VODORAVAN (1,356:1). Odnos strana se ČITA
// iz teksture kad stigne, ne piše se ovde: prošla verzija je imala upisan
// 1000/1286 i prva slika drugog formata bi izdužila logo.
//
// Oko peškira su KAPI VODE u 3D — prave tačke u sceni, sa dubinom: prolaze
// iza peškira i ispred njega, i dubinski bafer ih zaklanja tamo gde treba.
// CSS mehurići iz prve verzije su bili ravni sloj preko svega; ovi žive u
// istom prostoru kao proizvod.
//
// LET NA SKROL (samo sa pokazivačem, ZAKON 4.2 — telefon nema scrub): dok se
// hero skroluje, peškir se izvija, podiže i tone u providnost, a kapi ubrzaju
// nagore. Kao kod thewatch — proizvod ne stoji dok stranica prolazi pored njega.

const KAPI = { [LOW]: 0, [MID]: 150, high: 280 };

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
  uniform sampler2D uMap;
  uniform float uSjaj;
  uniform float uAlfa;
  varying vec2 vUv;
  varying float vNagib;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    if (c.a < 0.02) discard;
    // Prelomi tkanine hvataju svetlo: gde je talas najizraženiji, tu je i
    // odsjaj. To je ono što ravnu sliku pretvara u krpu.
    c.rgb += vNagib * uSjaj;
    c.a *= uAlfa;
    gl_FragColor = c;
  }
`;

// Kap: tačka koja se crta kao kuglica — providno telo, obod u boji frakcije,
// beli odsjaj gore-levo. Veličina u pikselima opada sa dubinom, pa se i bez
// ijednog poligona vidi šta je blizu a šta daleko.
const KAP_VERT = /* glsl */ `
  attribute float aVel;
  uniform float uPix;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aVel * uPix / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const KAP_FRAG = /* glsl */ `
  uniform vec3 uBoja;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d = length(q);
    if (d > 0.5) discard;
    float telo = 1.0 - smoothstep(0.42, 0.5, d);
    float rub = smoothstep(0.26, 0.5, d) * telo;
    float sjaj = 1.0 - smoothstep(0.0, 0.2, length(q - vec2(-0.13, -0.15)));
    vec3 c = uBoja * (0.3 + rub * 0.9) + vec3(1.0) * sjaj;
    float a = telo * (0.08 + rub * 0.5 + sjaj * 0.85);
    gl_FragColor = vec4(c, a);
  }
`;

export default function TowelStage({ tier, strana, izabrana, onTilt }) {
  const hostRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Let na skrol traži pokazivač: bez njega nema ni skroba ni praćenja.
    const letenje = imaPokazivac() && !reduced && tier !== LOW;

    const scena = new THREE.Scene();
    const kamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    kamera.position.z = 6;

    const render = new THREE.WebGLRenderer({ alpha: true, antialias: tier !== LOW });
    render.setPixelRatio(Math.min(window.devicePixelRatio, tier === LOW ? 1.5 : 2));
    host.appendChild(render.domElement);

    // --- peškir ---------------------------------------------------------------
    const VIS = 3.1;
    let odnos = 1.356; // rezerva do dolaska teksture; prava vrednost se čita iz slike
    let osnovna = 1; // skala da peškir stane u kadar
    const vidno = { w: 1, h: 1 }; // vidljivi prostor na z = 0

    const uklopi = () => {
      // 84% vidljive širine i 90% visine — koliko god da je ekran uzak,
      // peškir ostaje ceo u kadru umesto da ga kamera seče.
      osnovna = Math.min(1, (0.84 * vidno.w) / (VIS * odnos), (0.9 * vidno.h) / VIS);
    };

    const ucitaj = new THREE.TextureLoader();
    const peskir = new THREE.Mesh();
    const postaviOdnos = (o) => {
      odnos = o;
      peskir.geometry?.dispose();
      peskir.geometry = new THREE.PlaneGeometry(VIS * odnos, VIS, 48, 36);
      uklopi();
    };
    const tex = ucitaj.load(peskirSlika(MAMBA, tier, 'hi'), (t) => {
      if (t.image?.width && t.image?.height) postaviOdnos(t.image.width / t.image.height);
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    postaviOdnos(odnos);

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTalas: { value: 1 },
        uMap: { value: tex },
        uSjaj: { value: 0.28 },
        uAlfa: { value: 1 },
      },
    });
    peskir.material = mat;
    const grupa = new THREE.Group();
    grupa.add(peskir);
    scena.add(grupa);

    // --- kapi -----------------------------------------------------------------
    const brojKapi = KAPI[tier] ?? KAPI.high;
    const boja = new THREE.Color(STRANE[MAMBA].core);
    const poz = new Float32Array(brojKapi * 3);
    const vel = new Float32Array(brojKapi);
    const kapi = [];
    for (let i = 0; i < brojKapi; i++) {
      // Dubina ide od -2.6 (iza peškira) do +2.4 (ispred). Peškir je na 0 sa
      // depthWrite, pa kapi iza njega stvarno nestaju iza tkanine.
      const k = {
        x: (Math.random() - 0.5) * 9,
        y: (Math.random() - 0.5) * 7,
        z: (Math.random() - 0.5) * 5 - 0.1,
        brz: 0.12 + Math.random() * 0.3,
        faza: Math.random() * Math.PI * 2,
        ox: 0,
        oy: 0,
      };
      kapi.push(k);
      vel[i] = 0.05 + Math.pow(Math.random(), 1.6) * 0.19; // mnogo sitnih, malo krupnih
    }
    const kapGeo = new THREE.BufferGeometry();
    kapGeo.setAttribute('position', new THREE.BufferAttribute(poz, 3));
    kapGeo.setAttribute('aVel', new THREE.BufferAttribute(vel, 1));
    const kapMat = new THREE.ShaderMaterial({
      vertexShader: KAP_VERT,
      fragmentShader: KAP_FRAG,
      transparent: true,
      depthWrite: false, // kapi ne zaklanjaju jedna drugu
      depthTest: true, // ali ih peškir zaklanja
      uniforms: {
        uPix: { value: 400 },
        uBoja: { value: boja },
      },
    });
    const tacke = new THREE.Points(kapGeo, kapMat);
    tacke.frustumCulled = false;
    if (brojKapi) scena.add(tacke);

    // --- veličina -------------------------------------------------------------
    let hostH = 1;
    const razmeri = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      hostH = h;
      render.setSize(w, h, false);
      kamera.aspect = w / h;
      // Na uskom ekranu se kamera odmiče da peškir ne izađe iz kadra.
      kamera.position.z = w / h < 0.9 ? 8.4 : 6;
      kamera.updateProjectionMatrix();
      vidno.h = 2 * Math.tan((kamera.fov * Math.PI) / 360) * kamera.position.z;
      vidno.w = vidno.h * kamera.aspect;
      uklopi();
      // gl_PointSize je u pikselima BAFERA, pa množi i pixel ratio
      kapMat.uniforms.uPix.value = h * 0.62 * render.getPixelRatio();
    };
    razmeri();
    const ro = new ResizeObserver(razmeri);
    ro.observe(host);

    // --- kursor ---------------------------------------------------------------
    const mis = { x: 0, y: 0 };
    const glatko = { x: 0, y: 0 };
    let misAktivan = false;
    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      mis.x = (e.clientX - r.left) / r.width - 0.5;
      mis.y = (e.clientY - r.top) / r.height - 0.5;
      misAktivan = true;
      onTilt?.(mis.x + 0.5);
    };
    const onLeave = () => {
      mis.x = 0;
      mis.y = 0;
      misAktivan = false;
    };
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });

    // --- prebacivanje strane --------------------------------------------------
    // Zadržano za trenutak kad se druga strana otključa: obrt od 720° sa
    // zamenom teksture na vrhu. Zaključana strana se ignoriše.
    let obrt = 0;
    let zamena = null;
    apiRef.current = {
      prebaci(nova) {
        if (zamena || !nova || STRANE[nova]?.zakljucano || nova === MAMBA) return;
        zamena = { t: 0 };
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

      // Napredak skrola kroz hero, ublažen. 0 na vrhu, 1 kad hero izađe.
      const p = letenje ? Math.min(1, Math.max(0, window.scrollY / (hostH * 0.85))) : 0;
      const pe = p * p * (3 - 2 * p);

      if (zamena) {
        zamena.t += dt;
        const q = Math.min(1, zamena.t / 1.5);
        obrt = q * Math.PI * 4;
        if (q >= 1) {
          obrt = 0;
          zamena = null;
        }
      }

      mat.uniforms.uTime.value = t;
      // U letu tkanina leprša jače, i tone u providnost — ne nestaje naglo.
      mat.uniforms.uTalas.value = 1 + pe * 1.3;
      mat.uniforms.uAlfa.value = 1 - pe * 0.92;

      // Peškir prati kursor sa ograničenim uglom — preko toga se vidi da je
      // ravan, a ne tkanina. Na skrol se izvija, diže i odlazi ka kameri.
      grupa.rotation.y = glatko.x * 0.9 + obrt + pe * Math.PI * 0.7;
      grupa.rotation.x = glatko.y * 0.5 - pe * 0.42;
      grupa.rotation.z = pe * 0.22;
      grupa.position.y = Math.sin(t * 0.8) * 0.12 + pe * 2.4;
      grupa.position.z = pe * 1.2;

      // Izabrana strana: peškir se primakne i smiri.
      const cilj = izabrana ? 1.12 : 1;
      const zeljena = osnovna * cilj * (1 - pe * 0.25);
      grupa.scale.x += (zeljena - grupa.scale.x) * Math.min(1, dt * 3);
      grupa.scale.y = grupa.scale.z = grupa.scale.x;

      // --- kapi ---------------------------------------------------------------
      if (brojKapi) {
        const mx = glatko.x * vidno.w;
        const my = -glatko.y * vidno.h;
        const ubrzanje = 1 + pe * 7;
        for (let i = 0; i < brojKapi; i++) {
          const k = kapi[i];
          k.y += k.brz * ubrzanje * dt;
          k.x += Math.sin(t * 0.9 + k.faza) * 0.16 * dt;

          // Odbijanje od pokazivača — samo kapi blizu ravni peškira, jer
          // kursor živi u toj ravni; daleke ne reaguju i to je tačno.
          let cx = 0;
          let cy = 0;
          if (misAktivan && Math.abs(k.z) < 1.4) {
            const dx = k.x - mx;
            const dy = k.y - my;
            const d = Math.hypot(dx, dy);
            if (d < 1.2 && d > 0.001) {
              const sila = (1.2 - d) / 1.2;
              cx = (dx / d) * sila * 0.9;
              cy = (dy / d) * sila * 0.9;
            }
          }
          k.ox += (cx - k.ox) * Math.min(1, dt * 5);
          k.oy += (cy - k.oy) * Math.min(1, dt * 5);

          if (k.y > 3.8) {
            k.y = -3.8;
            k.x = (Math.random() - 0.5) * 9;
          }
          poz[i * 3] = k.x + k.ox;
          poz[i * 3 + 1] = k.y + k.oy;
          poz[i * 3 + 2] = k.z;
        }
        kapGeo.attributes.position.needsUpdate = true;
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
      peskir.geometry?.dispose();
      mat.dispose();
      tex.dispose();
      kapGeo.dispose();
      kapMat.dispose();
      render.dispose();
      if (render.domElement.parentNode) render.domElement.parentNode.removeChild(render.domElement);
    };
    // `strana` namerno NIJE u zavisnostima — promena strane ide kroz
    // apiRef.prebaci() da bi se odigrala animacija umesto ponovnog montiranja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, izabrana]);

  useEffect(() => {
    apiRef.current?.prebaci(strana || MAMBA);
  }, [strana]);

  return <div ref={hostRef} className={styles.host} aria-hidden="true" />;
}
