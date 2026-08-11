# MEGAZ

Scroll-driven sajt za **MEGAZ** — premium microfiber peškir za auto-detailing.
Tržišta: Srbija, BiH, Crna Gora. Instagram: [@megaz_official](https://instagram.com/megaz_official)

Next.js (Pages Router) · GSAP · Lenis · Canvas 2D

---

## Ideja hero-a

Peškir ne treba da se objašnjava — treba da se pokaže. Osnovni sloj je **mokra hauba**,
a kursor po tragu farba **suvu**. Interakcija *jeste* demonstracija proizvoda: korisnik u
prve tri sekunde oseti šta peškir radi, bez ijedne reči marketinga.

Na telefonu, gde kursora nema, isto se prikazuje kao pre-renderovan film koji se sam izvrti.

## Pokretanje

```bash
npm install
npm run dev          # http://localhost:3210
```

Regeneracija asseta iz izvorne fotke i snimaka:

```bash
npm run assets                # hero par (mokro/suvo) po tieru
node scripts/gen-video.mjs    # film za mobilni tier (traži ffmpeg u PATH)
```

## Tri tiera

Sajt sam bira kvalitet iz signala browsera, bez merenja — pa nema kašnjenja pri startu.

| Tier | Kada | Šta se renderuje | Težina |
|---|---|---|---|
| `high` | 8+ jezgara, 8+ GB RAM | liquid reveal, pun 1440×949 | 564 KB |
| `mid` | 4+ jezgara | liquid reveal, 1024×675 | 269 KB |
| `low` | telefon, `reduced-motion`, `saveData`, 2G/3G | film koji se sam izvrti | 576 KB |

## Struktura

```
lib/device.js          tri tiera, izbor asseta, tier-svestan naslov
lib/spring.js          rAF integrator (opruge), bez biblioteke
lib/scrollLock.js      brava skrola sa brojanjem
lib/remScale.js        rem-mreža iznad 1920px
components/LiquidReveal.js   srce hero-a
components/Loader.js         brojač 000→100 vezan za stvarno učitavanje
components/HeroVideo.js      mobilni tier
scripts/gen-assets.mjs       fotka → mokro/suvo par
scripts/gen-video.mjs        snimak → film za mobilni
```

## Napomene

Sirovi telefonski snimci (`.MOV`, 15–80 MB komad) **nisu** u repo-u — drže se van njega,
a u git ulaze samo izvedeni asseti iz `public/megaz/`.

Detaljna dokumentacija — paleta, pravila, recepti, izmerene veličine i zamke okruženja
koje su koštale vremena — je u [CLAUDE.md](CLAUDE.md).
