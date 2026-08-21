# 03 — Sajt

Ovo radi Claude. Tvoje je samo ono označeno sa **[TI]**.

---

## 3.1 [TI] Pogledaj sajt — ovo je najveći rizik u celom projektu

Sedamnaest commit-ova, a panel pregleda se u Claude-ovom okruženju **nijednom nije
pokrenuo** (razlog: skriven panel → nema `requestAnimationFrame` → nema hidracije;
detaljno u `CLAUDE.md`, „Zamke okruženja"). Provereno je samo ono što ne traži
kompoziciju: build prolazi čist, veličine asseta izmerene, konzola bez grešaka.

**Niko živ još nije video taj sajt.**

Otvori `drykult.vercel.app` na kompu i na telefonu, 20 minuta, i piši šta bode oči.

Šta obavezno proveri:

- [ ] Loader ide 000 → 100 i nestane
- [ ] Peškir se talasa i prati kursor
- [ ] Izbor strane radi, ekran pukne, boja se promeni svuda
- [ ] Sekcija DOKAZ — kapi se brišu prstom na telefonu
- [ ] Dugme „nazad" u browseru vraća na izbor, ne izbacuje sa sajta
- [ ] Klik na logo vraća na početno stanje
- [ ] 1440 px i 375 px

## 3.2 Brojka 850 → 1000

Sajt na više mesta još računa sa **850 GSM**:

- [ ] `CLAUDE.md` — specifikacija
- [ ] `components/ProofSection.js` — iz 850 izvodi **536 g** (850 × 0,63 m²)
- [ ] `README.md`

Na 1000 g/m² to postaje **630 g**. Menja se **tek kad se gramaža izmeri na uzorku**
(`01.5`) — ne pre.

## 3.3 Fontovi — najteži asset na sajtu

Trenutno **302 KB**. Self-hosting sa subsetovanjem (`pyftsubset`, samo latinica +
latin-ext) obara Archivo sa 172 KB na oko 8 KB.

- [ ] Skini Archivo i Inter, subsetuj, posluži lokalno
- [ ] Zadrži `latin-ext` — tu su **š đ č ć ž**, bez njih naslovi vidno skaču

Čist dobitak, ništa se vizuelno ne menja.

## 3.4 Sekcije koje nisu napravljene

Iz `CLAUDE.md`, otvoreno pitanje 5:

- [ ] **Mikroskop na skrol** — zumiranje u tkaninu do preseka vlakna.
      Upozorenje: `reactStrictMode` je uključen, a pinovanje (GSAP ScrollTrigger
      `pin:true`) se sudara sa dvostrukim pokretanjem efekata. Očekuj taj sudar.
- [ ] **Test tragova** — klizač, obična krpa protiv DRYKULT. Traži prave snimke (`05`).
- [ ] **Ritual** — kako se peškir koristi, korak po korak
- [ ] **Okretanje peškira** — crna strana ↔ plišano naličje. Blokira: fotka
      plišanog naličja razvučenog (`05`).
- [ ] **Numerisani komadi** — ako se odluči u `02.5`

## 3.5 Čišćenje pre lansiranja

- [ ] `®` → `™` ili dole, tri mesta (vidi `01.2`)
- [ ] `components/VersionSwitch.js` mora dole sa `/a`
- [ ] `/a` je arhiva, ima `noindex` — proveri da tako i ostane
- [ ] Prepisivanje git istorije: commit `7fbfdff` se zove „MEGAZ hero…".
      Traži force push, briše postojeću istoriju na GitHub-u i pokreće nove
      Vercel deploy-eve. **Čeka tvoju izričitu potvrdu.**

## 3.6 Kad stignu prave slike

- [ ] Vratiti `LiquidReveal` i `HeroVideo` na stranicu — kod je netaknut i čeka
- [ ] Regenerisati assete: `node scripts/gen-assets.mjs`, `gen-video.mjs`
      (izlaz sada ide u `public/hero/`, folder je prazan)
- [ ] Izrezati peškire sa bele: `node scripts/gen-drykult.mjs`

## 3.7 Pravne stranice — moraju postojati pre prve prodaje

- [ ] Uslovi korišćenja
- [ ] Politika privatnosti (obavezno ako se skupljaju podaci kupaca)
- [ ] Reklamacije i povraćaj — u Srbiji zakon o zaštiti potrošača daje pravo na
      odustanak kod prodaje na daljinu; proveri tačan rok i uslove
- [ ] Podaci o prodavcu: pun naziv firme, adresa, PIB, matični broj, kontakt
