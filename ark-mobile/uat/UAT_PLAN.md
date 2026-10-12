# Tentzu — connected mobile UAT plan

Status: **Draft — Phase 1 (audit only, no app changes yet)**

App/repository: `ark-mobile/` in `ademola25/kiizzu`
Target environment: production API (`tentzu-api.onrender.com`) — there is no staging
Authorized test scope: **one disposable UAT account per run**. See *Scope* below.

Method adapted from the human-like mobile UAT starter. That package is Flutter;
only its Dart is framework-specific. The boundary, artifact contract, profiles
and result semantics are carried over unchanged.

---

## Purpose

Prove that a person can install Tentzu, register, describe their tenancy through
the 14-step survey, and have the app tell them correctly when their next rent
cheque is due — then mark it paid, undo that, and delete their account. All
through visible UI, with the app calling its own backend.

This is the cycle QA gated launch on: *"Test the complete journey as a new user
without developer assistance"* (pre-launch checklist §9).

## Scope — why it is an account, not a tenant

The starter assumes a tenant/store/workspace to select and verify before
mutating. **Tentzu has no such concept.** A user owns leases; there is no
workspace picker, and a fresh account has no lease at all.

So the scope is the account itself. Each run registers a new one, and the
"visibly verify scope before mutation" rule becomes: *assert the survey's review
step shows the fixture's own building name before submitting it.*

## Non-negotiable boundary

- [ ] UI interactions only for business-state setup and verification.
- [ ] Fixture identity visibly confirmed on the review step before submission.
- [ ] Unique `UAT-<run-id>` fixtures, carried in `building_name` (free text, and
      visible on the dashboard and the review step).
- [ ] Explicit `--allow-live-mutations` flag. **This writes to the production
      database** — there is no staging environment.
- [ ] Credentials excluded from logs, events and screenshots.
- [ ] Every created record in the cleanup ledger.
- [ ] No pre-existing account or lease is ever touched.

### Cleanup policy — forced by a product gap

`leases/urls.py` exposes list, create and detail only. **There is no lease
DELETE, and no UI affordance to remove a lease.** Per-record cleanup is therefore
impossible through the UI.

Account deletion *is* UI-reachable (Settings → Delete account → type `DELETE`)
and cascades to leases, payment schedules, documents and reminder logs. So:

> **One disposable account per run, deleted through the UI as the final step.**

If a run aborts before cleanup, the ledger lists the account email for manual
deletion. Accounts are named `uat+<run-id>@<domain>` so orphans are obvious.

---

## Screen and feature inventory

| Area | Entry point | Major actions | Downstream dependency | Notes |
| --- | --- | --- | --- | --- |
| Welcome | `(onboarding)/welcome` | Get started / Log in | — | Unauthenticated |
| Survey steps 2–13 | `(onboarding)/home` → `extras` | Address, home type, due date, cheque pattern, rent, reminders, contacts, lease doc, lease end, plan, review, extras | Everything below | Draft held client-side in Zustand |
| Account creation | `(onboarding)/save` (step 14) | Name, email, phone, password | Lease POST fires here | First authenticated moment |
| Email verification | `(onboarding)/verify-email` | Enter 6-digit code | Unblocks dashboard | **Needs real email — see blocks** |
| Celebrate | `(onboarding)/celebrate` | Continue | Dashboard | |
| Dashboard | `(tabs)/index` | Countdown hero, payment list, mark paid, undo | Payment status, reminders | The primary workflow |
| Documents | `(tabs)/documents` | Upload, view, delete | — | **Files vanish on deploy — see blocks** |
| Notifications | `(tabs)/notifications` | Reminder history, mark all read | Reminder engine | |
| Settings | `(tabs)/settings` | Profile, channels, plan, logout, delete account | Cleanup | |
| Auth | `(auth)/sign-in`, `email`, `register`, `forgot-password` | Email sign-in, password reset | Session | Apple/Google show "Coming soon" |

