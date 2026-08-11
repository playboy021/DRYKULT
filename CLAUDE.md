# MEGAZ — scroll-driven sajt

Premium microfiber peškir za auto-detailing. IG `@megaz_official`. Tržišta: RS, BA, ME.
Poruka brenda: „broj 1 u kvalitetu Microfiber Peškira na našem tržištu".

Stanje: **hero izgrađen, vizuelno NIJE proveren u browseru** (razlog dole u „Otvorena pitanja").

---

## Pokretanje

```bash
npm run dev      # port 3210
npm run assets   # regeneriše hero slike iz assets-src/m5-towel.jpg
node scripts/gen-video.mjs   # regeneriše LOW tier video (traži ffmpeg u PATH)
```

Preview konfiguracija je u `D:\projekti\.claude\launch.json` pod imenom `megaz-dev`.

---

## Brend

### Paleta

```css
--bg:     #05070D   /* crna sa plavim tonom, iz logotipa */
--bg-2:   #0A0F1A   /* loader ploča, paneli */
--blue:   #2E7BE8   /* MEGAZ plava — okviri, glow, akcenti */
--blue-2: #4FA8FF   /* svetlija — PUNI CTA */
--water:  #8FD8FF   /* highlight kapljica */
--ink:    #F2F6FF   /* tekst */
--muted:  #8A94A6   /* sporedni tekst */
--line:   rgba(242,246,255,.10)
--edge:   #143055   /* heks pattern iz logotipa */
```

**Pravilo kontrasta (izmereno, ne procenjeno):** beo tekst na `--blue` daje 4.14:1 i pada
ispod praga. Zato puni CTA ide `--blue-2` sa tamnim tekstom `--bg` → **6.97:1**.
`--blue` ostaje samo za obrise, glow i pattern gde čitljivost nije u pitanju.
`--muted` na `--bg` je 6.2:1 — prolazi.

### Tipografija

- **Archivo** (varijabilan, osa `wdth`) za naslove. „Expanded" se dobija sa
  `font-variation-settings: 'wdth' 125` — bez te linije dobija se obična uska Archivo.
- **Inter** za telo.
- Oba sa `subsets: ['latin','latin-ext']` — **latin-ext nosi š đ č ć ž**. Bez njega
  se dijakritika renderuje iz fallback fonta i naslovi vidno „skaču".

### Naslov hero-a

```
Prevuci.          ← na LOW tieru postaje „Pogledaj."
I suvo je.
Bez ijednog traga.
```

Prvi red je **tier-svestan** (`headlineLines()` u `lib/device.js`). Na telefonu nema
kursora, pa bi „Prevuci." tražilo radnju koja ne postoji.

---

## ZAKONI

Prenešeno sa Dragon Digital sajta + naučeno ovde. Nisu predlozi.

### 4.1 Uređaj bira kvalitet, ne mi
`lib/device.js` čita signale browsera bez merenja (nema kašnjenja pri startu).
`high` / `mid` / `low`. Tier se čita **tek na klijentu** (`useEffect` u `pages/index.js`) —
dok je `null` hero se ne crta, pa nema neslaganja SSR-a i hidracije i ne skidaju se
desktop slike koje bi odmah bile zamenjene mobilnim.

### 4.2 Telefon NEMA scroll-scrub
`low` tier dobija pre-renderovan video koji se sam izvrti jednom, pa „Skroluj dalje ↓".
Rani buffer preko `IntersectionObserver` sa `rootMargin:'400px'`, puštanje na
`threshold:0.35`, uslov `!v.ended` da se ne vrti u krug, `preload="metadata"`.

### 4.4 Video `src` se postavlja u JS-u, ne u JSX-u
`components/HeroVideo.js` postavlja `v.src` u `useEffect`. U markup-u stoji samo `poster`.
Da `src` stoji u JSX-u, telefon bi počeo da vuče fajl pre nego što JS odluči koji treba.

### 4.6 Uvek poštuj
`prefers-reduced-motion` (LiquidReveal se uopšte ne montira, ostaje statična mokra slika),
`saveData`, tab u pozadini (Lenis staje, rAF petlje se gase).

### 4.7 Preloader
Prati **stvarno** učitavanje slika sa tvrdim limitom **4s**. Brojač ide brzinom tajmera
(`easeInOutCubic`, 1300ms) ali ga stvarno učitavanje može zadržati. `sessionStorage`
ključ `megaz:loaded` da se ne ponavlja. Zaključava skrol dok ne ode.

---

## Recepti

### Liquid reveal — jedno platno, ne dva

`components/LiquidReveal.js`. Donji sloj je **mokra** hauba kao običan `<img>`,
platno iznad farba **suvu** po tragu kursora. Po frejmu:

1. `destination-out` sa `rgba(0,0,0,fade)` → pojede deo postojećeg traga
2. četka (radijalni gradijent, stops `1 / 0.82 / 0` na `0 / 0.55 / 1`) → doda alfu
3. `source-in` sa **cover-slikom** → sva preostala alfa postane suva hauba

Treći korak svaki frejm iznova oboji ceo trag, pa boja same četke nije bitna.
Offscreen „cover" platno postoji da korak 3 bude `drawImage` 1:1 — skaliranje originala
svaki frejm bi bilo najskuplje mesto na 2880×1620.

Parametri: `brushRadius 143` CSS px, `decay 0.016`, `dpr = min(devicePixelRatio, 2)`,
interpolacija `step = max(radius*0.3, 1)` sa najviše 60 međutačaka.

**Cover matematika mora da se poklopi u piksel sa CSS `object-fit: cover` donjeg `<img>`-a.**
Ako se razlikuje, otkriveni deo se „pomeri" i odmah se vidi da su to dve slike.

**Gašenje petlje:** posle 120 mirnih frejmova → `clearRect` i `cancelAnimationFrame`.
Fade se ubrza (×3.5) posle 60 mirnih frejmova, jer na fiksnih 0.016 trag asimptotski
stoji na ~14% i tvrdi `clearRect` bi se video kao trzaj.

**`pointer-events: none` na omotaču sadržaja je obavezan** — inače tekst hero-a hvata
`pointermove` i četka prestane da farba čim kursor pređe preko naslova.

### Izvođenje mokro/suvo iz JEDNE fotke

`scripts/gen-assets.mjs`. Nikad dve odvojene fotke: reveal farba drugu sliku preko prve,
i ako se geometrija razlikuje makar za piksel, ivica četke oda da su to dve fotke.

Zato: jedna zajednička baza (kontrast, hladne senke, vinjeta, **zrno iz fiksnog seed-a**),
pa se GRANA na `gradeDry` i `gradeWet`. Zrno mora biti identično u oba sloja — da šeta,
reveal bi „šuštao" po ivici.

**Kapljice** (naučeno kroz dva promašaja):
- Prvi pokušaj: sejane po celom kadru → izgledalo kao **sapunica koja lebdi ispred auta**.
- Filter mora biti **dvostruk**: elipsa siluete auta (`CAR_WIDE` / `CAR_TALL`, normalizovane
  koordinate) + prag luminanse `< 0.24`. Elipsa izbacuje zid i beton, prag izbacuje
  svetle delove UNUTAR elipse (staklo, felne, sam peškir).
- Alfa se **gasi ka rubu elipse** (`× min(1, inside*4)`), inače kapi prestaju po oštrom
  luku i maska se vidi kao crtež.
- Perspektiva: `persp(y) = 0.55 + 0.85*(y/h)` — bez toga je to tekstura, ne voda.
- Obrub kapi slab (0.26), jedan izvor svetla gore-levo za sve kapi.
- „Film vode" (`softenWet`) prodaje mokro jače od pojedinačnih kapi. Ali **maksimalno 0.35
  alfa** — na 0.55 se pojavi tamni oreol tamo gde silueta seče svetli beton i auto izgleda
  kao loše izrezan kolaž.

### LOW tier video

`scripts/gen-video.mjs`. **Nema animiranog peškira preko kadra** — peškir već leži na
haubi na izvornoj fotki, pa bi PNG preko toga dao dva peškira u kadru. Umesto toga se
pomera samo granica brisanja: dijagonalni val mokro → suvo, sa tankim svetlim rubom.

**GOP 60, ne 6.** Pravilo `-g 6` iz MAŠINE važi za scrub-video koji se premotava skrolom.
Ovaj se pušta jednom i nikad se ne traži poziciju. Izmereno: **2539 KB na `-g 6` protiv
419 KB na `-g 60`** — šest puta.

---

## Zamke okruženja (koštale su vremena)

### Skriven Browser panel = nema hidracije, i to bez ijedne greške u konzoli
Next u dev-u zove `hydrate({ beforeRender: displayContent })`, a `displayContent` je
FOUC-handler koji čeka `requestAnimationFrame`. Kad panel pregleda **nije prikazan**,
stranica ne kompozituje frejmove → rAF nikad ne opali → `hydrateRoot` se nikad ne pozove.

Simptomi koji vode na pogrešan trag: SSR HTML se vidi, `window.next.router` postoji,
konzola bez greške, ali nijedan `useEffect` ne radi i ništa nije klikljivo.

Provera u jednoj liniji:
```js
new Promise(r => { let n=0; requestAnimationFrame(()=>n++); setTimeout(()=>r({raf:n, vis:document.visibilityState}),1200) })
```
Ako je `raf: 0` i `vis: "hidden"` — problem je panel, ne kod. Isto pogađa Lenis,
loader i liquid reveal, jer su svi rAF-vođeni.

### `devIndicators: false` mora da ostane
Next-ov dev indikator ima trku: server pošalje `ISR_MANIFEST` preko HMR socket-a pre nego
što hidracija popuni `window.next.router.components`, pa `handleStaticIndicator` baci
`Cannot read properties of undefined (reading 'components')`. Izuzetak obori boot **pre**
`hydrateRoot`-a. Ceo indikator je iza `process.env.__NEXT_DEV_INDICATOR` — gašenjem ga nema.
Pogađa i 16.2.10 i 16.3.0.

---

## Izmereno

| Tier | Slike / video | Napomena |
|---|---|---|
| `high` | **564 KB** (wet 268.5 + dry 295.8, 1440×949) | oba se preloaduju u loaderu |
| `mid` | **269 KB** (wet 127 + dry 142, 1024×675) | |
| `low` | poster 157 KB + video 419 KB = **576 KB** | video se učitava lenjo, poster ide odmah |

Zajedničko: JS ~424 KB (nemin.), CSS 12 KB, **fontovi 302 KB** (Archivo 171.8 — latin 83.8 +
latin-ext 88.0; Inter 130.6 — latin 83.3 + latin-ext 47.3).

**Fontovi su najskuplja stavka posle slika.** Navođenje `weight: [...]` ne pomaže — Google
za Inter servira samo varijabilnu verziju, emituje se isti bajt (provereno, heševi identični).
Pravi rez je **self-host sa `pyftsubset`**: Archivo se koristi za par desetina znakova
(naslovi, cifre loadera, vodeni žig) i subset bi ga spustio sa 172 KB na ~8 KB.
Cena: build korak i obaveza da se subset osveži kad se doda novi znak u naslov.

---

## Otvorena pitanja

1. **Vizuelna provera nije urađena.** Panel pregleda je bio skriven celu sesiju, pa
   ni screenshot ni interakcija nisu mogli da se izvedu (vidi „Zamke okruženja").
   Provereno je samo ono što ne traži kompoziciju: `npm run build` prolazi čist,
   veličine asseta izmerene sa diska, konzola bez grešaka iz našeg koda.
   **Ostaje da se potvrdi:** liquid reveal u pokretu, loader 000→100, otkrivanje
   naslova, opružni hover, 1440px i 375px.

2. **Izvorna fotka je WhatsApp kopija — 941×1672, 265 KB.** Hero slike su zato
   uvećane 1.53× (1440 iz 941 širine crop-a) i biće mekše nego što treba na velikim
   ekranima. **Treba original sa telefona**, poslat kao dokument (Drive ili WhatsApp
   „kao dokument"), nikad kroz običan WhatsApp. Kad stigne: zameniti
   `assets-src/m5-towel.jpg` i pokrenuti `npm run assets` — crop je normalizovan,
   ništa u kodu se ne menja. Tada podići `TARGETS` u `gen-assets.mjs` na 1920.

3. **3D peškir (Three.js) nije napravljen.** Razlog: peškir je već u kadru na fotki,
   pa bi lebdeći 3D peškir dao dva peškira. `heroAssets()` ipak vraća `towel` putanje
   (`towel-hi.png` / `towel-md.png`, izvučene ključevanjem plavog kanala iz fotke),
   pa je sloj spreman ako se odluči za drugačiji kadar bez peškira na haubi.

4. `reactStrictMode: true` je uključen. Dragon-site ga je morao ugasiti zbog sudara
   GSAP ScrollTrigger `pin:true` sa dvostrukim pokretanjem efekata. Kad se ovde uvede
   pinovanje, očekuj isti sudar.

---

## Struktura

```
lib/device.js        tri tiera + heroAssets() + headlineLines()
lib/spring.js        rAF integrator, konfiguracije enter/hover/panel/follow
lib/scrollLock.js    stopScroll/startScroll sa brojanjem brava
lib/remScale.js      skaliranje rem-mreže iznad 1920px
lib/useSpringHover.js  hover na opruzi, gasi se na dodir

components/SmoothScroll.js   Lenis, ručna rAF petlja, scrollRestoration manual
components/Loader.js         000→100, ready zastavica
components/LiquidReveal.js   srce hero-a
components/HeroVideo.js      LOW tier
components/Reveal.js         otkrivanje po redovima / rečima / bloku
components/Hero.js           sadržaj

scripts/gen-assets.mjs   fotka → mokro/suvo par po tieru + towel cutout
scripts/gen-video.mjs    → hero-low.mp4
assets-src/m5-towel.jpg  izvorna fotka (WhatsApp kopija, vidi Otvorena pitanja)
```
