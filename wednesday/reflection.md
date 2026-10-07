# Reflection — Development's Contribution to Quality

Author: Adriana Chipana · Track: Development · Day: Wednesday

## What Development can do to make this flow more testable

- **Keep the `data-testid` hooks as complete as they are.** Every button, input and row in booking and cancellation already has one, and row hooks include the appointment id (`appointment-row-<id>`). That's what let the tests target their own data instead of "the first row". New screens should follow the same convention.
- **Make the success signal durable and specific.** Booking and cancelling show a toast, but it's generic ("Appointment booked successfully"), it has no hook of its own, and it disappears after a few seconds. I missed it on Monday and Tuesday because I checked too late. A message with the doctor, date and time (as MEDIC-101 asks), and a hook that stays until it's dismissed, would help users and tests.
- **Give tests a way to own and remove their data.** There's no delete endpoint, so every run leaves cancelled rows behind, and there's no supported way to create a `completed` appointment. A test-only cleanup or seeding endpoint, disabled outside test environments, would make runs repeatable.
- **Format dates in one place, in the clinic's time zone.** The dashboard shows the right time and the list and detail don't (BUG-06). A single formatter would fix the bug and let tests assert the time on any screen.
- **Validate on the server, not only in the UI.** Past dates, taken slots, invalid status changes and unknown doctors are all accepted by the API. Most of the defects this week would have been caught by one validation layer plus a few API tests.

## What selector, data, or API issue made testing harder

- **Time zone shift:** I couldn't assert the date or time shown in the list, because it changes with the browser's zone. I had to check the API response instead, so the UI test is weaker than it should be.
- **Hydration:** the detail page re-renders after loading. A click on the server-rendered HTML can be lost, so the tests have to wait for the network to settle first.
- **No conflict check:** because a taken slot can still be booked, the booking test can't prove the slot was free, and any test data plan can collide with other people's bookings in the shared environment.
- **Shared, changing environment:** appointments on my own account were cancelled overnight by someone else. Tests can't trust existing data, so each test creates what it needs.
- **Credentials in traces:** traces are always on and record the password typed at login. They can't be shared as-is.
- **Write the AC's example data as rules.** MEDIC-101 uses fixed dates that are already in the past and shared accounts. A test can only follow it by adapting it, and every adaptation is a place where the test and the AC can drift apart.

## What I would improve before adding this to CI

- **Log in through the API once and reuse the session** (Playwright `storageState`) instead of typing the password in every test. It's faster, and it keeps credentials out of traces and reports.
- **Create a fresh patient per run** through the API (the Wednesday stretch fixture), so tests never share an account.
- **Decide how CI treats the AC tests that fail by design** (SCEN-MED101-01 and -02 today): run them in a separate project, or mark them `test.fail()` with the gap as the reason, so the pipeline stays green for regressions but turns red when a fix lands and the annotation must be removed.
- **Keep credentials as CI secrets** and fail fast with a clear message if they're missing (already done locally).
- **Run on a clean environment** or a dedicated test doctor, so parallel pipelines can't book the same slots.