### Upstream → downstream relationships to reconcile

1. `rent` + `pattern` + `due-date` → the generated payment schedule → the
   dashboard countdown → each `PaymentCard` amount and due date.
2. `pattern` → **number of cheques** (12 ÷ pattern). A wrong count here is
   invisible on the survey and wrong forever afterwards.
3. Marking cheque 1 paid → `display_status` → `StatusBadge` text → Undo restores
   the prior state **and survives a reload** (the bug fixed in `f785f68`).
4. `country` → currency on every amount, and dial code on step 14.

---

## Risk-based scenario matrix

| Risk area | Smoke | Regression | Full |
| --- | --- | --- | --- |
| Registration + session | Happy path | Duplicate email, weak password, wrong code | Relaunch mid-survey, backgrounding |
| **Schedule correctness** | 1 pattern, verify cheque count + first due date | All 6 patterns (1/2/3/4/6/12) | Leap-year and month-end start dates |
| Payment status | Mark paid → "Paid" | Undo → prior state restored; overdue shows "Overdue" | Due-today boundary across timezones |
| Survey validation | Required fields block Continue | Back-navigation preserves the draft | Long / Unicode / emoji building names |
| Money + locale | One country | Two countries, two currencies | Missing Intl data fallback (`formatMoney`) |
| Documents | Skip | Upload + view + delete | Large file, wrong type |
| Layout | iPhone 15 | Narrow (iPhone SE) + keyboard open | Android + text scaling |

**Highest risk is the schedule.** Everything else is presentation; a wrong due
date is the product failing at its only job, and it is silent.

---

## Fixture catalogue

| Fixture | Purpose | Mutation | Cleanup |
| --- | --- | --- | --- |
| `UAT-<run>-Simple` | Happy path, quarterly pattern | 1 account, 1 lease, 4 cheques | Account delete |
| `UAT-<run>-Monthly` | Highest cheque count (12) | 1 lease, 12 cheques | Account delete |
| `UAT-<run>-Unicode` | Display safety — long name + non-Latin script | 1 lease | Account delete |
| `UAT-<run>-Boundary` | Month-end start date | 1 lease | Account delete |

Regression and full profiles create additional accounts rather than reusing one,
since account deletion is the only cleanup available.

---

## Selector audit

Measured, not estimated: **0 `testID`s, 25 `accessibilityLabel`s, 26
`accessibilityRole`s.**

### Already selectable — no work needed

Critical actions already carry semantics:

```
"Mark cheque <n> as paid"   "Mark this payment as paid"
"Delete account"            "Mark all <n> as read"
"Show password"/"Hide password"   Snackbar action ("Undo")
```

Primary buttons render `primaryLabel` as visible text — *"That's my place"*,
*"That's the one"*, *"Set my reminders"* — which Maestro can tap directly. Text
repeats across steps (`"That's right"` on both `home-type` and `lease-end`) but
never within one screen, so it stays unambiguous.

### Needs instrumentation

| Target | Count | Why | Cost |
| --- | --- | --- | --- |
| `home` address fields | 10 | Several share labels; ambiguous by text | **Free** — `TentzuField` spreads `...props`, so `testID` passes to the `TextInput` |
| `save` account fields | 7 | Same | **Free** |
| `contacts`, `lease-end`, `due-date`, `rent` fields | 9 | Same | **Free** |
| `TentzuOption` cards | ~8 | Selected state not exposed to semantics | Needs a `testID` prop — no prop spread |
| `TentzuButton` | all steps | Only if a label becomes ambiguous | Needs a `testID` prop — no prop spread |
| `StatusBadge` | per cheque | Assert *"Paid"* / *"Overdue"* text | Free — visible text |

**Three components need a one-line `testID` prop added** (`TentzuButton`,
`TentzuOption`, `TentzuScreen`). Everything else is already reachable.

