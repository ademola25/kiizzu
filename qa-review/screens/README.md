# Screens after the QA fixes

Captured at 390×844 (iPhone 14 class) from the app running under
`react-native-web` (`npx expo start --web`).

**Read these for layout, copy and type size — not for final visual fidelity.**
Two things render differently in a browser than on device:

- The `Frost` glass blur sits *over* input text on web, so field contents look
  like grey smudges. On device the blur is behind the text.
- Font rasterisation and shadows differ from iOS/Android.

A device build is the check that matters before sign-off. The simulator route
was not usable here: the app is not installed on it, and with no `idb`/`fbsimctl`
there is no way to tap between screens programmatically.

| Shot | Screen | What changed |
|---|---|---|
| `01-welcome.jpeg` | Welcome | Wordmark 26→20, headline 34→30 |
| `07-reminders.jpeg` | Step 7 | New headline + subtitle (QA's wording) |
| `08-contacts.jpeg` | Step 8 | Single action when empty — "Continue" is gone |
| `11-plan.jpeg` | Step 11 | Shortened subtitle (empty-draft state shown) |
| `12-watching.jpeg` | Step 12 | One message + supporting line |
| `13-extras.jpeg` | Step 13 | Single action when nothing selected |
| `14-save-account.jpeg` | Step 14 (top) | Headline/type scale |
| `14-save-phone-password.jpeg` | Step 14 (fields) | Country beside phone; eye toggle on password |

**Not captured: the dashboard.** Its countdown ring animates on a continuous
`requestAnimationFrame` loop, so Chrome's screenshot never gets a stable frame
and the capture times out — freezing CSS animations does not help, because the
loop is driven by React Native's Animated in JS. The dashboard was verified by
reading its rendered text instead, against a seeded account carrying one cheque
in each state:

```
hero      2 · 6 overdue · "This one's late" · AED 30,000 · Due 24 Aug 2026
Cheque 1  21 Jul 2026   Paid
Cheque 3  30 Aug 2026   Due today
Cheque 4  29 Sept 2026  Funds ready
Cheque 5  28 Dec 2026   Upcoming
```

The Undo snackbar is likewise uncaptured — it needs a tap on "Mark as paid".
