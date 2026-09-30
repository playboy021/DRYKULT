# 03 — Sajt

Ovo radi Claude. Tvoje je samo ono označeno sa **[TI]**.

---

## 3.1 [TI] Pogledaj sajt — ovo je najveći rizik u celom projektu

**27. 9. 2026:** panel pregleda je prvi put proradio i Claude je snimio hero, dokaz i
Most Wanted na 1440 × 900 i 375 × 812 — raspored je po planu, fontovi pravi. Ali
snimak nije isto što i tvoje oči, a pola sajta i dalje nije viđeno u pokretu.

Otvori `drykult.com` na kompu i na telefonu, 20 minuta, i piši šta bode oči.

Šta obavezno proveri:

- [ ] Loader ide 000 → 100 i nestane (sad sa pravim logotipom i GTA brojačem)
- [x] ~~Peškir se talasa i prati kursor~~ — talasanje i let na skrol viđeni 27. 9.;
      praćenje kursora još nije
- [ ] Izbor strane radi, ekran pukne, boja se promeni svuda
- [ ] Sekcija DOKAZ — kapi se brišu prstom na telefonu
- [ ] Dugme „nazad" u browseru vraća na izbor, ne izbacuje sa sajta
- [ ] Klik na logo vraća na početno stanje
- [x] ~~1440 px i 375 px~~ — snimljeno 27. 9.; ostaje **1280 × 720** (mali laptop)
      i **1920 × 1080**
- [ ] GTA prerada: da li dijagonalna traka u hero-u smeta ili nosi; da li je peškir
      dovoljno velik sad kad ima svoju ćeliju; da li zlato + neon rade zajedno
- [ ] MOST WANTED tile u meniju hero-a vodi na sekciju

## 3.2 Brojka 850 → 1000

- [x] **Urađeno 9. 9. 2026.** — sajt, `CLAUDE.md`, `README.md` i `ProofSection`
      (536 g → **630 g**) sada nose **1000 GSM**, jer to PIŠE na fabričkom renderu
      peškira koji je na sajtu; sajt i proizvod ne smeju da govore različito.
- [ ] **I dalje obavezno:** izmeriti gramažu na uzorku (`01.5`). Ako ne izađe
      1000 — menja se broj i na sajtu i u štampi, ne kriju se razlike.

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

## 3.4a MOST WANTED — od najave do proizvoda

Sekcija postoji od 27. 9. kao **najava** (patosnice, amblemi za tablu, gedžeti),
bez cena, datuma i odbrojavanja. Da postane prodaja, treba:

- [ ] **[TI]** odluka šta se stvarno pravi prvo i sa kojim dobavljačem
- [ ] **[TI]** amblemi „za Audi · BMW · Mercedes": imena marki smeju kao
      **kompatibilnost**, ali njihovi **znakovi/logotipi su tuđi žigovi** — proizvod
      sa tuđim logom bez licence je rizik zaplene i tužbe (nije pravni savet; pitaj
      advokata za žigove pre porudžbine takve robe). Sajt zato piše samo imena.
- [ ] prave fotke (ne renderi) — isti princip kao za peškir
- [ ] tek onda kartice dobijaju cenu i dugme; do tada ostaje „u izradi"

## 3.5 Čišćenje pre lansiranja

- [x] ~~`®` → `™` ili dole~~ — **odlučeno 27. 8: ostaje `®`** (vidi `01.2`)
- [ ] `components/VersionSwitch.js` mora dole sa `/a`
- [ ] `/a` je arhiva, ima `noindex` — proveri da tako i ostane
- [x] Prepisivanje git istorije — **urađeno 27. 8** po izričitom odobrenju:
      sve poruke commit-ova prepisane bez imena bivšeg brenda, force push.

## 3.6 Kad stignu prave slike

- [ ] Vratiti `LiquidReveal` i `HeroVideo` na stranicu — kod je netaknut i čeka
- [ ] Regenerisati assete: `node scripts/gen-assets.mjs`, `gen-video.mjs`
      (izlaz sada ide u `public/hero/`, folder je prazan)
- [ ] Izrezati peškire sa bele: `node scripts/gen-drykult.mjs`

## 3.7 Pravne stranice — moraju postojati pre prve prodaje

- [ ] **Uslovi garancije od 2 godine** — od 27. 9. piše na hero-u, u traci i u
      prodaji: „desi li se peškiru bilo šta nepredviđeno u prve dve godine,
      dobijaš nov". To je pravno obavezujuća izjava čim se objavi, pa treba
      napisati: šta pokriva (i šta ne — namerno oštećenje?), kako se prijavljuje
      (poruka + fotka?), ko plaća slanje, i da ne umanjuje zakonska prava. U Srbiji
      kupac ionako ima **2 godine saobraznosti** po zakonu; naša garancija vredi
      po tome što obećava ZAMENU bez natezanja. **[TI]** potvrdi uslove, Claude piše
      stranu. Nije pravni savet — pre lansiranja neka pogleda advokat.
- [ ] Uslovi korišćenja
- [ ] Politika privatnosti (obavezno ako se skupljaju podaci kupaca)
- [ ] Reklamacije i povraćaj — u Srbiji zakon o zaštiti potrošača daje pravo na
      odustanak kod prodaje na daljinu; proveri tačan rok i uslove
- [ ] Podaci o prodavcu: pun naziv firme, adresa, PIB, matični broj, kontakt