Naming follows the starter's convention — describe the control, never encode a
list index:

```
onboarding-home-building      onboarding-save-email
onboarding-pattern-quarterly  dashboard-payment-mark-paid
```

---

## Environment blocks to resolve before a green run

These are **blocked**, not failed, and must not be reported as passes.

1. **Email verification needs real email.** `RESEND_API_KEY` is unset, so no code
   is delivered. `EXPOSE_OTP_CODES=true` currently returns the code in the API
   response and renders it on screen — the suite can read it from the visible
   card. **That card disappears the moment real email is configured**, so the
   step must be written to prefer the visible code and be marked blocked, not
   failed, when it is absent.
2. **~70-second cold start.** The API is on Render's free tier. Every bounded
   wait that crosses a cold start needs a timeout above that, or the first run
   fails for reasons that have nothing to do with the app.
3. **Documents are erased on deploy.** Upload assertions can pass within a run
   and fail across deploys. Keep document scenarios inside a single run.
4. **Reminders have never run in production.** The scheduled job exists now but
   is not deployed, so notification-history scenarios are `blocked` until it is.
5. **Stripe prices are placeholders** — checkout 502s. Billing scenarios are
   `skipped`, not failed.

---

## Execution checklist

### Phase 1 — audit and plan (this document)

- [x] Read the starter package and its boundary rules.
- [x] Map routes, survey order and per-step controls.
- [x] Measure existing selectors.
- [x] Decide the scope and cleanup policy.
- [x] Identify environment blocks.
- [ ] **Agree the mutation policy before any run — this writes to production.**

### Phase 2 — framework and vertical slice

- [ ] Add `testID` props to `TentzuButton`, `TentzuOption`, `TentzuScreen`.
- [ ] Add `testID`s to the 26 survey/account fields.
- [ ] Maestro config, runner, manifest/report/ledger generators, mutation guard.
- [ ] Prove the smoke journey on the iOS simulator.
- [ ] Capture every major screen.

### Phase 3 — risk-based coverage

- [ ] All six cheque patterns, asserting cheque count and first due date.
- [ ] Undo survives a reload.
- [ ] Validation blocks, back-navigation preserves the draft.
- [ ] Long / Unicode / emoji display safety.

### Phase 4 — downstream reconciliation

- [ ] Survey inputs → schedule → dashboard → each card's amount and date.
- [ ] First, middle and last cheque in the 12-cheque fixture.
- [ ] No optional field ever renders `null` or `undefined`.

### Phase 5 — platform review

- [ ] iOS simulator + Android emulator.
- [ ] iPhone SE width, keyboard open, bottom safe area.
- [ ] Classify every failure: product defect / test defect / environment block /
      unsupported.

### Closure

- [ ] Inspect screenshots, not just statuses.
- [ ] No secrets in the repo or artifacts.
- [ ] Every created account deleted, or listed for manual deletion.

---

## The smoke journey

```
launch
  → Get started
  → survey steps 2-13  (building name = UAT-<run>-Simple, quarterly pattern)
  → step 11 review: assert the building name and rent are visible
  → step 14: register uat+<run-id>@<domain>
  → verify email using the visible code card
  → dashboard: assert countdown, and 4 cheques for a quarterly pattern
  → assert cheque 1 amount and due date match what the survey was given
  → mark cheque 1 paid  → assert badge reads "Paid"
  → Undo                → assert badge returns to its prior state
  → reload              → assert it is still not "Paid"
  → Settings → Delete account → type DELETE → assert signed out
```

One pass exercises registration, the survey, the schedule engine, the payment
status work from `63b6569`, the Undo from `f785f68`, and cleanup.

---

## Result record

- Commit / diff hash:
- Platform / device:
- Profile / scenarios:
- Result:
- Artifact directory:
- Accounts created:
- Cleanup status:
- Product defects:
- Test defects:
- Environment blocks:
