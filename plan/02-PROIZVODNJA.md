# 02 — Dok fabrika radi

Peškiri se prave i putuju ~10 dana. To vreme ide na sve što se štampa **zajedno
sa njima** — jer ako grafika ne stigne na vreme, čeka se sledeći ciklus.

---

## 2.1 Etiketa o održavanju — zakonski obavezna

Za tekstil koji se prodaje u EU i Srbiji sastav vlakana **mora** da bude naveden
na proizvodu. To nije stvar ukusa nego propisa (EU Regulativa 1007/2011 o nazivima
tekstilnih vlakana; u Srbiji odgovarajući pravilnik).

Šta ide na nju:

- [ ] Sastav vlakana, tačan procenat — čeka `01.4`
- [ ] Simboli za održavanje (pranje / beljenje / sušenje / peglanje / hemijsko)
- [ ] Zemlja porekla
- [ ] **Podaci o uvozniku** — naziv firme i adresa u Srbiji
- [ ] Dimenzije: 90 × 70 cm

**Blokira:** sastav vlakana od fabrike, i registrovana firma (vidi `04.3`).
**Kad to bude:** Claude dizajnira etiketu u istom sistemu kao logo.

## 2.2 Tkana etiketa u peškiru

- [ ] Odluči veličinu — predlog 30 mm širine
- [ ] Ide `drykult-horizontal` **bez** spec linije

Razlog: spec linija je 26,5 % visine logotipa, pa bi na 30 mm bila oko 1 mm — u
tkanju se zalije. Sve piše u `logo/SPEC.md`, §4.

## 2.3 Pakovanje

- [ ] Odluči šta je: kesa, kutija, ili traka oko presavijenog peškira
- [ ] Ide `drykult-horizontal-spec` — tu ima mesta za `1000 GSM · PREMIUM MICROFIBER`
- [ ] Boja pakovanja prati frakciju? (MAMBA zelena / PINK koralna) ili je crno za obe?

**Odluka koju treba doneti:** ako pakovanje prati frakciju, to su dve odvojene
serije štampe i dvostruko zaliha. Ako je crno za obe, jedna serija ali izbor
strane se vidi tek kad se otvori. Ja bih išao **crno za obe, sa nalepnicom u boji
frakcije** — jedna serija kutija, a boja se dodaje na kraju.

## 2.4 Neon zelena ne postoji u CMYK-u

Ovo je već napisano fabrici u `logo/SPEC.md`, ali ponovi im usmeno:

**`#8CEF2E` je fizički van CMYK opsega.** Traži spot / fluo boju (Pantone 802 C
familija) ili im pošalji fizički uzorak. Ako se ne kaže, dobija se **mutna
travnata zelena** i to se vidi na svakoj kutiji.

`#FF6E80` je takođe blizu ivice opsega — biće bleđa u procesnoj štampi.

## 2.5 Numerisani komadi

Ideja iz `CLAUDE.md` koja nije napravljena: svaki peškir nosi broj serije.
Ako se radi, mora sad — to je deo štampe.

- [ ] Ide li numeracija? Ako da, na tkanoj etiketi ili na pakovanju?

> Ovo je jedini „ekskluzivitet" koji nije laž: broj koji stvarno postoji jer je
> serija stvarno ograničena. Ne izmišlja se ništa.
