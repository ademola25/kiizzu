# Tentzu design & flow plan

Sources: `proposal.pdf` (Kizu Onboarding Redesign, 17 Jul 2026), the 16 designer
comps in `designer-kizu/`, and `designer-kizu/SPEC.md` (visual system extracted
from those comps).

---

## The headline finding

**The gap is not mainly visual. It is conversational.**

I have spent several rounds matching the comps' *look*. The proposal is about
something else entirely: Kizu is meant to behave like a **virtual tenant
assistant**, not a form that happens to have a mascot on it.

The proposal's own words on the current design:

> "High cognitive load, no immediate value, **feels like application not
> assistant**, high mobile drop-off."

That is a description of what we have shipped. Our onboarding is a 7-step form
with a mascot decorating it.

### The recommended build is NOT the AI version

The proposal explicitly recommends **Appendix C: "Wizard of Oz"** — build now,
without AI:

> "Same 14 screens technically, but conversational copy makes Kizu feel like
> assistant from first screen."

So this is achievable with copy, ordering and two new screens. No AI required.

---

## The 14-step flow, with the exact copy from the proposal

| # | Screen | Copy (verbatim) |
|---|---|---|
| 1 | Meet Kizu, your rental copilot. | I'll handle your rent, docs, and maintenance so you don't have to. |
| 2 | First, when is rent due? | Tell me the date or just upload your lease. I'll remember it and remind you before it's late. |
| 3 | How do you usually pay? | Cheque, transfer, or portal. I'll track it and ping you when the next one is ready. |
| 4 | What should I watch for you? | Pick your top headaches. I'll set up auto-reminders so you never worry again. |
| 5 | Who do I call if something breaks? *(skippable)* | Add your landlord, building security, or AC guy. Or skip and I'll help you find them later. |
| 6 | Let me read your lease for you. | Upload your lease PDF or photo. I'll pull out rent, dates, and landlord details so you don't have to type them. |
| — | *3-second loader* | "Kizu is organizing your lease…" |
| 7 | Confirm your home. | I found this in your lease: Marina Heights, Dubai. **Right?** |
| 8 | Looks like you're in an apartment. | Based on your lease, it's a 2BR apartment. Update if needed. |
| 9 | Your lease ends 31 Dec 2025. | I'll remind you 90, 60, and 30 days before so you can renew or move. |
| 10 | Here's your rent plan. | I set up 4 cheques: 14 Jan, 14 Apr, 14 Jul, 14 Oct. I'll ping you 5 days before each. |
| 11 | You're all set. Here's what I'm watching. | Next rent: 14 Jul in 21 days. Docs: Lease and Emirates ID stored. Renewal: 5 months away. |
| 12 | Want me to save anything else? *(skippable)* | Ejari, DEWA bills, insurance. Add now or anytime by forwarding to vault@kizu.app. |
| 13 | Kizu is now your rental copilot. | From now on, just ask me anything: "When is rent due?" or "Who fixes the AC?" |
| 14 | Save your Kizu. | Create a login so your rental brain is safe and synced. Takes 10 seconds. |

---

## Gap analysis — what we have vs what is specified

### A. Flow structure (the biggest gap)

| | Ours today | Proposal |
|---|---|---|
| Steps | 7 | 14 |
| Opening question | Where do you rent? (address form) | When is rent due? |
| Lease upload | Not in onboarding at all | **Step 6, and it drives steps 7–9** |
| Steps 7–9 | We *ask* for address, type, dates | We should **confirm** what the lease said |
| Sign-in | Step 8 (after survey) | Step 14 (last) — ✅ we already match the spirit |
| Skippable steps | none | 5 and 12 |
| Loader | none | 3s after step 6 |
| Closing | celebrate | "Here's what I'm watching" + "ask me anything" |

**The single most valuable change**: step 6 lease upload → 3s loader → steps
7/8/9 become confirmations. That converts the heaviest typing in the flow into
three yes/no taps. It is also the proposal's stated "Single CTA — 'Upload
lease' is the only work".

**Consequence for recent work**: the country→postcode→street address form I
built is *not* the primary path in this design. It becomes the **fallback**
when no lease is uploaded or extraction fails. It stays; it stops being the
front door.

### B. Copy and tone

Ours is neutral and imperative ("Where do you rent?", "Continue"). The proposal
is first-person and promissory: **"I'll remember it", "I'll ping you", "I found
this — right?"**. Every screen makes a promise and then shows it kept.

### C. Visual system

Already extracted in `SPEC.md`. Recap of what is still not done:

1. **Mascot layering** — comps float glass cards *around and overlapping* a
   large mascot; ours stacks cards under a header illustration. Largest
   remaining visual gap.
2. **Per-screen mascot poses** — comps use waving / pointing / celebrating /
   holding cheques. We reuse one image.
3. **Icons inside option cards** — comps use 3D isometric buildings and cyan
   line icons; ours uses generic Ionicons.
4. Backdrops, wordmark, headline scale, bottom progress, floating tab bar,
   glass radii — **done** in `099953d`.

### D. Conflicts between the two sources — decisions needed

| Item | Proposal dev notes | Designer comps | Recommendation |
|---|---|---|---|
| Corner radius | **16px** | 20–28px | Follow the **comps**. They are the artefact everyone keeps pointing at, and 16 looks tight against the glass. Flag to the designer. |
| Base colour | Calm blue **#E6F0FF** | pale blue/cream gradients | Both work: use `#E6F0FF` as the calm base, comps' gradients as the surface treatment. |
| Accent | (unstated) | **#18D7E7** (stated on comp 08) | `#18D7E7`. |
| Screen count | 14 | 14 | 14. We have 7. |

---

## Why this is the right call — evidence

- Presenting **one question at a time**, phrased conversationally, keeps mobile
  users focused and makes forms feel manageable.
- **Every additional field lowers completion.** Steps 7–9 becoming confirmations
  removes the three heaviest inputs.
- Mobile-optimised onboarding shows roughly **2× completion**; early friction
  (forms, permissions) is the main driver of drop-off.
- Benchmarks put good onboarding completion at 90–95%, against a global average
  near 8–9% — the spread is almost entirely friction.

---

## Phased plan

### Phase 1 — Conversational copy (no new screens, highest value/effort ratio)
Rewrite every existing onboarding screen into first-person Kizu voice using the
proposal's wording. Change CTA labels. This alone converts "form" into
"assistant" and is a copy-only change.

### Phase 2 — Reorder + split to 14 steps
Move "when is rent due" to step 2. Split the compound screens. Add skippable
steps 5 and 12. Add the "what I'm watching" summary (11) and copilot close (13).

### Phase 3 — Lease upload + the Wizard of Oz illusion
Add step 6 upload, the 3-second "Kizu is organizing your lease…" loader, and
turn 7/8/9 into confirmations pre-filled from whatever we can extract. Without
a parser, pre-fill from what the user already told us and still phrase it as a
confirmation — that is exactly what "Wizard of Oz" means here.

### Phase 4 — Visual completion
Mascot layering with floating cards, per-screen poses, isometric option icons.

### Phase 5 — Dashboard as "what I'm watching"
Reframe the dashboard around the step-11 language rather than as a data table.

---

## Open questions for the product owner

1. **Lease parsing**: is there an OCR/extraction budget, or is step 6 purely
   illusion for now (upload stored, fields pre-filled from user answers)?
2. **Mascot poses**: can the designer supply the per-screen poses, or do we
   reuse one image and accept a flatter result?
3. **Radius conflict**: 16px (proposal) vs 20–28px (comps) — designer to settle.
4. **`vault@kizu.app` forwarding** (step 12) — real feature or copy only?
