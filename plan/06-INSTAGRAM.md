# 06 — Instagram

Instagram je **uvod u sajt**, ne zaseban brend. Zato ništa ovde nije nova estetika:
isti fontovi (Passion One / Archivo / Inter), iste boje, isti GTA registar. Ko vidi
objavu pa otvori sajt, mora da oseti da je ušao na isto mesto.

Sve je nacrtano skriptom: `node scripts/gen-instagram.mjs` → folder `instagram/`.
Menjaš tekst u skripti, pustiš je ponovo, sve se osveži. Ništa se ne crta rukom.

> **ODLUČENO 28. 9. 2026 (Stefan):** zid ide u pravcu **C — TRAKA**, profilna je
> **D — znak u nišanu**, biografija je **A — manifest**. Sve troje je ispod
> podebljano i izvedeno; ostale opcije ostaju zapisane samo da se zna šta je
> odbačeno i zašto, da se za pola godine ne prežvakava isto.

---

## 6.1 [TI] Ručka i nalog — prvo, dok je slobodna

- [ ] `@drykult` na Instagramu i TikToku (isto ime na oba, `plan/01` 1.3)
- [ ] Nalog neka bude **profesionalni** (Business/Creator) — bez toga nema statistike
      ni linka u profilu na starim verzijama aplikacije
