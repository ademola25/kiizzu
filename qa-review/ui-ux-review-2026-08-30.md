# Tentzu App — UI/UX Review & Feedback

> **Source:** `ui-ux-review-2026-08-30.pdf` (QA, received 2026-08-30)
> **Scope:** the **mobile app** (`ark-mobile/`) — not the waitlist site.
> Wording below is verbatim from the PDF; only the structure is markdown.

I've reviewed the current Tentzu app experience and noted the following UI/UX and copy
improvements that should be addressed.

---

## 1. Overall UI & Typography

- [x] The text and some interface elements currently feel too large.
- [x] Reduce the text size where appropriate and review the spacing and visual hierarchy to
      create a cleaner, more polished mobile experience.

## 2. Payment Reminder Screen

**Current copy**

> "I'll nudge you 30, 7 and 1 day before every payment. In-app is free and always there — the
> rest come with a paid plan."

**Recommended copy**

> "Get reminders 30, 7, and 1 day before each payment is due. Payment reminders are free;
> additional features are available with a paid plan."

This version is shorter, clearer, and easier to understand at a glance.

- [x] Applied verbatim as the `subtitle` on onboarding step 7
      (`(onboarding)/reminders.tsx`, `a3b9917`).

**Recommended headline**

> Never Miss a Payment

This is more direct and user-focused than the current headline.

- [x] Applied as "Never miss a payment." — sentence case to match the other
      onboarding headlines (`(onboarding)/reminders.tsx`, `a3b9917`).

**CTA / Flow**

- [x] Please review the **Continue** and **Skip for Now** buttons.
- [x] When the user chooses to skip this step, "Skip for Now" should be the only relevant
      action. Having both actions presented together can make the flow feel unnecessarily
      complicated.

The goal is to make the decision clear and reduce friction.

## 3. Onboarding — Page 11

- [x] Please restructure the copy on Page 11. The text should be:
  - Shorter and easier to scan.
  - More concise and user-friendly.
  - Better structured with a clear headline and supporting text.
  - Consistent in tone with the rest of the onboarding experience.

## 4. Onboarding — Page 12

- [x] Please also restructure the copy on Page 12. The current text should be simplified to make the
      information easier to understand without requiring the user to read too much.

The onboarding screens should communicate **one clear message at a time**.

## 5. Onboarding — Page 14

**Phone Number**

- [x] Please move the country code to the side of the phone-number input field so that the country
      code and phone number are clearly separated.

**Password Fields**

- [x] Please add a **Show/Hide Password** option to the password field.
- [ ] Also add the same **Show/Hide Password** option to the **Confirm Password** field.
      **Not done — there is no Confirm Password field.** Signup asks for one password only.
      Show/Hide now serves the stated purpose (letting the user check what they typed), and
      adding a second field would contradict the pre-launch review's "only ask for
      information that is necessary at registration". Say the word if you want it anyway.

This will make it easier for users to verify what they have entered and reduce password-entry
errors.

## 6. "Marked as Paid" — Undo Option

- [x] When a user marks a payment as Paid, there should be an option to reverse the action in
      case it was done accidentally.

**Recommended confirmation message**

> Payment marked as paid.

**Recommended action**

> Undo

Using "Undo" is preferable to "Reverse" because it is simpler and immediately understandable.
