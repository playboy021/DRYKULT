# Logo — šta da pošalješ Kinezima

Pošalji im **ceo `logo/` folder**, ili bar `svg/` + `SPEC.md`. `SPEC.md` je na
engleskom i u njemu je sve što fabrika treba: boje, Pantone, minimalne veličine,
šta sme a šta ne sme.

## Šta je šta

**Znak je kap presečena pod 45° i razvaljena** — polovine su odgurnute duž reza.
To je cela priča brenda u jednom obliku: kap ne preživi. Rez je baš na 45° jer je
to isti ugao kojim je zasečen svaki ugao u slovima — znak i logotip su tako u
istom sistemu, a ne dve odvojene stvari.

Sve je nacrtano pravim linijama, bez ijedne krive: kriva se u vezu ne može
ispratiti, a tkani žakard je pretvori u stepenice. Fasete se vezu i tkaju čisto,
i daju sečen, hromiran ton koji ide uz ime HROM.

Sama kap se ne ređa tačkama nego se gradi iz **dve tangente sa vrha na krug pri
dnu** — zato su joj stranice ispupčene. Prve verzije su ređane napamet i ispadale
su kao jedro.

`logo/PREGLED.png` je jedna slika sa svim sklopovima i znakom na veličini etikete —
tu se najbrže vidi stanje.

**Slova su crtana, nisu iz fonta.** Nema tuđe licence na tvom logotipu i fabrika ne
mora da ima nikakav fajl da bi ga otvorila.

**Razmaci između slova nisu pogađani nego mereni** — skripta računa belinu između
svaka dva obrisa i izjednačava je. Zato posle L nema rupe kakva se inače dobije.

## Dve verzije znaka — ovo im obavezno reci

- `mark` — sa prorezom. Za štampu i tkane etikete.
- `mark-solid` — bez proreza. **Za vez i sve ispod 12 mm.**

Razlog: na 12 mm visine prorez je oko 1,5 mm. To štampa i tkanje odrade, ali vez ne —
dve polovine bi se slile. Zato postoji puna verzija.

## Dve stvari na koje da paziš

**Neon zelena `#8CEF2E` ne postoji u običnoj CMYK štampi.** Fizički je van opsega.
Traži spot / fluo boju (Pantone 802 C familija), ili im pošalji fizički uzorak konca.
Ako to ne kažeš, dobićeš mutnu travnatu zelenu.

**Nema ® na logotipu i ne sme da se doda.** ® sme samo uz registrovan žig. Dok se
registracija ne završi ide ™, koji ne traži ništa. **Na sajtu trenutno stoji
`DRYKULT®` na tri mesta** (`SiteHeader.js`, `SideChooser.js`, `FactionView.js`) —
to treba da se skine ili zameni sa ™ dok se žig ne registruje.

## Ako nešto treba da se menja

Ne diraj SVG rukom. Menja se `scripts/gen-logo.mjs` pa:

```bash
node scripts/gen-logo.mjs
```

Tako svi fajlovi ostanu usklađeni.
