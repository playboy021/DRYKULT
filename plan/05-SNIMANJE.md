# 05 — Plan snimanja

**Pročitaj ovo pre nego što uzmeš aparat u ruke.**

Uzorci će stići, ti ćeš ih probati, i lako se desi da odu dalje — u prodaju, kod
nekoga, ili se prosto istroše — pre nego što se snimi sve što sajtu treba. Onda se
čeka sledeća serija.

Zato: **prvo snimanje, pa proba.**

---

## Najvažnije pravilo: mokro i suvo idu iz JEDNE fotke

`scripts/gen-assets.mjs` iz **jednog kadra** izvodi i mokru i suvu verziju haube.
To nije lenjost nego nužnost: liquid reveal farba drugu sliku preko prve, i ako se
geometrija razlikuje makar za piksel, ivica četke oda da su to dve fotke.

**Dakle:**
- [ ] Aparat na **stativ**
- [ ] Ne pomeraj ga između kadrova, ni za santimetar
- [ ] Fiksni fokus, fiksna ekspozicija, **isključi auto-balans belog**
- [ ] Snimi u najvećoj rezoluciji koju imaš

Ako aparat sam promeni ekspoziciju između kadrova, dobićeš dve fotke koje se ne
poklapaju i ceo efekat pada.

---

## Spisak kadrova

### A. Hauba — za liquid reveal (hero)
- [ ] **Mat crn auto**, mokra hauba, kapi jasno vidljive
- [ ] Stativ, jedan kadar, širok — hauba puni kadar
- [ ] Ista postavka sa peškirom u kadru, u obe boje

> Iz ovog jednog kadra se izvodi i mokro i suvo. Ne snimaj posebno „suvu haubu".

### B. Video za telefon (LOW tier)
- [ ] Peškir prelazi preko mokre haube i suši je, **jedan potez, bez rezova**
- [ ] Isti kadar kao A, stativ
- [ ] 3–5 sekundi je dovoljno — vrti se jednom i staje

`components/HeroVideo.js` čeka ovo. Postavlja `src` u JS-u, ne u JSX-u.

### C. Peškir na beloj pozadini — za izrezivanje
- [ ] Obe boje, razvučen, odozgo
- [ ] **Ravnomerno svetlo, bela pozadina bez senki**
- [ ] Isti ugao i ista udaljenost za obe boje — menjaju se klikom, moraju da se poklope

`scripts/gen-drykult.mjs` ih izrezuje. Radi dekontaminaciju ivice
(`original = (mešavina − belo×(1−a)) / a`), ali ne može da spase fotku sa senkom
na pozadini.

### D. Plišano naličje — OVO TRENUTNO FALI
- [ ] Naličje **razvučeno**, celo, odozgo
- [ ] Obe boje

Bez ove fotke ideja „okreni peškir" (crna strana ↔ plišano naličje) ima samo jednu
stranu i sekcija ne može da se napravi. Zapisano je u `CLAUDE.md` kao otvoreno
pitanje 3 još odavno.

### E. Makro — za sekciju mikroskop
- [ ] Twisted-loop petlja izbliza, što bliže možeš
- [ ] Velur (kratka ravna dlaka) izbliza — to je druga strana
- [ ] Ivica / opšiv izbliza

Najdublji nivo (presek vlakna) je **ilustracija, ne fotografija**, i mora biti
jasno stilizovan da se ne čita kao fotografija. To ne snimaš.

### F. Test tragova
- [ ] Ista hauba, ista voda, isto svetlo
- [ ] Jedna polovina obrisana **običnom krpom**, druga **DRYKULT-om**
- [ ] Kadar koji hvata obe polovine odjednom

> Ovo sme na sajt **samo ako test stvarno uradiš**. Ako obična krpa ne ostavi trag,
> to se ne krivotvori — sekcija se izbacuje. Vidi `04.5`.

### G. Za Instagram i kutiju
- [ ] Peškir u ruci, da se vidi debljina — 1000 GSM se vidi po debljini
- [ ] Presavijen, kao što stiže u pakovanju
- [ ] Obe boje jedna pored druge

---

## Pre nego što spakuješ opremu

- [ ] Prebaci sve na komp i **pogledaj u punoj veličini**, ne na ekranu aparata
- [ ] Proveri je li nešto mutno — mutan kadar se ne popravlja
- [ ] Proveri da su A i B iz **iste** postavke stativa
- [ ] Sačuvaj originale, ne samo obrađeno — `gen-assets.mjs` radi iz originala

Tek onda peškiri smeju dalje.
