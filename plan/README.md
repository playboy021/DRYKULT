# DRYKULT — šta je ostalo

Stanje na dan **21. 8. 2026.** Logo je gotov i predat fabrici. Sajt je izgrađen ali
**nijedan čovek ga još nije video na ekranu** — to je najveći otvoreni rizik.

Redosled u ovom folderu nije proizvoljan. Ide po tome **šta blokira šta**, a ne po
tome šta je lakše.

| # | Fajl | Kad se radi | Ko |
|---|---|---|---|
| 01 | [PRE-PORUDZBINE.md](01-PRE-PORUDZBINE.md) | **odmah, pre nego što se plati** | Stefan |
| 02 | [PROIZVODNJA.md](02-PROIZVODNJA.md) | dok fabrika radi | Stefan + Claude |
| 03 | [SAJT.md](03-SAJT.md) | paralelno, celo vreme | Claude |
| 04 | [PRODAJA.md](04-PRODAJA.md) | mora biti gotovo pre nego što roba stigne | Stefan |
| 05 | [SNIMANJE.md](05-SNIMANJE.md) | **onog dana kad stignu uzorci** | Stefan |

---

## Tri stvari koje mogu da unište seriju

Ako se ništa drugo iz ovog foldera ne uradi, ovo tri moraju.

1. **Ime nije provereno u registrima žigova.** Ako neko drži DRYKULT u klasi 24
   ili 3, hiljadu peškira sa tim imenom je bačen novac. → `01`

2. **`1000 GSM` je odštampan na etiketi, a nije izmeren.** To je merljiv podatak
   na proizvodu koji ide preko granice. Ako fabrika isporuči 800, etiketa laže. → `01`

3. **Naplata nije povezana.** `OrderSection` je samo UI, forma ne šalje nigde ništa.
   Roba može da stigne pre nego što postoji način da se plati. → `04`

---

## Šta je već gotovo

- Logo, kompletan paket za fabriku sa specifikacijom — `logo/`
- Paleta sa izmerenim kontrastom, dve frakcije — `lib/faction.js`
- Hero sa 3D peškirom, izbor strane, lom ekrana, mokri prelaz
- Sekcija DOKAZ (posetilac sam briše kapi)
- Tri tiera uređaja, pravila u `CLAUDE.md`
- Sve fotke prethodnog brenda obrisane

## Pravilo koje se ne pregovara

Iz `CLAUDE.md`, odeljak **Pravilo poštenja**: ne izmišljamo brojke. Nema lažnih
recenzija, nema odbrojavanja koje ne odbrojava, nema „100.000 prodatih". Krećemo
od nule i to se ne krije.

Razlog nije moralisanje nego računica: tržište RS/BA/ME je malo i ljudi se
poznaju, a prodaja preko granice nosi pravnu odgovornost za svaku tvrdnju.
Dokaz koji posetilac sam napravi je jači od 3.532 recenzije koje niko ne proverava.
