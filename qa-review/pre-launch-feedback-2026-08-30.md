# Tentzu — Pre-Launch Improvement Feedback

> **Source:** `pre-launch-feedback-2026-08-30.pdf` (QA, received 2026-08-30)
> **Audience:** "For IT Team – Final Review Before Launch"
> **Scope:** the **mobile app** (`ark-mobile/`) — not the waitlist site.
> Wording below is verbatim from the PDF; only the structure is markdown.

**Purpose:** The app has a good foundation. Before launch, the main focus should be on making
the existing features stable, simple and reliable, especially the lease, payment and reminder
functions.

---

## 1. Onboarding & User Registration

- [ ] Keep the onboarding short and easy for a first-time user.
- [ ] Only ask for information that is necessary at registration.
- [ ] Make required fields clear and allow users to go back and edit information.
- [ ] Check that OTP, login and password recovery work properly.

## 2. Lease / Tenancy Setup

- [ ] Make adding a lease simple and easy to follow.
- [ ] Check lease start date, expiry date and payment dates carefully.
- [ ] Users should be able to view, replace or delete uploaded documents.
- [ ] Show a clear confirmation after a lease is successfully added.

## 3. Cheque / Payment Schedule — 🔴 HIGH PRIORITY

- [ ] The amount, due date, payment number and payment status must always be correct.
- [ ] Prevent duplicate payments or duplicate entries.
- [ ] Allow users to correct information if something was entered incorrectly.
- [ ] Use clear statuses: **Paid**, **Upcoming**, **Due Today** and **Overdue**.

## 4. Reminders & Notifications — 🔴 HIGH PRIORITY

- [ ] Test all scheduled reminders, including 30-day, 7-day and 1-day reminders.
- [ ] Reminders must be sent on the correct date and time.
- [ ] Once a payment is marked Paid, related reminders should stop.
- [ ] Tapping a notification should open the correct lease or payment.
- [ ] Make sure notifications do not appear twice.

## 5. Dashboard & Ease of Use

- [ ] The home screen should immediately show the next payment, due date and lease status.
- [ ] Users should not need to open several pages to find important information.
- [ ] Keep buttons, icons, fonts, colours and page layouts consistent.
- [ ] Make important actions obvious and easy to find.

## 6. Error Messages & Internet Connection

- [ ] Replace technical error messages with simple instructions.
- [ ] Show a clear loading indicator when the app is processing something.
- [ ] Test slow internet, no internet and internet interruption while saving.
- [ ] Prevent users from submitting the same information multiple times.

## 7. Documents & Data Security

- [ ] Test small and large document uploads.
- [ ] Users should know when a document has uploaded successfully.
- [ ] Documents and personal information must be protected.
- [ ] One user must never be able to access another user's information.
- [ ] Check logout, password reset and account access security.

## 8. Subscription / Paid Features

- [ ] Clearly show which features are free and which require payment.
- [ ] Show the subscription price and billing period clearly.
- [ ] Test successful payment, failed payment and cancellation.
- [ ] Users should be able to see their current plan.

## 9. Final Device & UAT Testing

- [ ] Test different Android versions and screen sizes.
- [ ] Check keyboard behaviour, scrolling, pop-ups and buttons.
- [ ] Test the complete journey as a new user without developer assistance.
- [ ] Test: Register → Login → Add Lease → Upload Contract → Payment Schedule → Reminder →
      Mark Paid.
- [ ] Do a final crash, performance and security check before launch.

---

## Pre-Launch Priority

- **Must be 100% reliable:** payment calculations, due dates, reminders, notifications,
  login/security and user data.
- **Do not add many new features at this stage.** Fix and test the existing core functions
  first.
- **Complete one full User Acceptance Testing (UAT) cycle** using real-life scenarios before
  going live.
