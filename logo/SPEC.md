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
| `svg/drykult-horizontal-*.svg` | **Primary lockup.** Default choice for labels, packaging, print. |
| `svg/drykult-stacked-*.svg` | Square or narrow spaces (patches, boxes, embroidery on a corner). |
| `svg/drykult-mark-*.svg` | Symbol alone. Use when DRYKULT already appears elsewhere on the item. |
| `svg/drykult-mark-solid-*.svg` | **Small sizes and embroidery only** — see §4. Same symbol, without the cut. |
| `svg/drykult-wordmark-*.svg` | Type alone. |

Colour variants: `-black`, `-white`, `-hrom` (coral), `-mamba` (green).

`png/` holds 1200–2400 px raster exports for reference and screen use.
**For production always use the SVG.** White PNGs are exported on a black
background so they are visible; the SVG has no background.

Proportions are fixed. Horizontal lockup **5.432 : 1**, stacked **1.911 : 1**,
mark **0.609 : 1**, mark-solid **0.718 : 1**, wordmark **5.962 : 1**.

Note that `mark` and `mark-solid` have **different proportions** — the cut version is
taller because the two halves are offset along the cut. This is intentional. Do not
scale one to the other's bounding box.

---

## 2. Colours

| Name | HEX | RGB | CMYK (approx.) | Pantone (reference) |
|---|---|---|---|---|
| Black | `#07080A` | 7 · 8 · 10 | 0 / 0 / 0 / 100 | Black 6 C |
| White | `#F4F6F8` | 244 · 246 · 248 | 0 / 0 / 0 / 0 | — |
| **HROM** coral | `#FF6E80` | 255 · 110 · 128 | 0 / 57 / 50 / 0 | 178 C |
| **MAMBA** green | `#8CEF2E` | 140 · 239 · 46 | 41 / 0 / 81 / 6 | 802 C (fluorescent) |

**Pantone values above are visual references, not measured matches. Please
confirm against a physical Pantone book and send us a physical swatch or strike-off
for approval before mass production.**

### Important — gamut

**MAMBA green `#8CEF2E` cannot be reproduced in standard 4-colour CMYK.** It is a
fluorescent-range green. For print it requires a **spot / fluorescent ink**
(Pantone 802 C family). For thread or dyed fabric, match to the HEX/RGB value and
send a physical sample — do not convert through CMYK.

HROM coral `#FF6E80` is also near the edge of CMYK gamut and will print duller in
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
| **Embroidery** — mark | `mark-solid` | **15 mm** tall |
| **Embroidery** — horizontal lockup | `horizontal` | **60 mm** wide |
| Silicone / rubber patch — mark | `mark-solid` | **14 mm** tall |

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

## 6. Trademark symbol

**No ® symbol is included in this artwork, and none must be added.** The ® symbol
may only be used with a registered trademark. If a symbol is wanted before
registration completes, use **™** — it requires no registration. Please ask us
before adding any symbol to production artwork.

---

## 7. Regenerating

The artwork is generated from source geometry, not drawn by hand in an editor:

```bash
node scripts/gen-logo.mjs
```

Any change to size, colour or spacing should be made there and re-exported, so
every file stays consistent.
