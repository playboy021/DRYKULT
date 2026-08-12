# MEGAZ — scroll-driven sajt

Premium microfiber peškir za auto-detailing. IG `@megaz_official`. Tržišta: RS, BA, ME.
Poruka brenda: „broj 1 u kvalitetu Microfiber Peškira na našem tržištu".

Stanje: **hero izgrađen, vizuelno NIJE proveren u browseru** (razlog dole u „Otvorena pitanja").

---

## Pokretanje

```bash
npm run dev          # port 3210
npm run assets       # hero par iz fotke (podrazumevano)
npm run assets:hd    # hero par iz kadra snimka — vidi "Izbor hero kadra"
npm run video        # LOW tier film iz pravog snimka (traži ffmpeg u PATH)
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

### LOW tier video — pravi snimak, ne sintetika

`scripts/gen-video.mjs`. Isečak iz `assets-src/video/wipe.mov` (IMG_0373): peškir prelazi
preko šoferšajbne pune tragova vode i ostavlja je kao ogledalo. Transformacija je između
**1.5s i 9.5s** izvornog snimka; pre toga se peškir tek namešta, posle je statično čisto staklo.

Prva verzija je bila nacrtan val (gradijent preko para slika). Otpala je čim je stigao pravi
materijal — nema razloga crtati ono što je snimljeno.

**Poster MORA biti prvi kadar baš tog filma**, zato ga pravi `gen-video.mjs`, a ne
`gen-assets.mjs`. Da poster dolazi iz druge slike, video bi na startu vidno preskočio.

**GOP 60, ne 6.** Pravilo `-g 6` iz MAŠINE važi za scrub-video koji se premotava skrolom.
Ovaj se pušta jednom i nikad se ne traži pozicija. Izmereno na staroj sintetici:
**2539 KB na `-g 6` protiv 419 KB na `-g 60`**.

**crf 31, ne 28.** Uporedjeni kadrovi na 720px su vizuelno nerazlučivi, a fajl pada sa
1166 KB na 795 KB. Spuštanje na 24fps skoro ne pomaže (865 KB) — kod snimka iz ruke
crf je poluga, ne frame rate.

### Razdvajanje mokro/suvo ide po ČETIRI ose

Prva verzija je menjala samo sjaj i razlika se jedva videla. Jedna osa se ne
primeti; četiri udare odjednom:

| | mokro | suvo |
|---|---|---|
| crna | **diže se** (mleko, +24) | spušta se (−7) |
| kontrast | spljošten (×0.70) | S-kriva ×1.26 |
| zasićenje | ×0.60 | ×1.30 |
| oštrina | blur, meša se 45% | unsharp `clarity()` 0.6 |

Plus hladan ton na mokrom i zadržano toplo sunce na suvom.

**Sve to važi SAMO unutar siluete auta.** Okolina — nebo, trava, ograda, zid,
beton — mora ostati piksel-identična u oba sloja. Kad se pozadina ne mrda, oko
čita „auto se osušio". Kad se menja ceo kadar, čita „druga slika" i iluzija pukne.

Maska je dvostruka, kao i za kapljice: `maskFactor()` (elipsa siluete) puta
`darkGate()` (prag luminanse). Elipsa sama nije dovoljna jer zid hale stoji IZA
auta i pada u istu elipsu — luminansa ih razdvaja tamo gde geometrija ne može.

### Izbor hero kadra — oštrina protiv površine

`gen-assets.mjs` ima dva profila: `npm run assets` (podrazumevano) i `npm run assets:hd`.

| | `foto` | `hd` |
|---|---|---|
| izvor | WhatsApp fotka 941×1672 | kadar iz IMG_0371, 1080×1920 |
| uvećanje na 1440 | 1.53× | 1.33× |
| peškir u kadru | ~15% | **~65%** |

`hd` je oštriji i logo je čitljiviji, ali peškir pojede kadar i **reveal-u ostaje samo tanak
rub laka** — a reveal je ceo smisao hero-a. Zato je podrazumevano `foto`. Oštrina koja ubija
mehaniku nije dobitak. `hd` kadar je odličan za sekciju „proizvod" kad dođe na red.

---

### MOKRI PRELAZ — klik na „Poruči"

`components/WetTransition.js`. Tri faze, ukupno 2050ms:

| faza | vreme | šta se dešava |
|---|---|---|
| SPRAY | 0–450ms | kapljice niču od tačke klika ka ivicama, iza njih `backdrop-filter` |
| WIPE | 450–1750ms | peškir prelazi zdesna nalevo, iza njega je čisto |
| SETTLE | 1750–2050 | ostatak izbledi |

**Trik koji ovo drži jednostavnim:** skok na `#poruci` se dešava POD VODOM.
Kad kapljice i zamagljenje prekriju ekran (na 4% putanje peškira), skrol se
prebaci trenutno. Peškir posle ne otkriva novu stranicu — on briše veo sa nje.
Vizuelno je isto, a nema dupliranja sekcije, dva DOM stabla ni sinhronizacije.

Otkrivanje ide preko `clip-path: inset(0 X% 0 0)` na velu i canvas-u sa
kapljicama — kompozitor to radi besplatno.

**Zamka koja bi oborila ceo prelaz:** `stopScroll()` postavlja
`html{overflow:hidden}`, a tada element nije skrolabilan pa **ni programski
`scrollTo` ne prolazi**. Zato `jumpTo()` nakratko otključa skrol, skoči, pa
zaključa nazad. Traje jedan frejm i dešava se pod vodom. Uz to Lenis treba
`{ immediate: true, force: true }` — bez `force` ignoriše scrollTo dok je stopiran.

**Brava se otpušta tačno jednom** (`locked` zastavica). Bez toga se `startScroll`
pozove i na kraju animacije i u cleanup-u, pa drugi poziv otpusti tuđu bravu.

Naučeno iz offline simulacije (renderovanje kadrova u Node-u istom matematikom,
jer se panel pregleda nije mogao otvoriti):
- **Kapljice moraju biti sitne i prigušene.** Sa `r` do 26px i obrubom 0.42
  izgledale su kao sapunica koja lebdi ispred ekrana. Sada `r` do ~11px,
  eksponent 3 u raspodeli (mnogo perli, malo krupnih), obrub 0.26.
- **Peškir na visini 1.22×H pokrivao je 84% širine** i čitao se kao plava
  zavesa. Sada 1.05×H uz nagib od −8°. Pravougaonik paralelan sa ivicom ekrana
  uvek izgleda kao UI element, ne kao stvar.
- Kontaktna senka ispred vodeće ivice je obavezna — bez nje peškir lebdi.

**Portret (telefon) traži dva ograničenja, inače prelaz tamo ne radi ništa:**

1. **Širina peškira se ograničava na `1.3 × W`.** Dimenzionisanje po visini
   (`th × 1.23`) na 390×844 daje **1086px preko ekrana od 390px** — peškir je
   2.8 puta širi od ekrana, pa se tokom celog prelaza vidi samo plava površina
   bez ijedne ivice. Nema šta da se pročita kao „briše". Sa ograničenjem: 507px.
   Na uskom ekranu se malo izduži, ali u pokretu sa talasanjem to niko ne meri.
2. **Putanja se računa iz širine peškira** (`W + tw/2 → −tw/2`), ne iz fiksnih
   procenata. Sa starim `−0.3W` je na telefonu ostajala trećina peškira
   zaglavljena u kadru na kraju animacije.

Prelaz **nikad nije bio isključen na telefonu** — nema tier-kapije, samo se broj
kapljica smanjuje. Ako izgleda da ga nema, kriva je jedna od gornje dve stvari.

`backdrop-filter` je najskuplja stavka na telefonu (GPU ga preračunava svaki
frejm), pa LOW dobija `--maxblur: 0.4rem` umesto 0.75rem. Utisak mokrog stakla
drže kapljice, ne zamućenje.

**Zvuk:** swoosh se SINTETIŠE preko Web Audio (filtrirani šum sa kovertom),
ne učitava se fajl. Klik je korisnički gest, pa je to jedini trenutak kad
browser sme da pusti zvuk — ZAKON 4.5, skrol se ne računa, klik da.

### LiquidButton

`components/LiquidButton.js`. Tri sloja iluzije dubine, svaki radi drugi posao:
`rotateX/rotateY` prati kursor (ploča se naginje), specular mrlja prati kursor
(svetlo klizi), slojevita senka se skuplja pri pritisku (dugme utone, ne samo
posvetli). Sve preko CSS promenljivih koje pomera opruga na rAF-u — pri brzom
prelasku kursora se ne resetuje kao tranzicija.

Gasi se na `pointer: coarse` i `prefers-reduced-motion`.

**Ne sme unutar `RevealBlock`** — `.rvLine` ima `overflow:hidden` i odsekao bi
sjaj i senku. Za to postoji `RevealFade` (otkrivanje bez maske).

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
| `low` | poster 108 KB + video 795 KB = **903 KB** | pravi snimak; video se učitava lenjo, poster ide odmah |

Zajedničko: JS ~424 KB (nemin.), CSS 12 KB, **fontovi 302 KB** (Archivo 171.8 — latin 83.8 +
latin-ext 88.0; Inter 130.6 — latin 83.3 + latin-ext 47.3).

**Fontovi su najskuplja stavka posle slika.** Navođenje `weight: [...]` ne pomaže — Google
za Inter servira samo varijabilnu verziju, emituje se isti bajt (provereno, heševi identični).
Pravi rez je **self-host sa `pyftsubset`**: Archivo se koristi za par desetina znakova
(naslovi, cifre loadera, vodeni žig) i subset bi ga spustio sa 172 KB na ~8 KB.
Cena: build korak i obaveza da se subset osveži kad se doda novi znak u naslov.

---

## Plaćanje — šta NIJE povezano

`components/OrderSection.js` je **samo UI**. Forma ne šalje nigde ništa.

**Broj kartice namerno NEMA svoj `<input>`.** Čim bi ga imao, podaci kartice
prolaze kroz naš DOM i naš server — to je PCI prekršaj u trenutku kad se poveže
uživo, bez obzira koliko kod izgleda uredno. Umesto polja stoji `.payMount`,
mesto gde provajder (Stripe Elements ili sličan) montira svoja hostovana polja.
Ta polja su u tuđem iframe-u i mi im nikad ne vidimo sadržaj.

Za pravu naplatu treba: nalog kod provajdera, ključevi u env varijablama
(nikad u repo-u — ovaj je javan), server ruta koja pravi PaymentIntent, i
webhook za potvrdu. Kripto ide preko zasebnog provajdera, isti princip.

**`CENA_RSD` u `OrderSection.js` je placeholder (2490).** Stoji na javnom
sajtu dok se ne zameni pravom cenom.

## Otvorena pitanja

1. **Vizuelna provera nije urađena.** Panel pregleda je bio skriven celu sesiju, pa
   ni screenshot ni interakcija nisu mogli da se izvedu (vidi „Zamke okruženja").
   Provereno je samo ono što ne traži kompoziciju: `npm run build` prolazi čist,
   veličine asseta izmerene sa diska, konzola bez grešaka iz našeg koda.
   **Ostaje da se potvrdi:** liquid reveal u pokretu, loader 000→100, otkrivanje
   naslova, opružni hover, 1440px i 375px.

2. **Izvorna fotka je i dalje WhatsApp kopija — 941×1672.** Snimci su rešili rezoluciju
   za film, ali ne i za hero: nijedan kadar nema kompoziciju celog auta iz tri četvrtine,
   a to je jedini kadar sa dovoljno laka za reveal. **Treba original te fotke sa telefona**,
   poslat kao dokument (Drive ili WhatsApp „kao dokument"), nikad kroz običan WhatsApp.
   Kad stigne: zameniti `assets-src/m5-towel.jpg`, pokrenuti `npm run assets`, pa podići
   `TARGETS` na 1920. Crop je normalizovan — ništa drugo u kodu se ne menja.

5. **Neiskorišćen materijal** (van repo-a, sirovi .MOV):
   - `IMG_0366` / `IMG_0367` — tekstura izbliza, pliš i twisted-loop strana
   - `IMG_0369` — brisanje retrovizora
   - `IMG_0363` — peškir razvučen, pokazuje veličinu
   - `IMG_0374` / `IMG_0375` — gepek, krov
   - `m5-towel-hd.jpg` — kadar iz IMG_0371, čitljiv logo, za sekciju „proizvod"

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
