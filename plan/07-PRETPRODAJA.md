# 07 — Pretprodaja, nalozi i admin

Napravljeno 30. 9. 2026: **lista čekanja** radi kraj-do-kraja. Login preko
Google/Facebook naloga i novčanik NISU napravljeni — zašto, piše dole.

---

## 7.1 Šta postoji i kako radi

| deo | fajl |
|---|---|
| forma na sajtu | `components/Pretprodaja.js` |
| ruta koja prima prijavu | `pages/api/lista.js` |
| čuvanje podataka | `lib/lista.js` |
| admin strana | `pages/admin.js` + `pages/api/admin.js` |

Provereno uživo: ispravna prijava prolazi, isti mejl drugim slovima se **ne
duplira nego osvežava**, prijava bez saglasnosti se odbija, neispravan mejl se
odbija, bot koji popuni skriveno polje dobije „hvala" a **ne upiše se**, i posle
pet pokušaja u minutu ruta vraća 429.

## 7.2 [TI] Dve stvari bez kojih se OVO NE PUŠTA U RAD

### a) Baza — bez nje se prijave GUBE

Na Vercelu je sistem fajlova efemeran: svaka funkcija se diže u svom kontejneru
i sve što upiše nestaje. Zato `lib/lista.js` u produkciji **namerno odbija upis**
ako nema baze, umesto da se pravi da je sačuvao. Bolje glasan kvar nego tiho
gubljenje ljudi koji misle da su na listi.

- [ ] U Vercel panelu: **Storage → Create → Postgres**, zakači na projekat
      `drykult`. Tabela se pravi sama pri prvom upisu.
- [ ] `ADMIN_LOZINKA` kao Environment Variable (ne u kodu, repo je javan)

Dok `POSTGRES_URL` ne postoji, forma na produkciji vraća „prijave još nisu
otvorene" — što je istina.

### b) Firma i politika privatnosti

Ime, mejl, telefon i grad su **podaci o ličnosti**. Po ZZPL (usklađen sa GDPR)
rukovalac mora biti pravno lice; dok firme nema, ti si lično odgovoran za tuđe
podatke.

- [ ] Registrovana firma (`plan/04` 4.3)
- [ ] Politika privatnosti: ko je rukovalac, šta se čuva, koliko dugo, kome se
      daje (nikome), kako se briše. Pišem je čim budu podaci o firmi.
- [ ] Način da se čovek ispiše — obećano mu je u formi, mora da postoji

**Šta se NE prikuplja i zašto:** godište i država. Ničemu u pretprodaji ne služe,
a prikupljanje podataka koji ne trebaju je samo po sebi prekršaj (minimizacija).
Telefon i grad su neobavezni — trebaju tek kad se šalje roba.

## 7.3 [TI] Koliki je popust?

U tekstu stoji „dobijaš popust" bez broja. To je namerno: **broj koji ne znamo ne
izmišljamo.** Ali obećanje bez broja slabo vuče.

- [ ] Odluči procenat ili iznos, pa ga upisujem na tri mesta
- [ ] Odluči da li popust važi samo za prvu seriju ili trajno

Kad se odluči, to postaje obećanje koje se mora ispuniti — isto kao garancija.

## 7.4 Zašto login i novčanik nisu napravljeni

**Instagram prijava više ne postoji.** Meta je ugasila Basic Display API
4. 12. 2024. i za lične naloge **nema naslednika** — ostao je samo API za
Business/Creator naloge. Meta prijava danas znači Facebook Login, ne Instagram.

**Google i Facebook prijava se mogu dodati**, ali tek kad postoji razlog da čovek
ima nalog. Sada bi nalog služio da vidi — šta? Nema istorije porudžbina jer nema
porudžbina. Lista čekanja radi isti posao bez ijedne lozinke koju moramo da
čuvamo, a lozinke su najveća odgovornost koju sajt može da primi.

**Novčanik nema čemu da se poveže.** Naplata nije povezana ni karticom ni kripto
(`plan/04` 4.1) — `OrderSection` je i dalje samo UI. Dugme „poveži novčanik" koje
ništa ne radi gore je nego da ga nema.

### Redosled koji ima smisla

1. **sada** — lista čekanja *(gotovo)*
2. **kad postoji firma** — baza uključena, politika privatnosti, prve prijave
3. **kad se odluči naplata** (`plan/04` 4.1) — porudžbine, pa tek onda nalozi
   da čovek vidi svoju porudžbinu
4. **ako se ide na kripto** — novčanik, uz naplatu a ne pre nje

Baza je namerno napravljena tako da se Google/Facebook prijava kasnije **zakači
na postojeće redove preko mejla** — ništa se ne preseljava.