- [ ] Ime naloga (polje „Ime", 30 znakova) — **to se pretražuje**, ne rasipaj ga na
      ono što već piše u ručki: `DRYKULT — peškir za auto`

## 6.2 Profilna slika — četiri opcije

Pregled: `instagram/pregled/profilna.jpg` (prikazano u pravim veličinama — krug od
110 px u zaglavlju i 32 px u feedu, na tamnoj i na svetloj temi).

| | opcija | šta dobijaš | šta gubiš |
|---|---|---|---|
| **A** | znak u neonu na crnom | brend tačno kao na sajtu | na 32 px se stapa sa tamnim feedom |
| **B** | crn znak na neon krugu | najglasnija tačka u tuđem feedu | odstupa od „crno je podloga" pravila |
| **C** | znak + ime | čita se na profilu | ime je mrlja na 32 px, znak se smanjio |
| **D** | **znak u nišanu** | **GTA HUD ton, ostaje na crnom kao i ceo brend** | traži debeo prsten da se vidi u feedu |

> **IZABRANO: D.** Jedini akcenat je neon na crnom, isto kao sajt — brend ne mora
> da menja pravila da bi se video. Prsten je **nišan**, ne ukras: čita se kao GTA
> HUD, a znak ostaje u sredini netaknut.
>
> **Prsten je prepravljen zbog 32 px.** Prva verzija je imala debljinu `0.018 × P`,
> što u feedu ispadne **pola piksela** — prsten prosto nestane i ostane sitan znak
> na crnom. Sada je `0.042` (≈ 1,4 px na 32), znak je krupniji, a četiri proreza su
> šira da se i na maloj veličini vidi da je nišan, a ne pun krug. Provereno na
> listu `instagram/pregled/profilna.jpg`, u pravim veličinama.

Fajl za postavljanje: **`instagram/profilna/profilna-d.png`** (1080 × 1080).
Ostale tri stoje u istom folderu ako se ikad predomisliš.

## 6.3 Biografija — tri verzije

Ograničenje je **150 znakova**. Link je jedan (`drykult.com` kad bude, dotle
`drykult.vercel.app`).

**A — manifest** ← **IZABRANO, ovo se kuca u profil**
```
SUVO JE PRAVILO. TRAG JE GREŠKA.
· 1000 GSM · 80/20 · 90 × 70 cm
· garancija 2 godine
· RS · BA · ME — prva serija se pravi
```

**B — jasno šta je** *(ako hoćeš da te nađu pretragom)*
```
Premium microfiber peškir za sušenje auta
1000 GSM · twisted-loop · dve strane
Garancija 2 godine · RS · BA · ME
```

**C — kult**
```
Nije krpa. Alat.
1000 GSM · 80/20 · 90 × 70 cm
Garancija 2 godine
Prva serija se pravi ↓
```

Prvi red je jedini koji se vidi bez „još" — zato u njemu mora da stoji ono
najvažnije. „Prva serija se pravi" je istina i radi bolje od bilo kog odbrojavanja.

## 6.4 „Baner" — Instagram ga nema

Instagram **nema naslovnu sliku** (to je Facebook / YouTube / X). Ono što igra tu
ulogu su tri stvari, i sve tri su napravljene:

1. **Prva tri posta u redu** — gornji red profila je ono što se vidi prvo
2. **Korice istaknutih priča** — `instagram/istaknute/` (proizvod, spec, garancija,
   wanted, pitanja, sajt)
3. **Traka preko tri pločice** — pravac C dole

## 6.5 Zid — tri pravca

Pregled: `instagram/pregled/pravci.jpg`, mockup profila: `instagram/pregled/profil-mockup.jpg`.

**A — DOSIJE** *(odbačeno, ali kartice ostaju)*
Svaka objava je kartica iz igre: broj u uglu, dijagonala, tvrda senka. Kao pravac
nije izabran, ali su same kartice ostale — od njih su donja dva reda glavnog zida.

**B — CRNI ZID**
Jedan element po pločici, skoro sve crno. Tiše i skuplje na oko, ali gradi
prepoznavanje sporije i traži mnogo više objava da se profil „napuni".

**C — TRAKA** ← **IZABRANO**
Gornji red je baner kroz tri pločice, ispod idu kartice. Udara na prvi pogled.
Dve mane sa prve verzije su **rešene**, treća je pravilo rada:

1. **Razmaci su sekli slova.** Instagram ostavlja procep između pločica, a mreža
   seče tačno na trećinama — prva verzija je razvukla logotip preko cele širine i
   procep je pao usred „1000" i usred „MICROFIBER". Sada **nijedan tekst ne prelazi
   granicu**: utisak jedne slike nose pozadina (gradijent, dijagonala, zrno) i
   tanka neon linija koja teče kroz sve tri na istoj visini. Linija se preseca
   čisto, slova ne.
2. **Trećina logotipa nije objava.** U tuđem feedu se ne vidi zid nego jedna
   slika. Zato svaka pločica stoji i sama: leva je **znak**, srednja **logotip sa
   specifikacijom**, desna **manifest**.
3. **Objavljuje se po TRI.** Svaka pojedinačna objava pomera mrežu za jedno mesto
   i razbija traku. Dok se objavljuje u trojkama, traka ostaje cela — samo klizi
   naniže kroz profil. To je cena ovog pravca i nema je kako zaobići.

## 6.6 Prvih devet objava

Pregled celog zida: `instagram/pregled/zid-glavni.jpg`.

| mesto | fajl | tekst uz sliku |
|---|---|---|
| 1 | `zid/traka-01-znak.jpg` | Znak je **kap presečena pod 45°** — isti rez koji ide kroz slova u logotipu. Voda koja je presečena i više ne pada. |
| 2 | `zid/traka-02-logo.jpg` | DRYKULT. 1000 GSM, premium microfiber, 90 × 70 cm, 80/20. Garancija dve godine. Prva serija se pravi. |
| 3 | `zid/traka-03-manifest.jpg` | Suvo je pravilo. Trag je greška. Peškir koji ostavlja trag nije loš peškir — nije peškir. |
| 4 | `zid/kartica-01-proizvod.jpg` | Zeleno telo, crna štampa, 90 × 70 cm. **Slika je fabrički render** — prave fotke idu čim stignu uzorci. |
| 5 | `zid/kartica-02-gsm.jpg` | 1000 g/m² je ono što fabrika štampa na etiketi. Izmerićemo na uzorku čim stigne; ako ne izađe 1000, promenićemo broj — nećemo ćutati. 90 × 70 cm = 0,63 m², puta 1000 g/m² = 630 g tkanine. |
| 6 | `zid/kartica-03-sastav.jpg` | 80 % poliester, 20 % poliamid. Poliamid je ono što vodu vuče u sebe — ispod 20 % peškir počinje da razmazuje umesto da suši. |
| 7 | `zid/kartica-04-garancija.jpg` | Desi li se peškiru bilo šta nepredviđeno u prve dve godine — dobijaš nov. Od nas, bez natezanja. |
| 8 | `zid/kartica-05-wanted.jpg` | Patosnice. Amblemi za tablu. Gedžeti za kabinu. U izradi, bez datuma dok ne budu spremni. |
| 9 | `zid/kartica-06-sajt.jpg` | Ceo sajt je jedan potez — skroluješ, peškir leti. Ima i deo gde sam obrišeš kapi i vidiš koliko si pokupio. Link u biografiji. |

> **Objavljuje se UNAZAD**, jer Instagram stavlja najnoviju objavu gore levo.
> Tačan redosled kucanja:
>
> `kartica-06` → `kartica-05` → `kartica-04` → `kartica-03` → `kartica-02` →
> `kartica-01` → `traka-03` → `traka-02` → **`traka-01` poslednja**.
>
> Tek tako se zid složi onako kako je nacrtan.

**Post na 4. mestu mora da kaže da je render.** To nije sitnica: slika proizvoda
koji još nije u rukama, bez te rečenice, je tvrdnja koju ne možemo da podupremo.

**Deseta objava razbija traku.** Sledeća serija ide u trojci — prva sledeća kartica
je „izaberi stranu" (`zid/` se regeneriše skriptom), pa još dve.

## 6.7 Šta se objavljuje dok se čeka roba

Nemamo fotke proizvoda — ali imamo pet stvari koje jesu naše i jesu istinite:

1. **Sam sajt, kao video.** Snimak ekrana dok se skroluje hero (peškir leti),
   sekcija DOKAZ (brišeš kapi prstom, brojač raste), lom ekrana pri izboru strane.
   Ovo je najjači materijal koji imamo i jedini koji direktno vodi na sajt.
2. **Logo i kako je nastao** — kap presečena pod 45°, isti rez kao u slovima.
3. **Brojke** — 1000 GSM, 80/20, 630 g, 2 godine. Svaka je proverljiva iz specifikacije.
4. **Fabrički mockup** — označen kao render.
5. **Napredak, pošteno** — „poslato fabrici", „uzorci stigli", „izmerena gramaža".
   Kad se meri gramaža, snimi merenje. To je dokaz kakav konkurencija nema.

**Ritam:** 3 objave nedeljno je dovoljno ako je svaka nešto. Bolje devet dobrih
nego trideset praznih.

## 6.8 Šta se NE objavljuje — isto pravilo kao na sajtu

Iz `CLAUDE.md`, **Pravilo poštenja**:

- ❌ tuđe fotke i snimci, ni sa vodenim žigom ni bez njega
- ❌ „100.000 prodatih", izmišljene recenzije i ocene
- ❌ odbrojavanje do datuma koji ne postoji
- ❌ „najbolji na tržištu" bez testa koji to pokazuje
- ❌ tuđi logotipi (Audi, BMW, Mercedes) na našim slikama — imena smeju kao
  kompatibilnost („za Audi"), znakovi ne (`plan/03` 3.4a)
- ❌ slika rendera bez oznake da je render

## 6.9 REEL — sajt kao snimak

`node scripts/gen-reel.mjs` → **`instagram/reels/sajt-skrol.mp4`**
(1080 × 1920, 6,3 s, ~5 MB — tačno format koji Reels traži.)

Traži **pokrenut dev server** (`npm run dev`) i `ffmpeg` u PATH-u. Snima se
headless Chrome-om preko DevTools protokola: skrol se postavlja po kadru, slika
se hvata, pa `ffmpeg` sklopi film. Zato je snimak **ponovljiv** — kad se sajt
promeni, pustiš skriptu ponovo i dobiješ isti kadar sa novim sadržajem.

Šta se vidi: naslov → peškir → meni sa zaključanim PINK-om → garancija → kapi
koje se brišu → brojke (0,63 m² · 630 g · 2 strane). Počinje mirno 12 % dužine
(da se pročita naslov) i završava mirno na brojkama — poslednji kadar je onaj
koji ostane na ekranu kad se reel vrti u krug, pa mora da se čita.

Tekst uz reel:
> Ceo sajt je jedan potez. Skroluješ — peškir leti, kapi idu za njim. Dole je deo
> gde sam obrišeš kapi i vidiš koliko si pokupio. Link u biografiji.

## 6.10 [TI] Pre prve objave

- [ ] Uzmi ručku `@drykult` (i na TikToku)
- [x] ~~Izaberi profilnu i biografiju~~ — **D (nišan)** i **A (manifest)**, 28. 9.
- [x] ~~Reci koji pravac zida~~ — **C (TRAKA)**, 28. 9.
- [ ] Domen, da biografija ne vodi na `vercel.app` (`plan/01` 1.3)
- [ ] Odluči da li ide i TikTok odmah — isti materijal, samo uspravan format
      (reel je već 9:16, ide bez ijedne izmene)

## 6.11 Šta ostaje meni

- [x] ~~Reels iz snimka sajta~~ — urađeno, `scripts/gen-reel.mjs`
- [ ] Uspravni format 1080 × 1350 (4:5) — zauzima više ekrana u feedu nego kvadrat.
      Traži da se svaka objava precrta tako da važno stane u **centralni kvadrat**,
      jer mreža profila i dalje seče na kvadrat; inače se zid raspadne.
- [ ] Šabloni za priče (1080 × 1920)
- [ ] Kad stignu prave fotke: sve objave sa renderom se menjaju (`plan/05`)
