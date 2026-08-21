# 04 — Prodaja, dostava, pravno

Ovo su stavke sa **dugim spoljnim rokom**. Ako se ne krene sad, roba stiže a nema
načina da se plati ni pošalje. Sve je na tebi — Claude može tek kad odlučiš.

---

## 4.1 Odluči kako se plaća — prva odluka od koje sve zavisi

**`OrderSection` je zasad samo UI. Forma ne šalje nigde ništa.**

Broj kartice namerno **nema svoj `<input>`** — čim bi ga imao, podaci kartice
prolaze kroz naš DOM i naš server, što je PCI prekršaj u trenutku kad se poveže
uživo. Umesto polja stoji `.payMount`, mesto gde provajder montira svoja hostovana
polja u svom iframe-u.

Dva puta, i nisu ista priprema:

**A — pouzeće (za RS/BA/ME).** Ogromna većina u regionu plaća kuriru. Ne treba ti
nikakav gateway, treba ti **ugovor sa kurirskom službom**. Najbrži put do prve
prodaje.

**B — kartice (za world-wide).** Treba nalog kod provajdera, ključevi u env
varijablama (**nikad u repo — ovaj je javan**), server ruta koja pravi
PaymentIntent, i webhook za potvrdu.

- [ ] Odluči: A, B, ili A sad pa B kasnije
- [ ] Reci Claude-u koje tržište prvo — istražiće konkretne provajdere za taj slučaj

> Preporuka: **A za start.** Prva prodaja u regionu ne čeka mesecima na
> odobrenje provajdera, a B se dodaje kad krene ka inostranstvu.

## 4.2 Dostava

- [ ] Kurirska služba za Srbiju — cena, rok, naplata pouzećem
- [ ] BiH i Crna Gora — carina, ko plaća, koliko traje
- [ ] Koliko košta slanje, i da li je uračunato u cenu od 3000 RSD ili se dodaje
- [ ] Pakovanje za slanje — staje li peškir u koverat ili treba kutija

## 4.3 Firma i uvoz

Bez ovoga ne možeš ni da uvezeš robu ni da napišeš etiketu o održavanju
(traži podatke o uvozniku) ni da izdaš račun.

- [ ] Registrovana firma / preduzetnik
- [ ] PIB i matični broj
- [ ] Uvoz iz Kine: carina, PDV, špediter
- [ ] Račun kupcu — kako se izdaje, fiskalizacija

## 4.4 Cena

`CENA_RSD = 3000` je potvrđena. Ali proveri da drži:

- [ ] Cena po komadu od fabrike
- [ ] + transport iz Kine + carina + PDV
- [ ] + pakovanje + dostava do kupca
- [ ] = koliko stvarno ostaje po komadu

Ako marža ne drži na 3000, bolje da se sazna sad nego posle prve serije.

## 4.5 Šta se sme napisati u marketingu

Ponavljam jer je ovo mesto gde se najlakše pogreši, iz `CLAUDE.md`, **Pravilo poštenja**:

- Nema izmišljenih brojki prodaje, recenzija ni ocena
- Nema odbrojavanja koje ne odbrojava ništa
- Nema „najbolji na tržištu" bez testa koji to pokazuje
- `1000 GSM` se piše **tek kad je izmereno** (`01.5`)
- Poređenje sa konkurencijom sme samo ako si taj test stvarno uradio i možeš da ga pokažeš

Ovo nije opreznost radi opreznosti: prodaja preko granice nosi odgovornost za
svaku tvrdnju na proizvodu i na sajtu.
