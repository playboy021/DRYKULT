# DRYKULT

Scroll-driven sajt za **DRYKULT** — premium microfiber peškir za sušenje automobila.
90 × 70 cm · 850 GSM · twisted-loop. Srbija, Bosna i Hercegovina, Crna Gora.

Next.js (Pages Router) · Lenis · Canvas 2D · Web Audio

---

## Ideja

Nije prodavnica nego **kult oko sušenja**. Kupci nisu kupci — oni su članovi,
i prvo što urade je da **izaberu stranu**: **HROM** (koralna) ili **MAMBA**
(neon zelena).

Peškir stoji u sredini u 3D i prati kursor. Nije kruti model nego **tkanina** —
ravan čiji vertex shader talasa mrežu, obučena pravom teksturom proizvoda.
Klik na drugu stranu i peškir se obrne 720°, a tekstura se menja na vrhu obrta.

Kad posetilac potvrdi, **ekran pukne** i iza krhotina ostane samo njegova strana.
Od tog trenutka ceo sajt nosi tu frakciju — paleta, sjaj, boja spreja u prelazu,
čak i ton zvuka.

Konkurencija peškir za sušenje prodaje **tekstom**. Mi ga prodajemo tako što
posetilac sam obriše ekran.

## Pokretanje

```bash
npm install
npm run dev
```

Regeneracija asseta iz studijskih fotki:

```bash
node scripts/gen-drykult.mjs   # izresci peškira sa bele pozadine
node scripts/gen-plate.mjs     # hero podloga, obe frakcije iz jedne slike
```

## Tri tiera

Sajt sam bira kvalitet iz signala browsera, bez merenja — pa nema kašnjenja pri startu.

| Tier | Kada | Podela hero-a |
|---|---|---|
| `high` | 8+ jezgara, 8+ GB RAM | mokra ivica prati kursor, obe strane žive |
| `mid` | 4+ jezgara | ivica stoji na sredini i sama se talasa, bira se klikom |
| `low` | telefon, `reduced-motion`, `saveData` | dve ploče jedna ispod druge, bira se tapom |

## Struktura

```
lib/faction.js               dve strane: boje, zvuk, pamćenje izbora
lib/device.js                tri tiera
components/SideChooser.js    hero — izaberi stranu
components/WetTransition.js  mokri prelaz na klik, u boji frakcije
components/LiquidButton.js   3D dugme na oprugama
components/OrderSection.js   prodaja
scripts/gen-drykult.mjs      studijske fotke → izresci peškira
scripts/gen-plate.mjs        jedna hauba → podloga obe frakcije
```

## Napomene

**Naplata nije povezana.** `OrderSection` je samo UI — forma ne šalje nigde ništa,
a broj kartice namerno nema svoj `<input>`. Detalji u [CLAUDE.md](CLAUDE.md).

**Ne izmišljamo brojke.** Nema lažnih countdown-ova ni recenzija kojih nema.
Krećemo od nule i to se ne krije.

Puna dokumentacija — paleta sa izmerenim kontrastom, pravila, recepti i zamke
koje su koštale vremena — je u [CLAUDE.md](CLAUDE.md).
