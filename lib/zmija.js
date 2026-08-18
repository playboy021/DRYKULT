import * as THREE from 'three';

// ZMIJA — proceduralna, bez ijedne fotografije.
//
// Telo je cev po Catmull-Rom krivoj, a krljušt se crta u fragment shaderu.
// Tako nema izrezivanja, nema tuđeg materijala, a krljušt i boja su nam
// potpuno pod kontrolom — što je i cela poenta MAMBA frakcije.
//
// Krivа je namerno provučena IZA peškira (z ispod njegovog), pa je zmija tamo
// stvarno zaklonjena dubinskim baferom. To je ono što isečak sa slike nikad ne
// bi mogao, i razlog zašto ova ideja radi baš u 3D sceni.
//
// Četiri faze u krug:
//   PUTUJE     izlazi iz levog zida, prolazi ispod peškira, ulazi u desni
//   SAKRIVENA  nema je
//   VIRI       samo glava proviri iz desnog zida i gleda u posmatrača
//   SMIRAJ     povuče se, pa ispočetka

const FAZE = { PUTUJE: 0, SAKRIVENA: 1, VIRI: 2, SMIRAJ: 3 };
const TRAJANJE = [3.8, 4.5, 2.8, 3.2];

const POLUPRECNIK = 0.12;
const OKO_LJUSPI = 14; // koliko ljuspi stane oko obima
const IZDUZENJE = 1.8; // ljuspa je toliko puta duža ka repu nego što je široka
// Redovi ljuspi padaju pod ~35° na osu tela. Izmereno strukturnim tenzorom sa
// makro kadra prave zelene zmije (dominantne ivice 55.5° → redovi 145.5°).
// Nagib se dobija smicanjem rešetke: ćelija se po jednom redu pomeri za ovoliko.
const NAGIB = 0.7857; // = 1 / tan(35°) / IZDUZENJE

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vNormalObj;
  varying vec3 vPogled;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    // Normala u prostoru objekta nam treba da znamo gde je TRBUH. Iz uv-a se to
    // ne vidi: TubeGeometry svoj okvir vrti duž krive, pa v = 0 nije "dole".
    vNormalObj = normalize(normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPogled = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

// Jedan shader služi i telo i glavu. Razlika je samo u tome što telo ima
// pomični prozor vidljivosti (`GLAVA` isključuje taj deo), pa glava ostaje
// neprozirna i uredno piše dubinu.
const FRAG = /* glsl */ `
  uniform vec3 uTamna;
  uniform vec3 uSvetla;
  uniform vec3 uMrak;
  uniform vec3 uTrbuh;
  uniform vec2 uGustina;   // ljuspi duž tela × oko obima
  uniform float uNagib;    // smicanje rešetke — daje dijagonalne redove
  uniform float uGlava;    // gde je glava duž cevi (0..1)
  uniform float uDuzina;   // koliki deo cevi je vidljiv
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vNormalObj;
  varying vec3 vPogled;

  float sum(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float a = 1.0;
    #ifndef GLAVA
      // Vidljiv je samo POJAS iza glave — telo se tako "izvlači" iz zida i
      // uvlači u drugi, bez ijedne dodatne geometrije.
      float d = uGlava - vUv.x;
      if (d < 0.0 || d > uDuzina) discard;
      // Rep se stanjuje u providnost, glava je puna.
      a = smoothstep(0.0, 0.05, d) * (1.0 - smoothstep(uDuzina - 0.16, uDuzina, d));
    #endif

    // KRLJUŠT. Redovi idu DIJAGONALNO — to je jedina razlika između krljušti i
    // tapete, i prva verzija je baš to promašila. Smicanje je namerno izabrano
    // tako da po punom obilasku ispadne ceo broj ćelija, pa nema šava na mestu
    // gde se v obavije oko cevi.
    vec2 g = vUv * uGustina;
    g.x += g.y * uNagib;
    vec2 celija = floor(g);
    vec2 f = fract(g) - 0.5;

    // Superelipsa, izdužena ka repu. Oštar romb izgleda kao harlekin, a preniska
    // potencija kao zrno pirinča — prava ljuspa je zaobljen pravougaonik.
    float r = pow(abs(f.x * 1.3), 2.0) + pow(abs(f.y * 2.2), 2.0);
    float telo = 1.0 - smoothstep(0.34, 1.0, r);
    float sav = 1.0 - telo;

    // Senka preklapanja: ljuspu na strani ka glavi pokriva prethodna, pa je
    // tamnija. To je detalj koji obrazac odvaja od proste rešetke.
    float senka = smoothstep(-0.6, 0.15, f.x);
    // Kobilica — svetla linija po sredini ljuspe, kao kod mambe.
    float kobilica = (1.0 - smoothstep(0.0, 0.18, abs(f.y))) * 0.3;
    // Nijedna ljuspa nije ista kao susedna.
    float sjaj = 0.72 + sum(celija) * 0.42;
    float m = clamp((telo * (0.42 + senka * 0.58) + kobilica * telo) * sjaj, 0.0, 1.0);

    // TRBUH. Odozdo zmija nema krljušt nego široke poprečne ploče, svetlije od
    // leđa. Bez toga telo izgleda kao da je isto sa svih strana, a nije.
    float trbuh = smoothstep(-0.15, -0.72, vNormalObj.y);
    float pu = fract(vUv.x * uGustina.x);
    // Šav između ploča je tanka tamnija linija, ne crna pruga — na referentnom
    // kadru se jedva nazire.
    float ploca = 0.38 + 0.62 * smoothstep(0.02, 0.16, pu) * (1.0 - smoothstep(0.84, 0.98, pu));
    m = mix(m, ploca * 0.92, trbuh);
    sav *= 1.0 - trbuh;
    vec3 ton = mix(uSvetla, uTrbuh, trbuh);

    // Svetlo pada odozgo-napred, pa su leđa u polusenci a donji bok najsvetliji —
    // tako je i na referentnom kadru.
    float lice = abs(dot(normalize(vNormal), normalize(vPogled)));
    float lam = clamp(dot(vNormalObj, normalize(vec3(-0.3, 0.85, 0.45))) * 0.5 + 0.5, 0.0, 1.0);
    float osv = clamp(pow(lam, 1.1) * 0.75 + lice * 0.35, 0.0, 1.0);
    // Vrlo tanak neonski rub, samo da se silueta ne izgubi na crnoj pozadini.
    float rub = pow(1.0 - lice, 8.0);

    vec3 osnova = mix(uMrak, uTamna, osv);
    vec3 boja = mix(osnova, ton, clamp(m * 0.9 * osv, 0.0, 1.0));
    boja *= 1.0 - sav * 0.18;
    boja += ton * rub * 0.5;

    gl_FragColor = vec4(boja, a);
  }
`;

export function napraviZmiju({ boja, bojaTamna, tier }) {
  const grupa = new THREE.Group();

  // Kriva: iz levog zida, napred ka gledaocu, pa DUBOKO iza peškira,
  // pa opet napred i u desni zid. Peškir je oko z = 0, pa je -1.6 sigurno iza.
  const kriva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.2, -0.35, -0.6),
    new THREE.Vector3(-4.6, -0.75, 0.9),
    new THREE.Vector3(-2.4, -0.35, 1.0),
    new THREE.Vector3(-0.9, -1.05, -0.4),
    new THREE.Vector3(0.1, -0.75, -1.6),
    new THREE.Vector3(1.1, -1.15, -0.4),
    new THREE.Vector3(2.6, -0.4, 1.0),
    new THREE.Vector3(4.8, -0.8, 0.85),
    new THREE.Vector3(7.2, -0.35, -0.6),
  ]);

  const segmenata = tier === 'low' ? 90 : tier === 'mid' ? 140 : 200;
  const oko = tier === 'low' ? 10 : 16;
  const geo = new THREE.TubeGeometry(kriva, segmenata, POLUPRECNIK, oko, false);

  // Gustina se IZVODI iz geometrije, ne pogađa. Prva verzija je imala zadatih
  // 210 × 13 i ljuspe su ispale 34 puta izduženije nego široke — čiste pruge.
  const obim = 2 * Math.PI * POLUPRECNIK;
  const sirinaLjuspe = obim / OKO_LJUSPI;
  const duzLjuspi = Math.round(kriva.getLength() / (sirinaLjuspe * IZDUZENJE));

  const mrak = new THREE.Color(bojaTamna).multiplyScalar(0.34);
  const trbuh = new THREE.Color(boja).lerp(new THREE.Color(0xffffff), 0.2);

  // Smicanje mora da po punom obilasku da CEO broj ćelija, inače se na spoju
  // v = 1 → 0 vidi šav preko cele zmije.
  const nagibZa = (oko) => Math.round(oko * NAGIB) / oko;

  const uniforme = ([du, oko]) => ({
    uTamna: { value: new THREE.Color(bojaTamna) },
    uSvetla: { value: new THREE.Color(boja) },
    uMrak: { value: mrak.clone() },
    uTrbuh: { value: trbuh.clone() },
    uGustina: { value: new THREE.Vector2(du, oko) },
    uNagib: { value: nagibZa(oko) },
    uGlava: { value: 0 },
    uDuzina: { value: 0.34 },
  });

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    // depthWrite ostaje uključen: bez njega bi zmija iza peškira i dalje
    // bila iscrtana preko njega, pa bi cela poenta prolaza IZA otpala.
    depthWrite: true,
    uniforms: uniforme([duzLjuspi, OKO_LJUSPI]),
  });

  const telo = new THREE.Mesh(geo, mat);
  grupa.add(telo);

  // --- glava ---------------------------------------------------------------
  // Glava nosi isti shader: baš u fazi VIRI je ona jedino što se vidi, pa bi
  // gola jednobojna kugla pojela ceo utisak krljušti.
  const glava = new THREE.Group();
  const lobanjaGeo = new THREE.SphereGeometry(0.18, tier === 'low' ? 12 : 22, tier === 'low' ? 10 : 16);
  const lobanjaMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    defines: { GLAVA: '' },
    uniforms: uniforme([26, 13]),
  });
  const lobanja = new THREE.Mesh(lobanjaGeo, lobanjaMat);
  // Spljoštena i izdužena — okrugla glava izgleda kao perla, ne kao zmija.
  lobanja.scale.set(1.5, 0.72, 1);
  glava.add(lobanja);

  const okoGeo = new THREE.SphereGeometry(0.042, 8, 8);
  const okoMat = new THREE.MeshBasicMaterial({ color: 0x0a0c08 });
  for (const s of [-1, 1]) {
    const o = new THREE.Mesh(okoGeo, okoMat);
    o.position.set(0.14, 0.062, s * 0.098);
    glava.add(o);
  }
  // Tanak neonski obod oko glave da se ne izgubi na crnom
  const oreol = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 10),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(boja),
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  oreol.scale.set(1.5, 0.72, 1);
  glava.add(oreol);
  grupa.add(glava);

  // --- rupe u zidu ----------------------------------------------------------
  // Meki sjaj na mestu ulaza i izlaza — bez njega zmija "izlazi niotkuda".
  const rupaMat = () =>
    new THREE.SpriteMaterial({
      color: new THREE.Color(boja),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  const rupaL = new THREE.Sprite(rupaMat());
  const rupaD = new THREE.Sprite(rupaMat());
  rupaL.position.set(-3.4, -0.4, -0.4);
  rupaD.position.set(3.4, -0.4, -0.4);
  rupaL.scale.setScalar(1.5);
  rupaD.scale.setScalar(1.5);
  grupa.add(rupaL, rupaD);

  let faza = FAZE.PUTUJE;
  let u = 0; // vreme unutar faze
  let zidX = 3.4; // ivica kadra; scena je javi kroz postaviZid

  const privremena = new THREE.Vector3();
  const meta = new THREE.Vector3();

  return {
    grupa,
    materijal: mat,
    postaviBoju(svetla, tamna) {
      const t = new THREE.Color(tamna);
      const s = new THREE.Color(svetla);
      const m = t.clone().multiplyScalar(0.34);
      const tr = s.clone().lerp(new THREE.Color(0xffffff), 0.2);
      for (const x of [mat, lobanjaMat]) {
        x.uniforms.uSvetla.value.copy(s);
        x.uniforms.uTamna.value.copy(t);
        x.uniforms.uMrak.value.copy(m);
        x.uniforms.uTrbuh.value.copy(tr);
      }
      oreol.material.color.copy(s);
      rupaL.material.color.copy(s);
      rupaD.material.color.copy(s);
    },
    // Scena javlja gde je ivica kadra — na širokom i na uskom ekranu nije ista,
    // a zmija mora da izbija baš odatle.
    postaviZid(x) {
      zidX = x;
      rupaL.position.x = -x;
      rupaD.position.x = x;
    },
    korak(dt, kamera) {
      u += dt;
      const traje = TRAJANJE[faza];
      const p = Math.min(1, u / traje);

      if (faza === FAZE.PUTUJE) {
        // Malo ubrzanja na sredini — zmija ne klizi ravnomerno kao voz.
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const glavaU = e * (1 + mat.uniforms.uDuzina.value);
        mat.uniforms.uGlava.value = glavaU;

        const t = Math.min(0.999, Math.max(0.001, glavaU));
        kriva.getPointAt(t, privremena);
        glava.position.copy(privremena);
        kriva.getTangentAt(t, meta);
        glava.lookAt(privremena.clone().add(meta));
        glava.visible = glavaU > 0.02 && glavaU < 0.985;

        // Rupe svetle kad glava PROĐE pored njih. Vezano za stvarni x glave, ne
        // za napredak duž krive — inače bi na svakom odnosu stranica bljesnule
        // u pogrešnom trenutku.
        const blizu = (x) => Math.max(0, 1 - Math.abs(glava.position.x - x) / 1.1);
        rupaL.material.opacity = blizu(-zidX) * 0.6;
        rupaD.material.opacity = blizu(zidX) * 0.6;
      } else if (faza === FAZE.SAKRIVENA || faza === FAZE.SMIRAJ) {
        mat.uniforms.uGlava.value = 0;
        glava.visible = false;
        rupaL.material.opacity *= 0.9;
        rupaD.material.opacity *= 0.9;
      } else if (faza === FAZE.VIRI) {
        // Samo glava izviri iz desnog zida i GLEDA u posmatrača.
        mat.uniforms.uGlava.value = 0;
        glava.visible = true;
        // izlazi, zadrži se, pa se povuče
        const izlaz = p < 0.25 ? p / 0.25 : p > 0.78 ? 1 - (p - 0.78) / 0.22 : 1;
        const meko = izlaz * izlaz * (3 - 2 * izlaz);
        // Kreće tačno sa ivice kadra i ulazi u sliku — i primiče se kameri, pa
        // deluje da vas gleda izbliza, a ne da lebdi negde pozadi.
        glava.position.set(zidX + 0.2 - meko * 1.5, -0.45 + Math.sin(u * 1.6) * 0.05, -0.3 + meko * 0.9);
        // Pogled u kameru je ono što pravi jezu — zmija zna da si tu.
        glava.lookAt(kamera.position);
        rupaD.material.opacity = meko * 0.5;
      }

      if (p >= 1) {
        u = 0;
        faza = (faza + 1) % 4;
      }
    },
    ocisti() {
      geo.dispose();
      mat.dispose();
      lobanjaGeo.dispose();
      lobanjaMat.dispose();
      okoGeo.dispose();
      okoMat.dispose();
      oreol.geometry.dispose();
      oreol.material.dispose();
      rupaL.material.dispose();
      rupaD.material.dispose();
    },
  };
}
