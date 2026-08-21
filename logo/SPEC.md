# DRYKULT — Logo Specification

Brand: **DRYKULT** — premium microfibre car drying towel.
Contact: perin.nikola.ns@gmail.com

All artwork in `svg/` is **vector, with all type converted to outlines**. No fonts
are required to open, scale or print these files. The letterforms are custom
drawn for this brand — they are not a licensed typeface, so there is no font
licence to clear.

---

## 1. Files

| File | Use |
|---|---|
| `svg/drykult-horizontal-*.svg` | **Primary lockup.** Sewn-in label on the towel, small applications. |
| `svg/drykult-horizontal-spec-*.svg` | Same, plus the spec line. **Boxes, hang tags, print, web.** Needs more room — see §4. |
| `svg/drykult-stacked-*.svg` | Square or narrow spaces (patches, embroidery on a corner). |
| `svg/drykult-stacked-spec-*.svg` | Stacked, plus the spec line. |
| `svg/drykult-mark-*.svg` | Symbol alone. Use when DRYKULT already appears elsewhere on the item. |
| `svg/drykult-mark-solid-*.svg` | **Small sizes and embroidery only** — see §4. Same symbol, without the cut. |
| `svg/drykult-wordmark-*.svg` | Type alone. |

The spec line reads **`1000 GSM · PREMIUM MICROFIBER`**. Its letterforms are also
custom drawn — upright and lighter than the wordmark, deliberately. It is scaled to
sit flush with the width of the wordmark above it. **Do not re-set it in a font, do
not re-space it, and do not change its size relative to the wordmark.**

Colour variants: `-black`, `-white`, `-pink` (coral), `-mamba` (green).

`png/` holds 1200–2400 px raster exports for reference and screen use.
**For production always use the SVG.** White PNGs are exported on a black
background so they are visible; the SVG has no background.

Proportions are fixed:

| Artwork | Ratio (w : h) |
|---|---|
| horizontal | 5.432 : 1 |
| horizontal-spec | 4.196 : 1 |
| stacked | 1.911 : 1 |
| stacked-spec | 1.618 : 1 |
| mark | 0.609 : 1 |
| mark-solid | 0.718 : 1 |
| wordmark | 5.962 : 1 |

Note that `mark` and `mark-solid` have **different proportions** — the cut version is
taller because the two halves are offset along the cut. This is intentional. Do not
scale one to the other's bounding box.

---

## 2. Colours

| Name | HEX | RGB | CMYK (approx.) | Pantone (reference) |
|---|---|---|---|---|
| Black | `#07080A` | 7 · 8 · 10 | 0 / 0 / 0 / 100 | Black 6 C |
| White | `#F4F6F8` | 244 · 246 · 248 | 0 / 0 / 0 / 0 | — |
| **PINK** coral | `#FF6E80` | 255 · 110 · 128 | 0 / 57 / 50 / 0 | 178 C |
| **MAMBA** green | `#8CEF2E` | 140 · 239 · 46 | 41 / 0 / 81 / 6 | 802 C (fluorescent) |

**Pantone values above are visual references, not measured matches. Please
confirm against a physical Pantone book and send us a physical swatch or strike-off
for approval before mass production.**

### Important — gamut

**MAMBA green `#8CEF2E` cannot be reproduced in standard 4-colour CMYK.** It is a
fluorescent-range green. For print it requires a **spot / fluorescent ink**
(Pantone 802 C family). For thread or dyed fabric, match to the HEX/RGB value and
send a physical sample — do not convert through CMYK.

PINK coral `#FF6E80` is also near the edge of CMYK gamut and will print duller in
process colour. Spot ink preferred.

---

## 3. Clear space

Keep an empty margin around the logo on all four sides equal to **X**, where
**X = 25 % of the total height of the lockup being used**.

No other graphic, text, seam, stitch line or trim edge may enter this area.

---

## 4. Minimum sizes

| Application | Artwork | Minimum |
|---|---|---|
| Print / woven label — horizontal lockup | `horizontal` | **30 mm** wide |
| Print / woven label — stacked lockup | `stacked` | **20 mm** wide |
| Print / woven label — mark | `mark` | **12 mm** tall |
| **Print** — with spec line | `horizontal-spec` | **45 mm** wide |
| **Woven label** — with spec line | `horizontal-spec` | **55 mm** wide |
| **Embroidery** — mark | `mark-solid` | **15 mm** tall |
| **Embroidery** — horizontal lockup | `horizontal` | **60 mm** wide |
| Silicone / rubber patch — mark | `mark-solid` | **14 mm** tall |

**The spec line sets its own minimum.** Its cap height is 26.5 % of the wordmark's,
so on a 30 mm lockup it would be about 1 mm tall — below that it fills in when woven
and closes up when printed. If the artwork must go smaller than the sizes above,
**use the version without the spec line.** Do not shrink the spec lockup and do not
enlarge the spec line on its own to compensate.

**Why two versions of the mark.** The primary mark is a droplet cut clean through
by a horizontal gap. At 12 mm tall that gap is about 1.5 mm — fine for printing and
weaving, but too fine for embroidery, where the two halves will bleed together.
**Below the sizes above, or for any embroidered application, use
`drykult-mark-solid`.** Never try to reproduce the cut at a smaller size.

---

## 5. Rules

**Do**
- Use the supplied SVG files unchanged.
- Place on black `#07080A` (preferred), white, or a flat brand colour.
- Scale proportionally only.

**Do not**
- Re-type the wordmark in any font. The letterforms are custom.
- Change the letter spacing, the italic angle, or the proportions.
- Add an outline, drop shadow, gradient, bevel or glow.
- Rotate, skew, stretch, or condense.
- Place the black version on a dark background, or the white version on a light one.
- Change the width of the cut in the mark, or close it.
- Add a container box, circle or badge around the mark.

---

## 6. The spec line is a measurable claim

`1000 GSM · PREMIUM MICROFIBER` is not marketing copy. **GSM is a measurable
property and it is printed on the product**, so it has to be true of what ships.

Before the spec artwork goes into production, please **confirm in writing that the
fabric supplied is 1000 g/m²**, and send a cut sample for us to weigh. Our check:
a 10 × 10 cm piece, weighed in grams, multiplied by 100.

If the fabric supplied is not 1000 g/m², **stop and tell us** — we will change the
number rather than print it. Do not adjust the artwork yourselves.

The same applies to "microfiber": the composition must be a genuine microfiber
blend, and we need the exact composition (e.g. 80/20 polyester/polyamide) for the
care label.

---

## 7. Trademark symbol

**No ® symbol is included in this artwork, and none must be added.** The ® symbol
may only be used with a registered trademark. If a symbol is wanted before
registration completes, use **™** — it requires no registration. Please ask us
before adding any symbol to production artwork.

---

## 8. Regenerating

The artwork is generated from source geometry, not drawn by hand in an editor:

```bash
node scripts/gen-logo.mjs
```

Any change to size, colour or spacing should be made there and re-exported, so
every file stays consistent.
