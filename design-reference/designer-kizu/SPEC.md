# KIZU design system — extracted from all 16 designer screens

Source: `design-reference/designer-kizu/01–16.jpg` (original KIZU-era comps).
Brand cyan is stated literally on screen 08: **`#18D7E7`**.

## 1. Backgrounds — they VARY by screen family

This is the biggest single difference from what we shipped. There is no one
plate; the backdrop is chosen per screen type:

| Screen type | Backdrop | Seen in |
|---|---|---|
| Welcome / intro / celebrate | Warm **cream → white** gradient | 06, 08 |
| Onboarding questions | Pale **blue → white** gradient, cool | 05, 09, 14 |
| Dashboard / vault / services | Pale blue gradient, slightly deeper at edges | 10, 13, 03 |
| Date & "contract end" | **Blurred luxury interior** photo | 02, 16 |
| Sign-in | Blurred white/glass corridor | 07 |
| Profile | Near-white with faint diagonal shapes | 12 |

All are extremely light (RGB ≈ 230–250). Ours is a single blurred photo that
reads grey and muddy by comparison.

## 2. Chrome

- **Wordmark** `KIZU` top-left on almost every screen. Heavy weight, tight
  tracking, navy. Centred on a few (01, 07, 09). We have none.
- **Step counter** above the headline: `5 of 14`, `Onboarding 4 of 14`,
  `Progress 2 of 9`. Small, grey or cyan.
- **Headline**: very large (~34–40px), bold, navy `#0d2b3e`, **left-aligned**,
  usually two lines. Ours is smaller and centred.
- **Subtitle**: grey, ~16px, one line.

## 3. Glass surfaces

- Radius **20–28** (ours: 16–18 — too tight)
- White fill ~40–60%, **very soft, near-borderless**
- Selected/active state = **cyan glow ring**, not a solid fill
- Icon chips: circular, pale cyan wash, cyan line icon
- Option cards carry either a line icon or a 3D isometric illustration

## 4. CTA

- Full-width pill, radius ~28–32
- Cyan→blue gradient (06, 04, 08) or flat cyan (09, 10)
- **Strong cyan glow beneath** — this is what makes it read as lit
- White bold label, ~18px

## 5. Progress

- **Bottom** of screen: gradient bar (cyan → pale) with glow, plus `5 of 9`
- Variants: dot row (01, 09), ring top-right (02), segmented bar (16)
- Ours puts segments at the top — designer puts the bar at the bottom

## 6. Tab bar

**Floating detached glass pill**, inset with side margins and a bottom gap,
radius ~28. Active tab = cyan icon + cyan label + small glow dot. 4 tabs
(Home / Rent / Services / Profile). Ours is an edge-to-edge strip.

## 7. Mascot — the compositional key

Present on **every** screen, large, in varied poses (waving 07, pointing 04/09,
celebrating 11/15, holding cheques 14, with envelope 10). Critically, glass
cards **float around and overlap it** (05, 09, 13, 15) so the mascot sits
*between* background and content. That layering is what gives the comps depth.

Ours treats the mascot as a header illustration and stacks cards in a list —
this is the largest structural gap.

## 8. Status colours

- Pending / in-progress: **amber** `#F5A623`
- Completed / healthy: **green** `#22C55E`
- Profile accents: coral/red
- Utilities chips: cyan filled pills

## Implementation order (highest visual payoff first)

1. Per-family background gradients replacing the single muddy photo plate
2. Screen chrome: wordmark, step counter, large left-aligned headline,
   bottom gradient progress
3. Glass: larger radius, softer border, more transparency, cyan glow on select
4. Floating tab bar pill
5. Mascot layering behind floating cards (largest change, do last)
