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

Sekcija postoji od 27. 9., preuređena 30. 9. na **dve kategorije**: `Patosnice`
i `Dodaci`. Sve je „u izradi" — bez cena, datuma i odbrojavanja.

### Odluke od 30. 9. (Stefan), da se ne prežvakavaju

- [x] ~~Pojasevi~~ — **izbačeni**. Pojas je deo za spašavanje života i u EU traži
      **ECE R16 homologaciju kao ceo sklop** (traka, kotur, brava, ankeri, sa
      E-oznakom). To isključuje jeftinu nabavku; ne isplati se.
- [x] **LED znak ostaje.** Problem nikad nije bio LED amblem nego **tuđ znak** na
      njemu. Naš crtež je čist. Ne sme: BMW/Audi/Mercedes rozeta, niti lik iz
      tuđeg dela — **Šaringan je iz Naruta**, isto tuđe autorsko pravo kao Hulk.
- [x] **Zatamnjenje tablice ostaje**, kao oprema **za stazu i privatan posed**.

### Zatamnjenje tablice — šta je tačno, a šta nije

Podela koju treba znati napamet, jer je od nje sve ostalo:

| | stanje |
|---|---|
| **prodaja same sprave** | nije zabranjena |
| **upotreba na javnom putu** | **prekršaj** — 10.000 RSD, u predlogu izmena **50.000 uz mogućnost oduzimanja vozila**; izričito se pominju i folije koje zbunjuju kamere |

Iz toga slede tri pravila koja se ne krše ni u jednoj objavi:

1. **Nikad ne pominjati izbegavanje kamera, kazni, parkinga ili policije.** Ta
   jedna rečenica pretvara legalan proizvod u dokaz namere. Ceo tuđi marketing
   koji smo gledali radi baš to — mi ne.
2. **Svaka slika i snimak — van puta.** Staza, privatan posed, plac. Nikad
   registarska tablica na ulici u kadru.
3. **Na proizvodu i u opisu stoji za šta je namenjen.** „Za stazu i privatan
   posed", bez zvezdice i sitnog slova.

- [ ] **[TI]** pre prve isporuke: proveriti sa advokatom da li nam treba i
      pisana izjava kupca o nameni. Nije pravni savet — ovo je pitanje za njega.

### Ostalo

- [ ] **[TI]** odluka šta se pravi prvo i sa kojim dobavljačem
- [ ] Patosnice **samo sa našim crtežom**. Hulk / Joker / Rick & Morty su tuđe
      autorsko pravo — roba se zadržava na carini, vlasnik prava tuži.
- [ ] prave fotke (ne renderi) — isti princip kao za peškir
- [ ] tek onda kartice dobijaju cenu i dugme; do tada ostaje „u izradi"

### Nabavka — nalazi istraživanja (30. 9. 2026)

Cene su sa Alibabe, orijentacione i **neproverene kod dobavljača** — služe da se
zna red veličine, ne da se po njima računa marža. Pre porudžbine se traži ponuda.

| proizvod | cena na veliko | MOQ | napomena |
|---|---|---|---|
| **Viseća ručka** (tsurikawa) | 0,50–0,92 $/kom | 10–20 kom; **sa našim logom 50** | najbrži put do „našeg" proizvoda |
| **Marker za gume**, beli | 0,30–0,80 $/kom | 1000 kom | drži do godinu dana ako se guma pripremi |
| **Patosnice**, naš crtež | 2,18–5,20 $/kom jeftiniji rez<br>15–25 $/komplet štampani | 100 kom | sublimaciona štampa je jeftin ulaz; TPE/koža skuplje |
| **LED znak**, naš crtež | 0,45–0,70 $ bez svetla<br>22–85 $ RGB sa aplikacijom | 100 kom / 1 set | ogroman raspon — zavisi da li svetli i da li ima upravljanje |
| **Svetlo za noge** | — | — | traži se ponuda |
| **Zatamnjenje tablice** | — | — | traži se ponuda |

**Šta ovo znači za redosled.** Tsurikawa je jedini proizvod koji se prilagođava
našim logom već od **50 komada** — to je jedini ulaz koji ne traži da se veže
hiljadu komada pre prve prodaje. Marker je najjeftiniji po komadu ali traži
MOQ 1000, pa je to odluka o zalihama, ne o proizvodu.

- [ ] **[TI]** tražiti ponude od 3 dobavljača po proizvodu, ne od jednog
- [ ] **[TI]** tražiti uzorak pre serije — isto pravilo kao za peškir
- [ ] uzorak se meri i fotografiše; do tada na sajtu stoje CRTEŽI, ne fotke

### Crteži opreme

`node scripts/gen-oprema.mjs` → `public/oprema/` (sedam crteža + `_provera.png`).

Namerno **linijski crtež u beloj**, ne fotografija ni AI render: nijedan od ovih
proizvoda još ne postoji u našim rukama, pa bi slika koja liči na fotku bila
tvrdnja koju ne možemo da podupremo — ista zamka koju smo već platili na peškiru.
Crtež kaže „ovo je zamisao" bez ijedne reči objašnjenja.

Isti fajlovi služe dvema stvarima: ikonice uz stavke na sajtu, i **predložak za
dobavljača** — kao što je `logo/` otišao fabrici za peškir.

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
